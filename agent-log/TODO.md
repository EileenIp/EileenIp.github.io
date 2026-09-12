# TODO — EileenIp.github.io

The agent's backlog. Work top-to-bottom within each section. Eileen edits
freely; the agent only moves items between sections and adds notes.

**Priority order:** `Needs Eileen` is never worked on. `In progress` first,
then `Todo` top-down.

---

## Needs Eileen
<!-- Agent: move blocked items here with a one-line note on what you need.
     Never attempt these. -->

- [ ] `creator-content-decision-dashboard-2026` has no impact stat. It is
      now featured on the homepage (card 5 of 5), where its
      `.project-impact` block is deliberately omitted rather than rendered
      blank — see the `EILEEN TO ADD` comment in `index.html`. It is the
      only featured card without a number, and it shows.
      — *blocking: needs Eileen to supply a real figure from that Tableau
      dashboard, in her own words. Once it exists, set `impactStat` in
      `data/projects.json` and restore the commented-out block in
      `index.html`. The agent won't invent a number.*
- [ ] Once the Creator dashboard has an impact stat, consider dropping
      `ecommerce-behavior-conversion-2019` from the featured five. It
      duplicates `subscriber-churn-retention-2026`'s method exactly (same
      `projectType`, same Python/Pandas/LightGBM/SHAP/K-Means toolchain),
      it's the only 2019 entry among four 2026 ones, and E-Commerce isn't
      one of the five target domains while Media & Entertainment is. Kept
      for now only because a card with a real number beats a card without
      one.
      — *blocking: judgement call, and it depends on the item above
      landing first — propose, don't execute*
---

## In progress
<!-- Max 1–2 items. Agent moves things here when a plan is approved. -->

