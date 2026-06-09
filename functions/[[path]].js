const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);
const STICKY_TARGET_COOKIE = "myst_target";
const TARGET_TOKEN_PREFIX = "b64.";
const PROXY_BRIDGE_SCRIPT = `(() => {
  const cookieName = ${JSON.stringify(STICKY_TARGET_COOKIE)};
  const tokenPrefix = ${JSON.stringify(TARGET_TOKEN_PREFIX)};

  const base64UrlEncode = (bytes) => {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
  };

  const base64UrlDecode = (value) => {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const encodeTarget = (value) => tokenPrefix + base64UrlEncode(new TextEncoder().encode(String(value)));

  const decodeTarget = (value) => {
    if (!value) return "";
    if (!value.startsWith(tokenPrefix)) return value;
    try {
      return new TextDecoder().decode(base64UrlDecode(value.slice(tokenPrefix.length)));
    } catch {
      return "";
    }
  };

  const readCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : "";
  };

  const writeCookie = (name, value) => {
    document.cookie = name + "=" + encodeURIComponent(value) + "; Path=/; SameSite=Lax";
  };

  const current = new URL(location.href);
  const fromQuery = decodeTarget(current.searchParams.get("t"));
  if (fromQuery) {
    sessionStorage.setItem(cookieName, fromQuery);
    writeCookie(cookieName, fromQuery);
  }

  const storedTarget = () => fromQuery || sessionStorage.getItem(cookieName) || readCookie(cookieName);

  const resolveTarget = (input) => {
    const target = storedTarget();
    if (!target) return null;
    try {
      return new URL(input, target).toString();
    } catch {
      return null;
    }
  };

  const proxify = (input) => {
    const resolved = resolveTarget(input);
    return resolved ? "/p?t=" + encodeURIComponent(encodeTarget(resolved)) : input;
  };

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function(state, title, url) {
    if (typeof url === "string" && url.length) {
      return originalPushState(state, title, proxify(url));
    }
    return originalPushState(state, title, url);
  };

  history.replaceState = function(state, title, url) {
    if (typeof url === "string" && url.length) {
      return originalReplaceState(state, title, proxify(url));
    }
    return originalReplaceState(state, title, url);
  };

  addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || /^(javascript:|mailto:|tel:|data:)/i.test(href)) return;

    const proxied = proxify(href);
    if (proxied === href) return;

    event.preventDefault();
    location.assign(proxied);
  }, true);

  addEventListener("submit", (event) => {
    const form = event.target;
    if (!form || form.tagName !== "FORM") return;

    const action = form.getAttribute("action") || location.pathname + location.search;
    const proxiedAction = proxify(action);
    if (proxiedAction === action) return;

    const method = (form.getAttribute("method") || "get").toUpperCase();
    if (method === "GET") {
      event.preventDefault();
      const url = new URL(proxiedAction, location.href);
      const params = new URLSearchParams(new FormData(form));
      for (const [key, value] of params.entries()) {
        url.searchParams.append(key, value);
      }
      location.assign(url.toString());
      return;
    }

    form.action = proxiedAction;
  }, true);
})();`;

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = getTargetFromUrl(url);
  const stickyTarget = getStickyTarget(request);

  if (url.pathname === "/" && !target) {
    return new Response(renderHome(), { headers: HTML_HEADERS });
  }

  if (url.pathname === "/p" || url.pathname === "/proxy" || (url.pathname === "/" && target)) {
    return handleProxy(request, url, target);
  }

  if (!target && stickyTarget) {
    const fallbackTarget = resolveFallbackTarget(url, stickyTarget);
    if (fallbackTarget) {
      return Response.redirect(buildProxyUrl(fallbackTarget, url.origin), 302);
    }
  }

  return new Response(renderNotFound(), {
    status: 404,
    headers: HTML_HEADERS,
  });
}

function getTargetFromUrl(pageUrl) {
  const value = pageUrl.searchParams.get("t") || pageUrl.searchParams.get("url");
  if (!value) return null;
  return decodeTargetToken(value);
}

