/**
 * Collector + stats API for eileenip.github.io.
 *
 * Two endpoints:
 *   POST /collect  — public, called by js/analytics.js on every page
 *   GET  /stats    — token-gated, read by analytics.html
 *
 * What this deliberately does not store
 * -------------------------------------
 * No cookies, no localStorage id, no IP address, no full referrer, no user
 * agent string. That is what lets the site run without a consent banner
 * rather than bolting one onto a portfolio.
 *
 * Unique visitors still need *some* way to tell two page views apart, so the
 * visitor key is a hash of (daily secret + IP + user agent), truncated. The
 * secret half rotates every UTC day, so yesterday's hashes cannot be matched
 * to today's — a visitor is countable within a day and uncountable across
 * them. This is the same construction GoatCounter and Plausible use, and it
 * is the reason the raw IP never reaches the database.
 */

const SITE_ORIGIN = "https://eileenip.github.io";

// Only honoured when the Worker itself is running locally under
// `wrangler dev`. Deriving that from the request's own hostname rather than a
// config var means the deployed Worker cannot be talked into accepting a
// localhost origin, and local development needs no separate config.
const DEV_ORIGINS = ["http://localhost:8765", "http://127.0.0.1:8765"];

function allowedOrigins(request) {
  const host = new URL(request.url).hostname;
  const runningLocally = host === "localhost" || host === "127.0.0.1";
  return runningLocally ? [SITE_ORIGIN, ...DEV_ORIGINS] : [SITE_ORIGIN];
}

// Anything not on this list is dropped rather than stored, so a stray script
// or someone curling the endpoint cannot invent event types.
const KINDS = new Set(["pageview", "download", "resume_build", "outbound"]);

const MAX_BODY = 2048;
const MAX_META = 512;

function cors(origin, request) {
  const list = allowedOrigins(request);
  const allowed = list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, origin, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin, request) },
  });
}

/** Hex SHA-256, truncated to 16 chars — ample to separate a day's visitors. */
async function visitorKey(request, env, day) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";
  const input = `${env.SALT_SECRET}|${day}|${ip}|${ua}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Referrers are reduced to a bare host: the path and query can be private. */
function referrerHost(raw) {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    return host && host !== "eileenip.github.io" ? host.slice(0, 100) : null;
  } catch {
    return null;
  }
}

/** Query strings can carry identifiers, so only the path is kept. */
function safePath(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  return raw.split(/[?#]/)[0].slice(0, 200);
}

async function collect(request, env, origin) {
  // The allowlist gates the write, not just the CORS response header. Without
  // this, anyone who finds the URL can POST rows, and a local preview of the
  // site writes into the production database -- which is not hypothetical, it
  // happened repeatedly while this was being built.
  //
  // Browsers always send Origin on a cross-origin POST, sendBeacon included,
  // and the site is cross-origin to this Worker by construction. So real
  // traffic always carries one, and a request without it is never a visitor.
  if (!allowedOrigins(request).includes(origin)) {
    return json({ error: "forbidden origin" }, 403, origin, request);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "payload too large" }, 413, origin, request);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid json" }, 400, origin, request);
  }

  const kind = String(body.kind || "pageview");
  if (!KINDS.has(kind)) return json({ error: "unknown kind" }, 400, origin, request);

  let meta = null;
  if (body.meta && typeof body.meta === "object") {
    const encoded = JSON.stringify(body.meta);
    if (encoded.length <= MAX_META) meta = encoded;
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  await env.DB.prepare(
    `INSERT INTO events (ts, day, kind, path, referrer_host, country, visitor, meta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    now.toISOString(),
    day,
    kind,
    safePath(body.path),
    referrerHost(body.ref),
    request.headers.get("CF-IPCountry") || null,
    await visitorKey(request, env, day),
    meta
  ).run();

  // 204: the page has nothing to do with the answer, and a body would just be
  // bytes on someone's mobile connection.
  return new Response(null, { status: 204, headers: cors(origin, request) });
}

// Note the asymmetry with collect(): /stats is not origin-gated, because a
// bearer token is a stronger gate than a header the client chooses, and
// keeping it callable from curl is what makes the thing debuggable.
async function stats(request, env, origin) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  // Constant-length compare is overkill here, but the token is the only thing
  // standing between the numbers and a public URL.
  if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) {
    return json({ error: "unauthorized" }, 401, origin, request);
  }

  const url = new URL(request.url);
  // Parse first, then clamp. `parseInt(...) || 30` would have treated a
  // perfectly parseable 0 as missing and silently returned 30 days, while
  // -5 clamped to 1 -- two different answers to the same class of bad input.
  const requested = parseInt(url.searchParams.get("days") || "", 10);
  const days = Number.isNaN(requested) ? 30 : Math.min(Math.max(requested, 1), 365);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const q = (sql) => env.DB.prepare(sql).bind(since).all();

  const [totals, daily, paths, referrers, countries, events, roles] = await Promise.all([
    q(`SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND kind = 'pageview'`),
    q(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND kind = 'pageview'
        GROUP BY day ORDER BY day`),
    q(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND kind = 'pageview'
        GROUP BY path ORDER BY views DESC, path ASC LIMIT 25`),
    q(`SELECT referrer_host AS host, COUNT(*) AS views
         FROM events WHERE day >= ? AND kind = 'pageview' AND referrer_host IS NOT NULL
        GROUP BY host ORDER BY views DESC, host ASC LIMIT 25`),
    q(`SELECT country, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND country IS NOT NULL
        GROUP BY country ORDER BY visitors DESC, country ASC LIMIT 25`),
    q(`SELECT kind, COUNT(*) AS count, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND kind != 'pageview'
        GROUP BY kind ORDER BY count DESC, kind ASC`),
    // Which role a visitor picked on the resume builder. It sends both a slug
    // and a label: group on the label when it is there so the table is
    // readable, fall back to the slug for rows written before it was added.
    q(`SELECT COALESCE(json_extract(meta, '$.roleLabel'),
                       json_extract(meta, '$.role')) AS role,
              COUNT(*) AS count
         FROM events WHERE day >= ? AND kind IN ('download', 'resume_build')
                       AND json_extract(meta, '$.role') IS NOT NULL
        GROUP BY role ORDER BY count DESC, role ASC`),
  ]);

  return json({
    days,
    since,
    generated: new Date().toISOString(),
    totals: totals.results[0] || { views: 0, visitors: 0 },
    daily: daily.results,
    paths: paths.results,
    referrers: referrers.results,
    countries: countries.results,
    events: events.results,
    roles: roles.results,
  }, 200, origin, request);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin, request) });
    }
    if (request.method === "POST" && url.pathname === "/collect") {
      return collect(request, env, origin);
    }
    if (request.method === "GET" && url.pathname === "/stats") {
      return stats(request, env, origin);
    }
    return json({ error: "not found" }, 404, origin, request);
  },
};