### Roadmap project 3 — F2P vs Paid: Pricing & Engagement on Steam (gaming)
Started 2026-09-13. Repo: `portfolio-projects/steam-pricing-engagement` — its
own git repo on `master`, two commits, nothing pushed anywhere.
(Roadmap project 2 is also being built, in a parallel session; that session
hasn't recorded itself here yet.)

Checkpoints 0 and 1 cleared by Eileen 2026-09-13 — all three spec defaults:
owner ranges as interval midpoint with every owner-dependent result re-run at
both bounds; inclusion at released 2015+ and an owner-midpoint floor of 20,000
(band-aligned — it drops SteamSpy's `0 .. 20,000` band exactly, and the
survivorship bias gets stated on the page); median playtime forever as the
headline metric with CCU per owner as the robustness check.

- [x] Phase 0 — SteamSpy catalogue puller (`all` pages) + storefront
      enrichment, disk cache, resume file, live-verified against both APIs
- [x] Phase 1 — inclusion rule, owner-interval handling, sensitivity bounds,
      cohort report broken down F2P vs paid; 40 pytest tests green
- [x] Phase 2a — engagement metric rebuilt on Steam review payloads. SteamSpy
      serves `median_forever` / `average_forever` / `median_2weeks` /
      `average_2weeks` but all four are zero, for all 1,000 apps on the first
      `all` page and for both spot-checked apps (verified live 2026-09-13), so
      every playtime option Checkpoint 1b chose between was gone. Escalated to
      Eileen, who delegated the call; the agent took playtime from
      `author.playtime_forever` on the appreviews endpoint (populated — 200
      reviewers, median 5,761.5 minutes for ELDEN RING) over the cheaper option
      of promoting CCU per owner to headline. Reasoning, and the two new biases
      it buys, are in the project README's "What didn't work" section. CCU per
      owner is kept as a second metric on the full cohort. 50 tests green.
- [ ] Catalogue pull running as of 2026-09-13 — 60s per `all` page, cached and
      resumable, so it can be stopped and restarted freely. Re-run
      `python -m src.steamspy_fetch catalogue` to continue it.
- [x] Phase 2a — genre stratification moved onto SteamSpy tags rather than Steam
      storefront genres (Eileen, 2026-09-13). The storefront genres are three
      broad buckets — ELDEN RING is "Action, RPG" — and the confound the project
      corrects for lives at MOBA vs Souls-like. Two guards were needed before
      tags were usable: business-model tags are excluded by name (Dota 2's top
      tag is "Free to Play" at 60,040 votes, three times the next, so a top-tag
      rule would have made the strata a restatement of the pricing model and
      left no cell containing both), and the vocabulary is an explicit allowlist
      because most high-voted tags are descriptors, not genres. Ships with a
      coverage audit (`python -m src.cohort coverage`) that reports the
      classified share split by pricing model and names the tags worth adding.
      Live-verified: ELDEN RING strata as Souls-like. 58 tests green.
- [x] Genre vocabulary audited against a seeded 1,000-game sample (2026-09-13).
      It did not need extending — coverage was 99.3%, and the misses were not
      missing genres but software (Utilities, Design & Illustration, VR), now
      excluded on the storefront's own labels: 13 of 1,000 sampled apps. What
      it did need was tiering. Ranking eligible tags by votes put 65% of the
      cohort in a broad bucket (Action/Adventure/Casual alone 40%), because
      Steam's umbrella tags out-vote the informative ones — no better than the
      storefront genres tags replaced. Specific tags now beat umbrellas
      regardless of votes; broad-bucket share fell to 18%.
- [x] Catalogue pull complete: 27,021 apps, 26,017 above the owner floor. Two
      bugs fixed on the way — the owner floor used `>=`, which readmitted the
      `0 .. 20,000` band at the upper sensitivity bound (the band the floor
      exists to drop), and the pull had no early stop despite `all` being
      sorted by owners descending, so it was fetching pages of excluded apps at
      60s each.
- [ ] **Full enrichment — 26,017 apps at ~2.5s each, about 18 hours.** The
      audit settled that this is not optional: F2P is ~16% of the cohort, so
      spread across 84 strata only one genre has 8+ games of each pricing model
      at sample scale. 45 genres hold at least one of each in a 3.8% sample, so
      the full pull should populate many of them, but the within-genre
      correction has nothing to stand on until it runs. Cached and resumable —
      `python -m src.steamspy_fetch enrich` — so it can run across sittings.
- [x] Phase 2b machinery built and validated on the audit sample (2026-09-13):
      naive comparison, within-genre correction pooled by pairwise weight,
      price bands, release-year cohorts, all at three owner bounds. Mann-Whitney
      with tie and continuity corrections plus Cliff's delta, hand-written to
      keep the dependency list at three. Includes a Simpson's-paradox test so
      the correction is shown to reverse a naive result, not just adjust it.
      The sample run produced no conclusion, for a recorded reason: more than
      half the cohort has ccu 0 (56% f2p, 51% paid), so the CCU metric is mostly
      ties and the one usable genre cell is 86% tied at zero. Tie share is now
      printed beside every result. This is a second, independent argument for
      not having made CCU the headline metric.
- [ ] Phase 2b results — re-run the analysis on the full cohort once enrichment
      finishes, then run the stratified playtime pull and re-run on the real
      headline metric. The playtime pull must wait for the enrichment: both use
      store.steampowered.com, and running them together would halve the
      effective request spacing (the pacer key is now shared so this is
      enforced, not just remembered).
- [ ] Checkpoint 2 (Eileen): the interpretation, once the within-genre numbers
      exist on real playtime.

---

## Todo

Ordered by priority (really-should-do first) per Eileen's 2026-09-10 call.
`subscription-renewal-churn` was cut entirely — same KKBox dataset as the
already-built `subscriber-churn-ltv`, not different enough to justify a
second repo.

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
- [x] 2026-09-13 — Curated "featured" set built: the homepage now shows the
      five built projects only, ordered by role relevance, with both
      unbuilt placeholders dropped to `projects.html`. Standing rule going
      forward: **the homepage features built work only** — a placeholder on
      the front page reads as an unfinished portfolio, whereas in the full
      grid it reads as a roadmap. The CV's 25+ projects are still not
      archived anywhere on the site; that half of this item is untouched.

---

## Done
<!-- Agent appends here on final approval, newest first, with the date. -->

- [x] 2026-09-13 — Homepage featured set rebuilt to the five built projects,
      in this order: ad-creative pipeline (only DE project, aimed at the
      BI Developer / Data Engineer roles), subscriber churn (strongest DS
      piece — 21.5M real transactions), advertising revenue (BI Developer
      on a different stack from card 1, so the two don't read as one
      skill), e-commerce (best single number: 0.92 ROC-AUC holding at
      0.946 a month later), creator dashboard (adds Media & Entertainment,
      a target domain, and Tableau as a third BI tool). Both unbuilt
      placeholders — `streaming-engagement-dashboard` and
      `support-ticket-sentiment-tracker` — were dropped from the homepage
      and remain on `projects.html`, untouched. Intro line updated to
      "Five projects across marketing, advertising, media and e-commerce."
      Verified at desktop and 375px: 5 cards, correct deep links, no
      horizontal overflow. Note what the honest intro line now reveals —
      the featured set covers **none** of gaming, social media or customer
      experience, three of the five stated target domains. That gap is the
      argument for roadmap projects 2, 3 and 4.

- [x] 2026-09-12 — Cleared all three `Needs Eileen` blockers in one pass.
      (1) Roadmap project 3 confirmed as starting from zero — no sample-data
      build exists; status line corrected above. (2) Both orphaned
      placeholder cards removed on Eileen's explicit instruction:
      `player-segmentation-ltv-model` and `social-feed-ranking-experiment`,
      deleted from `data/projects.json` (9 entries → 7) and their homepage
      cards from `index.html`. Neither had an image or any other asset, so
      nothing was orphaned. The homepage's "Six projects across gaming,
      media, marketing, and customer experience" line was corrected to
      "Four projects across media, marketing, and customer experience" —
      gaming coverage is now zero until project 3 is built.
      (3) `advertising-revenue-sales-efficiency-2026`'s methodology made
      comparative: "SQL architecture" now names and rejects PostgreSQL and
      a cloud warehouse (BigQuery/Snowflake); "Action logic" now names and
      rejects a trained propensity model, and states the trade-off fixed
      rules make. Verified in the browser at desktop and 375px.
      **Caveat, same shape as the project-1 limitations:** Eileen asked the
      agent to decide the alternatives and the rejection reasons
      ("you decide on the specific reason and why is rejected"). What's
      written is technically true and grounded in the project's real stack
      (SQL Server / Power BI / DAX, synthetic commercial layer) and reads
      as a reasoned trade-off, *not* as a claim about what was literally
      evaluated at build time — **read both passages before an interview
      and make sure you'd defend them as your own reasoning**, since an
      interviewer may well ask "so what made you rule Postgres out?"

- [x] 2026-09-12 — Roadmap project 1 — Ad Creative Performance Pipeline,
      complete. All four Phase 4 outputs shipped: dashboard, report
      (`deliverables/same-day-reliability-report.docx`), deck (`-deck.pptx`),
      and website case study (`data/projects.json`, replacing the old
      placeholder card). Live at
      `github.com/EileenIp/ad-creative-pipeline`,
      https://eileenip.github.io/ad-creative-pipeline/ and .../dashboard/,
      checked in browser at their real URLs. Verified 2026-09-12: report,
      deck, and case study all have real filled-in Limitations content, no
      `[EILEEN TO ADD]` placeholders left anywhere. Full story:
      `portfolio-projects/ad-creative-pipeline/spec-ad-creative-pipeline.md`.
      **Caveat carried forward: read the report's Limitations section and
      the case study's two limitations before relying on them in an
      interview** — they're real and grounded in the session's actual
      findings, but the agent wrote them at Eileen's explicit request
      ("i don't know what to write can you write all of them"), not
      drafted by her first.
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
