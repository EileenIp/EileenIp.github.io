# Mobile render + data-source honesty audit — 2026-09-10

Covers the two Site Foundations tasks from `TODO.md`: phone-width rendering,
and whether every project page states its data source honestly.

## Phone-width rendering

**Found and fixed:** `index.html`'s nav had 5 links plus a Resume button in
one non-wrapping flex row. Measured precisely at a 375px viewport: the
Resume button's right edge sat ~104px past the screen edge, with no scroll,
wrap, or mobile menu — "Progress" and the Resume button were unreachable on
a phone. Fixed by adding a CSS-only (no JS) hamburger toggle scoped to
`index.html` via a `.nav-collapsible` class, so the other four pages —
`projects.html`, `progress.html`, `todo.html`, `job-tracker.html` — which
already fit at their (shorter) link counts, are untouched. Verified: at
375px the nav now shows just the brand + hamburger icon, and opening it
reveals all 5 links and the Resume button, fully reachable.

**Found and fixed, non-mobile-specific:** `data/projects.json` referenced
`images/projects/ecommerce-behavior-card.png` for the e-commerce project
card — the file doesn't exist anywhere on disk (confirmed via a full-machine
search), so every viewport showed a broken image. No real screenshot exists
to substitute, so the `image` field was removed; the card now falls back to
the same gradient placeholder `subscriber-churn-ltv` already uses when it
has no image.

**Found, not fixed (minor, cosmetic):** inside the Subscriber Churn case
study modal, the risk-value quadrant SVG chart's text labels ("9.5%",
"Stable, No Action") extend a few pixels past the modal's content width at
375px. Low priority — noted here so it isn't lost, not actioned.

**Checked, no issue:** `projects.html`'s filter panel is long (pushes the
first project card below the fold on a phone) but doesn't overflow or clip
anything — a density/UX observation, not a breakage.

## Data-source honesty

**No violations found.** All 4 built projects state real-vs-synthetic
plainly (e-commerce and subscriber-churn are explicitly real, with sources
named; advertising-revenue and creator-content are explicitly labeled
synthetic). All 5 placeholder cards carry the same honest line: *"Data
source not yet chosen... this project will not go live without that
label."* The site's data-honesty rule is being followed everywhere.

**Found and fixed — stale tool lists on two placeholder cards** (these
described tooling decisions that were superseded once the real specs were
written, and hadn't been synced back to the site):
- `ad-creative-performance-pipeline`: listed "dbt, BigQuery" — the spec
  explicitly swapped to dbt-core + **DuckDB** to avoid cloud cost. Corrected
  to `["dbt", "DuckDB"]`.
- `streaming-engagement-dashboard`: listed "Tableau, SQL" — the spec plans
  entity resolution in Python against a DuckDB/SQLite star schema, no
  Tableau. Corrected to `["Python", "DuckDB"]`.

**Found and fixed — one placeholder card was under a stale name.**
`support-ticket-sentiment-tracker` predates the `launch-sentiment` /
`support-triage` split (see 2026-09-10 conversation log) and was never
updated once `support-triage` became the fully-spec'd version of that same
idea. Retitled the card and its description to match `support-triage`'s
real business question (urgency triage at message arrival + a reply-speed
outcome analysis on Twitter support threads) instead of leaving it under
its old "score tickets for sentiment" framing. Its `id` was left unchanged
to avoid touching any existing deep link.

**Found, escalated to `Needs Eileen` — two orphaned placeholder cards with
no matching spec or roadmap entry anywhere:** `player-segmentation-ltv-model`
(Gaming) and `social-feed-ranking-experiment` (Social Media). Neither
corresponds to anything in the current 6-project roadmap or any file under
`portfolio-projects/`. Can't correct them to match a real plan because no
such plan exists to sync to — this needs Eileen to say whether they're
future backlog worth writing a brief for, or dead ideas to remove.

**Found, escalated to `Needs Eileen` — the Steam gaming dashboard's "already
built" status doesn't check out.** `TODO.md` (inherited from before this
agent's involvement) stated the F2P/pricing dashboard was "already built on
sample data." A full-machine search found no card in `projects.json`, no
HTML page, no image, and no code anywhere under
`portfolio-projects/steam-pricing-engagement` (just the spec). Either it
exists somewhere not on this machine, or the "already built" status was
never actually true. Flagged so Eileen can confirm which, since it changes
whether Roadmap project 3's first real task is "run the pull" or "build the
dashboard from scratch."
