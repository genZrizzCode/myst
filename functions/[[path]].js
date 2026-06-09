const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname === "/" && !url.searchParams.has("url")) {
    return new Response(renderHome(), { headers: HTML_HEADERS });
  }

  if (url.pathname === "/proxy" || (url.pathname === "/" && url.searchParams.has("url"))) {
    return handleProxy(request, url);
  }

  return new Response(renderNotFound(), {
    status: 404,
    headers: HTML_HEADERS,
  });
}

async function handleProxy(request, pageUrl) {
  const targetInput = pageUrl.searchParams.get("url");
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

  const proxyUrl = new URL("/proxy", origin);
  proxyUrl.searchParams.set("url", resolved.toString());
  return proxyUrl.toString();
}

async function rewriteResponse(response, targetUrl, origin) {
  const headers = new Headers(response.headers);
  stripSecurityHeaders(headers);

  const contentType = headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    const rewriter = new HTMLRewriter()
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
    return new Response(rewritten, {
      status: response.status,
      headers,
    });
  }

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

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>myst</title>
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
      <form action="/proxy" method="get">
        <input
          name="url"
          type="url"
          placeholder="https://example.com"
          autocomplete="url"
          inputmode="url"
          required
        />
        <button type="submit">Open site</button>
      </form>
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
