# Self-hosted analytics

Traffic counting for eileenip.github.io, owned end to end: a Cloudflare
Worker collects, D1 stores, and `analytics.html` on the site reads it back.
Free tier throughout — the Workers free plan covers 100,000 requests a day,
which is several orders of magnitude above what a portfolio site sees.

Built 2026-09-13, **live since 2026-09-16** at
`https://eileenip-analytics.eileen-ip.workers.dev`. The steps below are kept
as the record of how it was set up, and for rebuilding it if the account ever
has to be recreated.

Two things from the real setup that the steps didn't predict:

- `workers.dev` subdomains are globally unique — `eileenip` was taken, so the
  account's subdomain is `eileen-ip`. That is why the host reads
  `eileenip-analytics.eileen-ip.workers.dev`.
- The TLS certificate for a just-registered subdomain takes a few minutes to
  issue. Handshakes fail outright until it does, from any client, which looks
  like a broken deploy and isn't. Wait it out.
- Cloudflare's bot-signature check (error 1010) answers 403 to requests with a
  scripting user agent. Real browsers are unaffected, but a `curl` or Python
  smoke test needs a browser UA to get through.

## Why not a hosted counter

GoatCounter, Cloudflare Web Analytics and Plausible would each have taken
five minutes. Eileen asked for our own, and the second reason is that
ingest → store → query → dashboard over real traffic is a data-engineering
project where the data is hers and arrives whether or not anyone is looking.

## What is and is not stored

Stored per event: timestamp, UTC day, event kind, same-origin path,
referrer **host**, two-letter country, a daily-rotating visitor hash, and an
optional small JSON blob.

Never stored: IP addresses, user agent strings, full referrer URLs, query
strings, and any identifier that survives midnight.

The visitor hash is `SHA-256(secret + UTC-day + IP + user-agent)` truncated
to 16 hex characters. The day is inside the hash, so the same person is one
visitor within a day and an unrelated hash tomorrow — countable, not
trackable. The IP is an input that is never written down. This is the same
construction GoatCounter and Plausible use, and it is why the site needs no
cookie banner.

If a future change starts writing a cookie or a `localStorage` id, the
consent-banner question comes back with it. That is the constraint to hold.

`js/analytics.js` also honours Do Not Track and goes inert entirely when no
endpoint is configured.

## Deploying

### 1. Cloudflare account
Free, at dash.cloudflare.com. No domain and no card needed for Workers +
D1 on the free plan. **This is the only step that needs Eileen.**

### 2. Install wrangler and log in

```bash
cd analytics/worker && npm install && npx wrangler login
```

### 3. Create the database

```bash
npx wrangler d1 create eileenip-analytics
```

Copy the `database_id` it prints into `wrangler.toml`, replacing
`PASTE_DATABASE_ID_HERE`. Then create the tables:

```bash
npm run schema
```

### 4. Set the two secrets

```bash
npx wrangler secret put SALT_SECRET
npx wrangler secret put STATS_TOKEN
```

- `SALT_SECRET` — any long random string. It is the secret half of the
  visitor hash. **Changing it later resets visitor counts** (views and
  everything else are unaffected), so set it once.
- `STATS_TOKEN` — the key that unlocks `analytics.html`. This is the one
  you type into the dashboard.

Generate both with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

```bash
npm run deploy
```

Wrangler prints a URL like `https://eileenip-analytics.<subdomain>.workers.dev`.

### 6. Point the site at it

Put that URL in `js/analytics-config.js`:

```js
window.ANALYTICS_ENDPOINT = "https://eileenip-analytics.<subdomain>.workers.dev";
```

That is the only place it appears — both the collector snippet and the
dashboard read it from there. Commit, push, and the site starts counting on
the next deploy.

### 7. Open the dashboard

`https://eileenip.github.io/analytics.html`, paste the `STATS_TOKEN`. The
key is kept in that browser's localStorage; "Forget key" clears it.

The page is `noindex, nofollow` and is deliberately absent from the site nav
and from `sitemap.xml`. The numbers sit behind the token regardless, but
there is no reason to advertise it to a recruiter reading the portfolio.

## Recording an event

A pageview fires on every load. Anything else is opt-in from the markup:

```html
<a href="..." data-track="download">Download resume</a>
<a href="..." data-track="download" data-track-meta='{"role":"Data Analyst"}'>…</a>
```

Or from script: `window.track("resume_build", { role: "BI Developer" })`.

