# TODO — EileenIp.github.io

The agent's backlog. Work top-to-bottom within each section. Eileen edits
freely; the agent only moves items between sections and adds notes.

**Priority order:** `Needs Eileen` is never worked on. `In progress` first,
then `Todo` top-down.

---

## Needs Eileen
<!-- Agent: move blocked items here with a one-line note on what you need.
     Never attempt these. -->

- [ ] The gaming dashboard's "already built on sample data" status doesn't
      check out — a full-machine search (2026-09-10) found no card in
      `data/projects.json`, no HTML page, no image, and no code anywhere
      under `portfolio-projects/steam-pricing-engagement` (just the spec).
      See `agent-log/mobile-and-data-audit-2026-09-10.md`.
      — *blocking: needs Eileen to confirm whether a sample-data build
      exists somewhere off this machine, or whether Roadmap project 3
      actually starts from zero — changes both the status line above and
      how the page eventually gets written*
- [ ] `advertising-revenue-sales-efficiency-2026`'s methodology reads as
      descriptive rather than comparative (contrast the ecommerce page's
      "Model choice," which names and rejects two specific alternatives).
      See `agent-log/audit-2026-09-08.md` for full reasoning.
      — *blocking: needs Eileen to name the actual alternative that was
      considered for the SQL/BI stack or lifecycle-rule design — the agent
      can't invent one without violating the "never invent" rule*
- [ ] Two placeholder project cards on the live site don't match anything in
      the current roadmap or any spec: `player-segmentation-ltv-model`
      (Gaming) and `social-feed-ranking-experiment` (Social Media). See
      `agent-log/mobile-and-data-audit-2026-09-10.md`.
      — *blocking: needs Eileen to say whether these are future backlog
      worth a readiness brief, or dead ideas to remove — the agent can't
      correct them to match a real plan because no such plan exists, and
      won't delete site content without being told to*
---

## In progress
<!-- Max 1–2 items. Agent moves things here when a plan is approved. -->

