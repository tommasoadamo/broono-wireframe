// Configure these Cloudflare secrets/variables:
// SECURE_KEY: the password users enter.
// SESSION_SECRET: a long random string used to sign the browser-session cookie.
// ORIGIN_URL: optional, only needed for a standalone Worker in front of another host.
const COOKIE_NAME = "__broono_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const textEncoder = new TextEncoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/__auth" && request.method === "POST") {
      return handleAuth(request, env);
    }

    if (url.pathname === "/__logout") {
      return redirectWithClearedSession(url);
    }

    if (await hasValidSession(request, env)) {
      return fetchProtectedContent(request, env);
    }

    if (acceptsHtml(request)) {
      return loginPage();
    }

    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }
};

async function handleAuth(request, env) {
  const formData = await request.formData();
  const submittedKey = String(formData.get("secureKey") || "");
  const configuredKey = getRequiredSecret(env, "SECURE_KEY");

  if (!constantTimeEqual(submittedKey, configuredKey)) {
    return loginPage("Incorrect password.");
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;
  const token = await signSession(`${expiresAt}`, env);
  const destination = safeReturnPath(String(formData.get("returnTo") || "/"));

  return new Response(null, {
    status: 303,
    headers: {
      "cache-control": "no-store",
      "location": destination,
      "set-cookie": `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    }
  });
}

async function hasValidSession(request, env) {
  const cookie = parseCookies(request.headers.get("cookie")).get(COOKIE_NAME);
  if (!cookie) return false;

  const [expiresAtRaw, signature] = cookie.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = await hmacHex(expiresAtRaw, getRequiredSecret(env, "SESSION_SECRET"));
  return constantTimeEqual(signature || "", expected);
}

async function signSession(expiresAt, env) {
  const signature = await hmacHex(expiresAt, getRequiredSecret(env, "SESSION_SECRET"));
  return `${expiresAt}.${signature}`;
}

async function hmacHex(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return [...new Uint8Array(signature)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fetchProtectedContent(request, env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS.fetch(request);
  }

  const originUrl = env.ORIGIN_URL;
  if (!originUrl) {
    return new Response("Origin is not configured.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(originUrl);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("cookie");

  return fetch(new Request(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.body,
    redirect: request.redirect
  }));
}

function loginPage(errorMessage = "") {
  const safeError = escapeHtml(errorMessage);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Broono Access</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #E8E3DB;
    color: #1A1A1A;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  }
  main {
    width: min(100% - 32px, 360px);
    background: #F5F0E8;
    border: 1px solid #1A1A1A;
    padding: 24px;
  }
  h1 {
    margin: 0 0 16px;
    font-size: 24px;
    line-height: 1;
    font-weight: 700;
  }
  label {
    display: block;
    margin: 0 0 8px;
    font-size: 13px;
  }
  input {
    width: 100%;
    min-height: 44px;
    border: 1px solid #1A1A1A;
    background: #fff;
    color: #1A1A1A;
    font: inherit;
    padding: 0 12px;
  }
  button {
    width: 100%;
    min-height: 44px;
    margin-top: 12px;
    border: 1px solid #1A1A1A;
    background: #1A1A1A;
    color: #F5F0E8;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  p {
    min-height: 18px;
    margin: 12px 0 0;
    color: #9A2B20;
    font-size: 13px;
  }
</style>
</head>
<body>
<main>
  <h1>Private preview</h1>
  <form method="post" action="/__auth">
    <input type="hidden" name="returnTo" value="${escapeHtml(currentPathScript())}">
    <label for="secureKey">Password</label>
    <input id="secureKey" name="secureKey" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">Enter</button>
    <p>${safeError}</p>
  </form>
</main>
<script>
  document.querySelector('[name="returnTo"]').value = location.pathname + location.search;
</script>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8"
    }
  });
}

function currentPathScript() {
  return "/";
}

function redirectWithClearedSession(url) {
  return new Response(null, {
    status: 303,
    headers: {
      "cache-control": "no-store",
      "location": "/",
      "set-cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    }
  });
}

function acceptsHtml(request) {
  const accept = request.headers.get("accept") || "";
  return request.method === "GET" && (accept.includes("text/html") || accept.includes("*/*"));
}

function safeReturnPath(value) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function parseCookies(cookieHeader) {
  const cookies = new Map();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    cookies.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }

  return cookies;
}

function constantTimeEqual(a, b) {
  const aBytes = textEncoder.encode(a);
  const bBytes = textEncoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (aBytes[index] || 0) ^ (bBytes[index] || 0);
  }

  return diff === 0;
}

function getRequiredSecret(env, name) {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