**Outbound clicks are detected, not tagged.** Any click on a link to another
host fires `outbound` with `{ to: "<host><path>" }`, query string dropped;
`mailto:` and `tel:` record the scheme alone. Detection rather than markup,
because the case-study links are built at runtime from `data/projects.json` —
hand-tagging would have missed exactly the links worth measuring, which is
whether anyone opens the repos and dashboards. Internal links and `#anchors`
record nothing. A link carrying its own `data-track` wins, so a tagged link
never fires twice.

Known kinds are allowlisted in `worker.js` — `pageview`, `download`,
`resume_build`, `outbound`. Anything else is rejected rather than stored, so
add the kind there first.

### The resume builder — wired 2026-09-15

`resume.html` shipped 2026-09-13 and fires `download` on the real download,
with meta `{ role, roleLabel, industry, youtube }`:

```json
{"role": "data-analyst", "roleLabel": "Data Analyst",
 "industry": "Marketing", "youtube": false}
```

Both a slug and a label, on purpose. The slug is the stable identifier, so a
row recorded today still groups with one recorded after a role is renamed;
the label is what the roles table displays. The query prefers `$.roleLabel`
and falls back to `$.role` for any row written before this was added.

`resume_build` is available for counting picker interaction separately, and
is deliberately unused: a pageview on `/resume.html` already answers "did
anyone open the picker", so firing both would be counting the same visit
twice.

The placeholder Resume buttons this section used to warn about are gone —
they now link to `resume.html` rather than doing nothing, so the download
count comes from a real download.

## Tests

```bash
cd analytics/worker && npm test
```

53 tests, run inside `workerd` against a real local D1 rather than a mock --
most of what this Worker does is D1 queries and header handling, and a
hand-rolled fake would have agreed with whatever the code happened to do.

What they cover, and why those things and not others:

- **The origin gate**, including the case it exists for: a `localhost` origin
  is accepted only when the Worker itself is running locally. The request URL
  is part of each fixture, because that is what the decision is derived from.
- **The privacy claims in this README.** Referrer reduced to a host, query
  strings and fragments stripped from paths, oversized `meta` dropped, and --
  asserted directly against the stored row -- neither the IP nor the user
  agent present anywhere in it. If one of these regresses, a claim above
  becomes false, which is why they are tested rather than trusted.
- **The visitor hash** being 16 hex characters, stable for one visitor, and
  different for another.
- **`/stats` authorisation and aggregation** against seeded rows, including
  the `roleLabel`-then-`role` fallback for rows written before the label
  existed, and the window parsing for every shape of bad `days` input.
- **That the content type is not part of the contract.** A regression guard
  for the beacon bug: a unit test cannot exercise the browser's CORS layer,
  so what is asserted is the server-side half -- the collector must not care
  what type the body declares, which is what lets the client send the
  safelisted `text/plain` and skip the preflight. If someone tidies that into
  requiring `application/json`, three tests fail.

Two real bugs surfaced while writing them, both now fixed:

- Tied rows had no secondary sort, so SQLite was free to reorder them and the
  dashboard's tables reshuffled between refreshes for no visible reason. Every
  aggregate query now has a deterministic tiebreak.
- `?days=0` returned a 30-day window while `?days=-5` returned a 1-day one,
  because `parseInt(...) || 30` treats a perfectly parseable zero as missing.
  Parsing and clamping are now separate steps.

**What these tests still do not cover, honestly:** the browser half. The
beacon bug lived in the interaction between `sendBeacon`, CORS preflights and
credentials mode -- none of which exist inside `workerd`. Closing that gap
needs a test that drives a real browser against a running Worker and asserts
a row landed. Until then, **exercise any CORS-shaped change from a real
browser by hand**, because the suite passing does not mean a visitor's
pageview arrives.

`npm audit` reports 4 high-severity advisories, all in a `sharp` build nested
inside the test pool's own pinned wrangler. Dev-only, not reachable from the
deployed Worker, and `--force` would break the pool.

## Local development

```bash
cd analytics/worker && npx wrangler dev          # Worker on :8787
npm run schema:local                             # tables in the local D1
```

Then serve the site on port 8765 (`python -m http.server 8765`) — that
origin is already in the Worker's `ALLOWED_ORIGINS` — and set
`window.ANALYTICS_ENDPOINT = "http://localhost:8787"` while testing. Revert
it before committing.

## Costs and limits

Free tier: 100,000 Worker requests/day, 5 GB D1 storage, 5 million D1 row
reads/day. One pageview is one Worker request and one row. A portfolio site
will not approach any of these.

Rows are kept raw rather than rolled up, so a question nobody thought to ask
in advance can still be asked of old traffic. Revisit if the table passes a
few million rows, which at this site's volume is not a real horizon.