async function handleProxy(request, pageUrl, targetInput) {
  if (!targetInput) {
    return new Response(renderError("Enter a site to open."), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  let targetUrl;
  try {
    targetUrl = normalizeTargetUrl(targetInput);
  } catch (error) {
    return new Response(renderError(error.message), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  const upstreamRequest = buildUpstreamRequest(request, targetUrl);
  const upstreamResponse = await fetch(targetUrl, upstreamRequest);

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
    const location = upstreamResponse.headers.get("location");
    if (location) {
      const redirected = resolveAndProxyUrl(location, targetUrl, pageUrl.origin);
      return Response.redirect(redirected, upstreamResponse.status);
    }
  }

  return rewriteResponse(upstreamResponse, targetUrl, pageUrl.origin);
}

function normalizeTargetUrl(input) {
  const trimmed = input.trim();
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(candidate);

  if (!SAFE_PROTOCOLS.has(url.protocol)) {
    throw new Error("Only http and https URLs are allowed.");
  }

  return url;
}

function buildUpstreamRequest(request, targetUrl) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  headers.set("accept-encoding", "identity");
  headers.set("origin", targetUrl.origin);
  headers.set("referer", targetUrl.toString());

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return init;
}

function resolveAndProxyUrl(location, baseUrl, origin) {
  const resolved = new URL(location, baseUrl);
  if (!SAFE_PROTOCOLS.has(resolved.protocol)) {
    return origin;
  }

  return buildProxyUrl(resolved.toString(), origin);
}

function buildProxyUrl(target, origin) {
  const proxyUrl = new URL("/p", origin);
  proxyUrl.searchParams.set("t", encodeTargetToken(target));
  return proxyUrl.toString();
}

function resolveFallbackTarget(requestUrl, stickyTarget) {
  try {
    const base = new URL(stickyTarget);
    if (!SAFE_PROTOCOLS.has(base.protocol)) {
      return null;
    }

    const candidate = new URL(requestUrl.pathname + requestUrl.search + requestUrl.hash, base.origin);
    return candidate.toString();
  } catch {
    return null;
  }
}

function getStickyTarget(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|; )${STICKY_TARGET_COOKIE}=([^;]*)`));
  if (!match) return "";

  try {
    return decodeTargetToken(decodeURIComponent(match[1])) || "";
  } catch {
    return "";
  }
}

async function rewriteResponse(response, targetUrl, origin) {
  const headers = new Headers(response.headers);
  stripSecurityHeaders(headers);

  const contentType = headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
    const rewriter = new HTMLRewriter()
      .on("head", new HeadScriptInjector())
      .on("a[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("area[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("link[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("script[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("img[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("img[srcset]", new SrcsetRewriter(targetUrl, origin))
      .on("source[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("source[srcset]", new SrcsetRewriter(targetUrl, origin))
      .on("iframe[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("form[action]", new AttributeRewriter("action", targetUrl, origin))
      .on("audio[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("video[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("video[poster]", new AttributeRewriter("poster", targetUrl, origin))
      .on("object[data]", new AttributeRewriter("data", targetUrl, origin))
      .on("embed[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("meta[http-equiv=refresh]", new MetaRefreshRewriter(targetUrl, origin))
      .on("[style]", new InlineStyleRewriter(targetUrl, origin));

    return rewriter.transform(new Response(response.body, { headers, status: response.status }));
  }

  if (contentType.includes("text/css")) {
    const css = await response.text();
    const rewritten = rewriteCss(css, targetUrl, origin);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
    return new Response(rewritten, {
      status: response.status,
      headers,
    });
  }

  headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function stripSecurityHeaders(headers) {
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.delete("x-frame-options");
  headers.delete("cross-origin-embedder-policy");
  headers.delete("cross-origin-opener-policy");
  headers.delete("cross-origin-resource-policy");
}

function proxifyUrl(value, baseUrl, origin) {
  const resolved = new URL(value, baseUrl);
  if (!SAFE_PROTOCOLS.has(resolved.protocol)) {
    return value;
  }

  const proxyUrl = new URL("/proxy", origin);
  proxyUrl.searchParams.set("url", resolved.toString());
  return proxyUrl.toString();
}

function rewriteCss(css, baseUrl, origin) {
  return css
    .replace(/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi, (match, target) => {
      const proxied = proxifyUrl(target, baseUrl, origin);
      return match.replace(target, proxied);
    })
    .replace(/url\(\s*["']?([^"')]+)["']?\s*\)/gi, (match, target) => {
      if (/^data:|^blob:|^#/.test(target.trim())) {
        return match;
      }
      const proxied = proxifyUrl(target, baseUrl, origin);
      return `url("${proxied}")`;
    });
}

class AttributeRewriter {
  constructor(attribute, baseUrl, origin) {
    this.attribute = attribute;
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const value = element.getAttribute(this.attribute);
    if (!value || /^javascript:/i.test(value) || /^mailto:/i.test(value) || /^tel:/i.test(value)) {
      return;
    }

    element.setAttribute(this.attribute, proxifyUrl(value, this.baseUrl, this.origin));
  }
}

class SrcsetRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const srcset = element.getAttribute("srcset");
    if (!srcset) return;

    const rewritten = srcset
      .split(",")
      .map((entry) => {
        const parts = entry.trim().split(/\s+/);
        const target = parts.shift();
        if (!target) return entry;
        const proxied = proxifyUrl(target, this.baseUrl, this.origin);
        return [proxied, ...parts].join(" ");
      })
      .join(", ");

    element.setAttribute("srcset", rewritten);
  }
}

class MetaRefreshRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const content = element.getAttribute("content");
    if (!content) return;

    const rewritten = content.replace(/url\s*=\s*([^;]+)/i, (_, target) => {
      const cleanTarget = target.trim().replace(/^['"]|['"]$/g, "");
      const proxied = proxifyUrl(cleanTarget, this.baseUrl, this.origin);
      return `url=${proxied}`;
    });

    element.setAttribute("content", rewritten);
  }
}

class InlineStyleRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const style = element.getAttribute("style");
    if (!style) return;

    element.setAttribute("style", rewriteCss(style, this.baseUrl, this.origin));
  }
}

class HeadScriptInjector {
  element(element) {
    element.append(`<script>${escapeScript(PROXY_BRIDGE_SCRIPT)}</script>`, {
      html: true,
    });
  }
}

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>myst</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Michroma&display=swap" rel="stylesheet" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #08111f;
      --bg2: #0f1f35;
      --card: rgba(10, 18, 31, 0.72);
      --line: rgba(174, 211, 255, 0.18);
      --text: #edf5ff;
      --muted: #9db4d6;
      --accent: #7cc7ff;
      --accent2: #9cf0dd;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(124, 199, 255, 0.18), transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(156, 240, 221, 0.12), transparent 24%),
        linear-gradient(160deg, var(--bg), var(--bg2));
    }
    main {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .shell {
      width: min(920px, 100%);
      background: var(--card);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: clamp(24px, 5vw, 40px);
      overflow: hidden;
      position: relative;
    }
    .shell::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(124, 199, 255, 0.09), transparent 42%, rgba(156, 240, 221, 0.08));
      pointer-events: none;
    }
    .kicker {
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.78rem;
      color: var(--accent2);
      margin: 0 0 12px;
    }
    h1 {
      margin: 0;
      font-family: "Michroma", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: clamp(3rem, 10vw, 5.8rem);
      line-height: 0.92;
      letter-spacing: -0.06em;
    }
    .subtitle {
      margin: 18px 0 0;
      max-width: 58ch;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.6;
    }
    form {
      display: grid;
      gap: 12px;
      margin-top: 28px;
      grid-template-columns: 1fr auto;
    }
    input, button {
      border-radius: 18px;
      border: 1px solid var(--line);
      font: inherit;
      padding: 16px 18px;
    }
    input {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      outline: none;
    }
    input::placeholder { color: rgba(237, 245, 255, 0.48); }
    input:focus {
      border-color: rgba(124, 199, 255, 0.7);
      box-shadow: 0 0 0 4px rgba(124, 199, 255, 0.12);
    }
    button {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #07111d;
      font-weight: 700;
      cursor: pointer;
      min-width: 152px;
    }
    .meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 18px;
      color: var(--muted);
      font-size: 0.93rem;
    }
    .pill {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.05);
      padding: 10px 14px;
      border-radius: 999px;
    }
    .note {
      margin-top: 24px;
      color: var(--muted);
      font-size: 0.9rem;
    }
    @media (max-width: 680px) {
      form { grid-template-columns: 1fr; }
      button { width: 100%; }
      .shell { border-radius: 22px; }
    }
  </style>
</head>
<body>
  <main>
    <section class="shell">
      <p class="kicker">raincloud proxy</p>
      <h1>myst</h1>
      <p class="subtitle">
        A lightweight browser-based tunnel for websites. Paste a URL, and myst will fetch and rewrite it so you can browse through Cloudflare Pages Functions.
      </p>
      <form id="proxy-form" action="/p" method="get">
        <input
          id="site-input"
          type="text"
          placeholder="https://example.com"
          autocomplete="url"
          inputmode="url"
          required
        />
        <input id="encoded-target" name="t" type="hidden" />
        <button type="submit">Open site</button>
      </form>
      <script>
        (() => {
          const form = document.getElementById('proxy-form');
          const input = document.getElementById('site-input');
          const encodedTarget = document.getElementById('encoded-target');
          if (!form || !input) return;

          const tokenPrefix = ${JSON.stringify(TARGET_TOKEN_PREFIX)};

          const base64UrlEncode = (bytes) => {
            let binary = "";
            for (const byte of bytes) binary += String.fromCharCode(byte);
            return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
          };

          const encodeTarget = (value) => {
            const bytes = new TextEncoder().encode(String(value));
            return tokenPrefix + base64UrlEncode(bytes);
          };

          form.addEventListener('submit', () => {
            const raw = input.value.trim();
            encodedTarget.value = raw ? encodeTarget(raw) : "";
          });
        })();
      </script>
      <div class="meta">
        <span class="pill">Works on macOS</span>
        <span class="pill">Works on Chromebook</span>
        <span class="pill">Works on Windows</span>
      </div>
      <p class="note">
        Use with sites you are allowed to access. Some advanced web apps may need extra proxy rewriting support.
      </p>
    </section>
  </main>
</body>
</html>`;
}

function renderError(message) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>myst</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #08111f;
      color: #edf5ff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 640px;
      width: 100%;
      padding: 28px;
      border-radius: 24px;
      background: rgba(10, 18, 31, 0.8);
      border: 1px solid rgba(174, 211, 255, 0.18);
    }
    a { color: #7cc7ff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>myst</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="/">Go back</a></p>
  </div>
</body>
</html>`;
}

function renderNotFound() {
  return renderError("That route does not exist.");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScript(value) {
  return String(value)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function encodeTargetToken(value) {
  const bytes = new TextEncoder().encode(String(value));
  return TARGET_TOKEN_PREFIX + base64UrlEncode(bytes);
}

function decodeTargetToken(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith(TARGET_TOKEN_PREFIX)) {
    return value;
  }

  try {
    const bytes = base64UrlDecode(value.slice(TARGET_TOKEN_PREFIX.length));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
