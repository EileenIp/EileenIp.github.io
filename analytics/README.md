# Self-hosted analytics

Traffic counting for eileenip.github.io, owned end to end: a Cloudflare
Worker collects, D1 stores, and `analytics.html` on the site reads it back.
Free tier throughout — the Workers free plan covers 100,000 requests a day,
which is several orders of magnitude above what a portfolio site sees.

Built 2026-09-13. **Not deployed yet** — everything below step 1 needs a
Cloudflare account.

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

Known kinds are allowlisted in `worker.js` — `pageview`, `download`,
`resume_build`, `outbound`. Anything else is rejected rather than stored, so
add the kind there first.

### For the resume-builder session

The dashboard already has a "Resume downloads" tile and a roles table wired
to `json_extract(meta, '$.role')`. Both read zero until the builder ships.
To light them up, fire `download` on the actual download with
`{ role: "<the role the visitor picked>" }` as meta, and `resume_build` if
you want the picker interaction counted separately from the download.

**Do not** put `data-track="download"` on the current placeholder Resume
buttons in `index.html` — they do nothing, and counting clicks on a dead
button produces a number that is worse than no number.

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