- [ ] Roadmap project 1 — Ad Creative Performance Pipeline. Phases 0–4 done:
      generator, idempotent loader + dbt staging, marts + 10 dbt tests, CI +
      hosted docs, and now a thin dashboard (freshness, defect log,
      top-decile creatives). Live at
      `github.com/EileenIp/ad-creative-pipeline` (Eileen created the repo
      and enabled GitHub Pages herself — both were outside the agent's
      permission scope). Docs and dashboard both publicly browsable and
      checked live in the browser at their real URLs, not just via CI green
      checkmarks: https://eileenip.github.io/ad-creative-pipeline/ and
      .../dashboard/. Along the way: the first real CI run caught a genuine
      bug local testing hadn't (an untracked empty `dbt/seeds/` directory
      silently skipping `dbt build`), the first Pages-enable attempt didn't
      actually save (caught via the GitHub API, not the settings UI), and
      the dashboard's results table overflowed on a real mobile viewport
      check before it shipped. Full story in that repo's
      `spec-ad-creative-pipeline.md` session log. Website case study now
      written, replacing the old placeholder card in `data/projects.json`
      (committed on this branch) — real numbers throughout, and two
      limitations items left as explicit `[EILEEN TO ADD]` (the real
      Meta/Google export delta, the DuckDB-to-BigQuery scaling answer)
      rather than invented. Eileen then explicitly asked the agent to
      write the rest too ("i don't know what to write can you write all
      of them") — overriding that reservation on purpose. Report + deck
      built (`deliverables/same-day-reliability-report.docx`,
      `-deck.pptx`), both limitations items filled in on the live case
      study to match. **All four Phase 4 outputs done: dashboard, report,
      deck, website case study.** Roadmap project 1 complete —
      **read `deliverables/same-day-reliability-report.docx`'s Limitations
      section and the case study's two filled-in limitations before
      relying on them in an interview** — they're real, reasoned, and
      grounded in this session's actual findings, but they were written
      by the agent at your request, not drafted by you first.

---

## Todo

Ordered by priority (really-should-do first) per Eileen's 2026-09-10 call.
`subscription-renewal-churn` was cut entirely — same KKBox dataset as the
already-built `subscriber-churn-ltv`, not different enough to justify a
second repo.

### Roadmap project 1 — Ad Creative Performance Pipeline (marketing / data engineering)
Status: Phases 0–4 built and live (generator, loader + staging, marts +
tests, CI + hosted docs, thin dashboard). See "In progress" above. Full
spec: `portfolio-projects/ad-creative-pipeline/spec-ad-creative-pipeline.md`.
Highest priority: the only data-engineering project in the set, and it's
aimed directly at the BI Developer / Data Engineer roles being targeted.
Openly synthetic data by design (real ad-creative performance data isn't
published anywhere) — the deliverable is pipeline engineering (dbt-core +
DuckDB + GitHub Actions), not an analytical insight claim.
- [ ] Four-output deliverables: deck + report (pitched at a BI-lead
      audience) and a website case study in this repo
- [ ] Eileen writes: "what didn't work," limitations (synthetic upstream,
      single-platform schema, what a real Meta/Google export changes), and
      the honest DuckDB-to-BigQuery scaling answer

### Roadmap project 2 — Launch Sentiment: What Went Wrong, and When (social/marketing)
Status: spec written, not built. Full spec:
`portfolio-projects/launch-sentiment/spec-launch-sentiment.md`.
Fills a domain the portfolio has zero coverage of otherwise; real, accessible
data (Steam reviews + Reddit).
- [ ] Checkpoint 0 (Eileen): pick the launch — shipped 6–24 months ago, had a
      visible sentiment event, enough Steam-review volume, and something
      Eileen actually knows well enough to be asked about as a person
- [ ] Checkpoint 1 (Eileen): whether review-bomb copypasta counts as sentiment
      or gets down-weighted
- [ ] Eileen hand-labels a 200-review validation set (Phase 2, scorer choice)
      and reviews the theme taxonomy's seed keywords (Phase 3)

### Roadmap project 3 — F2P vs Paid: Pricing & Engagement on Steam (gaming)
Status: unclear — see `Needs Eileen`. Previously logged as "dashboard built
on sample data, real SteamSpy pull pending," but a 2026-09-10 audit found no
trace of that build anywhere on this machine. Treat as not-yet-started
until Eileen confirms otherwise. Full spec:
`portfolio-projects/steam-pricing-engagement/spec-steam-pricing-engagement.md`.
The only gaming-themed project in the portfolio.
- [ ] Checkpoint 0 (Eileen): how to represent SteamSpy's owner-count ranges —
      the spec's suggested default is interval midpoint with a sensitivity
      check at both bounds
- [ ] Checkpoint 1 (Eileen): which games count (the inclusion rule, and its
      survivorship bias) and the headline engagement metric (median playtime
      vs. CCU per owner)
- [ ] Once those land: run the real SteamSpy pull, then write the project
      page (SPIDER structure, a "what didn't work" section covering the
      sample-vs-real gap, business question in the first two lines)

### Roadmap project 4 — Support Triage: Which Conversations Are About to Go Bad (customer experience)
Status: spec written, not built. Full spec:
`portfolio-projects/support-triage/spec-support-triage.md`.
Checked against `launch-sentiment` for a technique repeat: confirmed distinct
— aggregate public-sentiment monitoring over Steam/Reddit review text
(launch-sentiment) vs. per-conversation urgency triage plus a reply-speed
analysis on Twitter support threads (this one), different model families and
evaluation approaches. Build after Launch Sentiment rather than back-to-back
so the two don't read as "two NLP projects in a row." The site's placeholder
card for this idea (`support-ticket-sentiment-tracker`) predated the split
and was still titled/described as the old absorbed version — retitled and
resynced to this spec 2026-09-10.
- [ ] Checkpoint 0 (Eileen): pick 2–4 brands from the Twitter support dataset,
      spanning industries (e.g. airline + telco + retailer)
- [ ] Bad-outcome definition (Eileen reads 40 of 100 agent-sampled
      conversations and picks the definition that matches human judgement of
      "this went badly")

### Roadmap project 5 — Streaming Engagement: Four Sources, One Model (media, data-engineering-led)
Status: spec written, not built. Full spec:
`portfolio-projects/streaming-engagement/spec-streaming-engagement.md`.
Real sources: Netflix Engagement Report, Netflix Global Top 10 weekly, IMDb
non-commercial datasets, Google Trends. Good entity-resolution skill
showcase, but it competes with Ad Creative Pipeline for the same
"data-engineering project" slot and media is already the most-covered domain
in the portfolio — only worth doing if a second DE-flavoured project earns
its place.
- [ ] Checkpoint 0 (Eileen): confirm all four sources are still live and
      downloadable as described, or swap one
- [ ] Eileen hand-labels a 30-pair fuzzy-title-match fixture and sets the
      fuzzy-match threshold (Phase 2)

### Roadmap project 6 — Beyond Accuracy: What a Recommender Trades Away (media)
Status: spec written, not built. Full spec:
`portfolio-projects/recommender-tradeoffs/spec-recommender-tradeoffs.md`.
Lowest priority — media is the most saturated domain in the portfolio
already. Dataset changed 2026-09-10: swapped MovieLens for the **Last.fm
Dataset – 1K Users** (Celma, 2010) — real timestamped listening events
(implicit feedback: plays, not star ratings), which is both less saturated
than MovieLens in the portfolio/tutorial sense and a better fit for the
"evaluation study" angle, since implicit feedback has no negative signal and
that becomes part of what the metric panel has to handle. Overlap with the
existing Amazon Prime clustering project is already answered in the spec:
framed as an evaluation study of what each recommender trades away, not a
second "build a recommender" project.
- [ ] Evaluation-protocol checkpoint (Eileen): what counts as a "relevant"
      listen with implicit data (e.g. minimum play count), K for top-K
      metrics, minimum-history user floor
- [ ] Centrepiece judgement (Eileen): where a real streaming service should
      sit on the accuracy-vs-catalogue-coverage trade-off, and why

### CV / content gaps
- [ ] `Dynamic AI Chatbot` has no GitHub link on the CV. Either add the link
      or note why it's private.
- [ ] `Creator Content Decision Dashboard` has no GitHub link, and its bullet
      list contains two near-duplicate entries. Deduplicate.
- [ ] The CV lists 25+ projects. Consider a curated "featured" set of 4–6 on
      the site homepage, ordered by relevance to gaming/media/marketing/CX,
      with the rest in a full archive list.
      — *this is a judgement call; propose, don't execute*

---

## Done
<!-- Agent appends here on final approval, newest first, with the date. -->

- [x] 2026-09-10 — Phone-width render check + data-source honesty audit.
      Fixed: `index.html` nav overflow (mobile menu added), missing
      e-commerce card image, two stale placeholder tool lists, one
      stale-named placeholder card. Escalated: gaming dashboard status,
      two orphaned placeholder cards (see `Needs Eileen`). One minor
      cosmetic SVG-label overflow left unfixed (low priority, noted in the
      report). Report: `agent-log/mobile-and-data-audit-2026-09-10.md`.
- [x] 2026-09-08 — Audit both existing project pages against the 8
      hiring-manager criteria. Report: `agent-log/audit-2026-09-08.md`.
- [x] 2026-09-08 — Check every GitHub link on the site resolves. Report:
      `agent-log/link-check-2026-09-08.md`.
