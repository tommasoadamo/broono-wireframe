# Password Gate Setup

This site is protected by `_worker.js`. The Worker must run in front of the static files, otherwise the HTML can still be downloaded directly.

## Cloudflare Pages

1. Deploy the repo with `_worker.js` in the published output root.
2. Add these Cloudflare Pages environment variables/secrets:
   - `SECURE_KEY`: password users enter.
   - `SESSION_SECRET`: long random string used to sign the session cookie.
3. Redeploy.

After a successful password check, the Worker sets an `HttpOnly` session cookie. The cookie has no `Max-Age`, so users enter the password once per browser session. The signed token also expires after 12 hours.

## Standalone Worker In Front Of Another Host

Use the same Worker code and add one more variable:

- `ORIGIN_URL`: the protected static origin, for example `https://example.github.io/broono-wireframe`

Route the custom domain through the Worker. Do not expose the origin URL publicly if the content needs to remain private.
