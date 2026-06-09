# myst

`myst` is a Cloudflare Pages site with a built-in proxy called `raincloud`.

It is designed to:

- keep the site name lowercase as `myst`
- run on Cloudflare Pages Functions
- work in common browsers on macOS, Chromebook, and Windows
- tunnel to websites through a proxied route
- keep proxied targets in an obfuscated base64url form like `/p?t=b64...`

## What It Includes

- a homepage at `/`
- a proxy endpoint at `/p`
- compatibility support for the older `/proxy?url=...` shape
- HTML rewriting for links, forms, media, and common navigation

## How To Use

1. Open the site.
2. Enter a website URL.
3. `myst` will route you through `raincloud` and keep browsing inside the proxy.

## Deploying To Cloudflare Pages

1. Create a new Cloudflare Pages project.
2. Connect this repository.
3. Make sure Cloudflare Pages Functions are enabled.
4. Deploy.

The proxy code lives in:

- [`functions/[[path]].js`](./functions/[[path]].js)

## Notes

- The base64url token is only obfuscation, not security.
- Some advanced web apps may need extra proxy rewriting support.
- Use the proxy only for sites you are allowed to access.

## License

MIT. See [`LICENSE`](./LICENSE).
