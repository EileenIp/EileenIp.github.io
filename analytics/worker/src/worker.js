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

const ALLOWED_ORIGINS = [
  "https://eileenip.github.io",
  "http://localhost:8765", // local preview; see analytics/README.md
];

// Anything not on this list is dropped rather than stored, so a stray script
// or someone curling the endpoint cannot invent event types.
const KINDS = new Set(["pageview", "download", "resume_build", "outbound"]);

const MAX_BODY = 2048;
const MAX_META = 512;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
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
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "payload too large" }, 413, origin);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid json" }, 400, origin);
  }

  const kind = String(body.kind || "pageview");
  if (!KINDS.has(kind)) return json({ error: "unknown kind" }, 400, origin);

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
  return new Response(null, { status: 204, headers: cors(origin) });
}

async function stats(request, env, origin) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  // Constant-length compare is overkill here, but the token is the only thing
  // standing between the numbers and a public URL.
  if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) {
    return json({ error: "unauthorized" }, 401, origin);
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30", 10) || 30, 1), 365);
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
        GROUP BY path ORDER BY views DESC LIMIT 25`),
    q(`SELECT referrer_host AS host, COUNT(*) AS views
         FROM events WHERE day >= ? AND kind = 'pageview' AND referrer_host IS NOT NULL
        GROUP BY host ORDER BY views DESC LIMIT 25`),
    q(`SELECT country, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND country IS NOT NULL
        GROUP BY country ORDER BY visitors DESC LIMIT 25`),
    q(`SELECT kind, COUNT(*) AS count, COUNT(DISTINCT visitor) AS visitors
         FROM events WHERE day >= ? AND kind != 'pageview'
        GROUP BY kind ORDER BY count DESC`),
    // The resume builder records which role a visitor picked. Until that
    // ships this comes back empty, which is correct rather than broken.
    q(`SELECT json_extract(meta, '$.role') AS role, COUNT(*) AS count
         FROM events WHERE day >= ? AND kind IN ('download', 'resume_build')
                       AND json_extract(meta, '$.role') IS NOT NULL
        GROUP BY role ORDER BY count DESC`),
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
  }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (request.method === "POST" && url.pathname === "/collect") {
      return collect(request, env, origin);
    }
    if (request.method === "GET" && url.pathname === "/stats") {
      return stats(request, env, origin);
    }
    return json({ error: "not found" }, 404, origin);
  },
};
