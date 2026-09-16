import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker from "../src/worker.js";

// The Worker decides what it accepts from the hostname it is *served* on, so
// the request URL is part of the test fixture rather than incidental.
const PROD = "https://eileenip-analytics.eileen-ip.workers.dev";
const DEV = "http://localhost:8787";
const SITE = "https://eileenip.github.io";
const TOKEN = "test-token-not-the-real-one";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, path TEXT NOT NULL,
  referrer_host TEXT, country TEXT, visitor TEXT NOT NULL, meta TEXT
)`;

beforeEach(async () => {
  await env.DB.prepare(SCHEMA).run();
  await env.DB.prepare("DELETE FROM events").run();
});

/** POST /collect with sensible defaults; every field is overridable. */
function collect(body, { origin = SITE, base = PROD, headers = {} } = {}) {
  const h = { "Content-Type": "text/plain;charset=UTF-8", ...headers };
  if (origin !== null) h.Origin = origin;
  return worker.fetch(
    new Request(`${base}/collect`, {
      method: "POST",
      headers: h,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env
  );
}

function stats(query = "", token = TOKEN) {
  const headers = token === null ? {} : { Authorization: `Bearer ${token}` };
  return worker.fetch(new Request(`${PROD}/stats${query}`, { headers }), env);
}

const rows = () =>
  env.DB.prepare("SELECT * FROM events ORDER BY id").all().then((r) => r.results);

describe("routing", () => {
  it("404s an unknown path", async () => {
    const res = await worker.fetch(new Request(`${PROD}/`), env);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("404s /collect on GET — the collector is POST-only", async () => {
    const res = await worker.fetch(new Request(`${PROD}/collect`), env);
    expect(res.status).toBe(404);
  });

  it("answers preflight with the site's own origin echoed back", async () => {
    const res = await worker.fetch(
      new Request(`${PROD}/collect`, { method: "OPTIONS", headers: { Origin: SITE } }),
      env
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(SITE);
  });

  it("never echoes an origin it does not allow", async () => {
    const res = await worker.fetch(
      new Request(`${PROD}/collect`, {
        method: "OPTIONS",
        headers: { Origin: "https://evil.example" },
      }),
      env
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(SITE);
  });
});

describe("origin gate on the write", () => {
  it("rejects a request with no Origin at all", async () => {
    const res = await collect({ kind: "pageview", path: "/" }, { origin: null });
    expect(res.status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects an origin that is not the site", async () => {
    const res = await collect({ kind: "pageview", path: "/" },
      { origin: "https://evil.example" });
    expect(res.status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it("accepts the site", async () => {
    expect((await collect({ kind: "pageview", path: "/" })).status).toBe(204);
    expect(await rows()).toHaveLength(1);
  });

  // The regression this gate exists for: a local preview of the site used to
  // write into the production database.
  it("rejects a localhost origin when deployed", async () => {
    const res = await collect({ kind: "pageview", path: "/" },
      { origin: "http://localhost:8765", base: PROD });
    expect(res.status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it("allows a localhost origin only when the Worker itself runs locally", async () => {
    const res = await collect({ kind: "pageview", path: "/" },
      { origin: "http://localhost:8765", base: DEV });
    expect(res.status).toBe(204);
    expect(await rows()).toHaveLength(1);
  });
});

describe("payload validation", () => {
  it("rejects an unknown event kind rather than storing it", async () => {
    const res = await collect({ kind: "exfiltrate", path: "/" });
    expect(res.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it.each(["pageview", "download", "resume_build", "outbound"])(
    "accepts the known kind %s",
    async (kind) => {
      expect((await collect({ kind, path: "/" })).status).toBe(204);
      expect((await rows())[0].kind).toBe(kind);
    }
  );

  it("defaults a missing kind to pageview", async () => {
    await collect({ path: "/" });
    expect((await rows())[0].kind).toBe("pageview");
  });

  it("rejects a body that is not JSON", async () => {
    const res = await collect("this is not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid json" });
  });

  it("rejects an oversized body before parsing it", async () => {
    const res = await collect(JSON.stringify({ kind: "pageview", path: "/", pad: "x".repeat(3000) }));
    expect(res.status).toBe(413);
    expect(await rows()).toHaveLength(0);
  });
});

// These are the privacy claims made in the README. If any of them regress,
// the claim becomes false, which is why they are tested rather than trusted.
describe("what gets stored, and what must not", () => {
  it("reduces a referrer to its host, dropping path and query", async () => {
    await collect({ kind: "pageview", path: "/",
                    ref: "https://www.linkedin.com/feed/?q=a-private-search" });
    const row = (await rows())[0];
    expect(row.referrer_host).toBe("www.linkedin.com");
    expect(JSON.stringify(row)).not.toContain("a-private-search");
  });

  it("records no referrer for same-site navigation", async () => {
    await collect({ kind: "pageview", path: "/", ref: `${SITE}/projects.html` });
    expect((await rows())[0].referrer_host).toBeNull();
  });

  it("records no referrer when the value is unparseable", async () => {
    await collect({ kind: "pageview", path: "/", ref: "not a url" });
    expect((await rows())[0].referrer_host).toBeNull();
  });

  it("strips the query string and fragment from the path", async () => {
    await collect({ kind: "pageview", path: "/projects.html?project=x#frag" });
    expect((await rows())[0].path).toBe("/projects.html");
  });

  it("falls back to / for a path that is not same-origin absolute", async () => {
    await collect({ kind: "pageview", path: "https://evil.example/steal" });
    expect((await rows())[0].path).toBe("/");
  });

  it("caps an absurd path rather than storing it whole", async () => {
    await collect({ kind: "pageview", path: "/" + "a".repeat(500) });
    expect((await rows())[0].path).toHaveLength(200);
  });

  it("keeps meta within the cap", async () => {
    await collect({ kind: "download", path: "/resume.html",
                    meta: { role: "data-analyst", roleLabel: "Data Analyst" } });
    expect(JSON.parse((await rows())[0].meta)).toEqual({
      role: "data-analyst", roleLabel: "Data Analyst",
    });
  });

  it("drops oversized meta but still records the event", async () => {
    const res = await collect({ kind: "download", path: "/resume.html",
                                meta: { junk: "y".repeat(600) } });
    expect(res.status).toBe(204);
    const row = (await rows())[0];
    expect(row.meta).toBeNull();
    expect(row.kind).toBe("download");
  });

  it("ignores meta that is not an object", async () => {
    await collect({ kind: "pageview", path: "/", meta: "a string" });
    expect((await rows())[0].meta).toBeNull();
  });

  it("stores neither the IP nor the user agent", async () => {
    await collect({ kind: "pageview", path: "/" }, {
      headers: { "CF-Connecting-IP": "203.0.113.7", "User-Agent": "TestAgent/9.9" },
    });
    const serialised = JSON.stringify((await rows())[0]);
    expect(serialised).not.toContain("203.0.113.7");
    expect(serialised).not.toContain("TestAgent");
  });

  it("derives a 16-hex-character visitor key", async () => {
    await collect({ kind: "pageview", path: "/" },
      { headers: { "CF-Connecting-IP": "203.0.113.7", "User-Agent": "A" } });
    expect((await rows())[0].visitor).toMatch(/^[0-9a-f]{16}$/);
  });

  it("gives the same visitor the same key, and a different one a different key", async () => {
    const as = { "CF-Connecting-IP": "203.0.113.7", "User-Agent": "Browser/1" };
    const bs = { "CF-Connecting-IP": "198.51.100.2", "User-Agent": "Browser/1" };
    await collect({ kind: "pageview", path: "/a" }, { headers: as });
    await collect({ kind: "pageview", path: "/b" }, { headers: as });
    await collect({ kind: "pageview", path: "/c" }, { headers: bs });
    const [a, b, c] = await rows();
    expect(a.visitor).toBe(b.visitor);
    expect(c.visitor).not.toBe(a.visitor);
  });

  it("records the country Cloudflare reports, and null when it reports none", async () => {
    await collect({ kind: "pageview", path: "/a" }, { headers: { "CF-IPCountry": "AU" } });
    await collect({ kind: "pageview", path: "/b" });
    const [a, b] = await rows();
    expect(a.country).toBe("AU");
    expect(b.country).toBeNull();
  });
});

// Regression guard for the bug that shipped: beacons declared
// application/json, which is not CORS-safelisted, so the browser demanded a
// preflight that sendBeacon's credentials mode then made unsatisfiable. Every
// beacon was blocked while curl-based tests passed.
//
// A unit test cannot exercise the browser's CORS layer, so what is asserted
// here is the server-side half of the contract: the collector must not care
// about the declared content type, which is what allows the client to send
// the safelisted text/plain and avoid the preflight entirely. If someone
// "tidies" this into requiring application/json, these fail.
describe("content type is not part of the contract", () => {
  it("accepts text/plain -- what sendBeacon sends to avoid a preflight", async () => {
    const res = await collect({ kind: "pageview", path: "/" },
      { headers: { "Content-Type": "text/plain;charset=UTF-8" } });
    expect(res.status).toBe(204);
    expect(await rows()).toHaveLength(1);
  });

  it("accepts application/json too -- the constraint is the browser's, not ours", async () => {
    const res = await collect({ kind: "pageview", path: "/" },
      { headers: { "Content-Type": "application/json" } });
    expect(res.status).toBe(204);
  });

  it("accepts a body with no content type at all", async () => {
    const res = await worker.fetch(
      new Request(`${PROD}/collect`, {
        method: "POST",
        headers: { Origin: SITE },
        body: JSON.stringify({ kind: "pageview", path: "/" }),
      }),
      env
    );
    expect(res.status).toBe(204);
  });
});

describe("/stats authorisation", () => {
  it("401s with no Authorization header", async () => {
    expect((await stats("", null)).status).toBe(401);
  });

  it("401s on the wrong token", async () => {
    expect((await stats("", "not-the-token")).status).toBe(401);
  });

  it("401s on a bare token without the Bearer scheme", async () => {
    const res = await worker.fetch(
      new Request(`${PROD}/stats`, { headers: { Authorization: TOKEN } }), env);
    expect(res.status).toBe(401);
  });

  it("200s on the right token", async () => {
    expect((await stats()).status).toBe(200);
  });
});

describe("/stats aggregation", () => {
  const seed = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const insert = (kind, path, host, country, visitor, meta) =>
      env.DB.prepare(
        `INSERT INTO events (ts, day, kind, path, referrer_host, country, visitor, meta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(`${today}T00:00:00.000Z`, today, kind, path, host, country, visitor, meta).run();

    await insert("pageview", "/", "linkedin.com", "AU", "v1", null);
    await insert("pageview", "/", "linkedin.com", "AU", "v1", null); // same visitor twice
    await insert("pageview", "/projects.html", null, "HK", "v2", null);
    await insert("download", "/resume.html", null, "AU", "v1",
      JSON.stringify({ role: "data-analyst", roleLabel: "Data Analyst" }));
    await insert("outbound", "/", null, "AU", "v1",
      JSON.stringify({ to: "github.com/EileenIp" }));
    return today;
  };

  it("counts views and unique visitors separately", async () => {
    await seed();
    const body = await (await stats()).json();
    expect(body.totals).toEqual({ views: 3, visitors: 2 });
  });

  it("counts only pageviews as views, not every event", async () => {
    await seed();
    const body = await (await stats()).json();
    // five rows seeded, three of them pageviews
    expect(body.totals.views).toBe(3);
  });

  it("groups pages, referrers and countries", async () => {
    await seed();
    const body = await (await stats()).json();
    expect(body.paths).toEqual([
      { path: "/", views: 2, visitors: 1 },
      { path: "/projects.html", views: 1, visitors: 1 },
    ]);
    expect(body.referrers).toEqual([{ host: "linkedin.com", views: 2 }]);
    expect(body.countries).toEqual([
      { country: "AU", visitors: 1 },
      { country: "HK", visitors: 1 },
    ]);
  });

  it("lists non-pageview events on their own", async () => {
    await seed();
    const body = await (await stats()).json();
    expect(body.events).toEqual(
      expect.arrayContaining([
        { kind: "download", count: 1, visitors: 1 },
        { kind: "outbound", count: 1, visitors: 1 },
      ])
    );
    expect(body.events.some((e) => e.kind === "pageview")).toBe(false);
  });

  it("reports the daily series", async () => {
    const today = await seed();
    const body = await (await stats()).json();
    expect(body.daily).toEqual([{ day: today, views: 3, visitors: 2 }]);
  });

  it("groups roles on the human label", async () => {
    await seed();
    const body = await (await stats()).json();
    expect(body.roles).toEqual([{ role: "Data Analyst", count: 1 }]);
  });

  // Rows written before roleLabel existed only carry the slug. They must still
  // be counted rather than silently dropped from the table.
  it("falls back to the role slug when no label was recorded", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await env.DB.prepare(
      `INSERT INTO events (ts, day, kind, path, country, visitor, meta)
       VALUES (?, ?, 'download', '/resume.html', 'AU', 'v9', ?)`
    ).bind(`${today}T00:00:00.000Z`, today, JSON.stringify({ role: "bi-developer" })).run();
    const body = await (await stats()).json();
    expect(body.roles).toEqual([{ role: "bi-developer", count: 1 }]);
  });

  it("returns empty collections rather than nulls on an empty table", async () => {
    const body = await (await stats()).json();
    expect(body.totals).toEqual({ views: 0, visitors: 0 });
    expect(body.daily).toEqual([]);
    expect(body.paths).toEqual([]);
    expect(body.roles).toEqual([]);
  });

  it("excludes rows older than the window", async () => {
    await env.DB.prepare(
      `INSERT INTO events (ts, day, kind, path, country, visitor)
       VALUES ('2020-01-01T00:00:00.000Z', '2020-01-01', 'pageview', '/', 'AU', 'old')`
    ).run();
    const body = await (await stats("?days=7")).json();
    expect(body.totals.views).toBe(0);
  });
});

describe("/stats window parsing", () => {
  it.each([
    ["", 30],
    ["?days=7", 7],
    ["?days=365", 365],
    ["?days=9999", 365],
    ["?days=0", 1],
    ["?days=-5", 1],
    ["?days=banana", 30],
  ])("maps %s to a %i-day window", async (query, expected) => {
    const body = await (await stats(query)).json();
    expect(body.days).toBe(expected);
  });
});
