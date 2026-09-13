# TODO — EileenIp.github.io

The working backlog. Work top-to-bottom within each section. Eileen edits
freely; otherwise items only move between sections and pick up notes.

**Priority order:** `Needs Eileen` is never worked on. `In progress` first,
then `Todo` top-down.

---

## Needs Eileen
<!-- Blocked items move here with a one-line note on what's needed.
     Never attempt these. -->

- [ ] `creator-content-decision-dashboard-2026` has no impact stat. It is
      now featured on the homepage (card 5 of 5), where its
      `.project-impact` block is deliberately omitted rather than rendered
      blank — see the `EILEEN TO ADD` comment in `index.html`. It is the
      only featured card without a number, and it shows.
      — *blocking: needs Eileen to supply a real figure from that Tableau
      dashboard, in her own words. Once it exists, set `impactStat` in
      `data/projects.json` and restore the commented-out block in
      `index.html`. No number gets invented here.*
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
<!-- Max 1–2 items. Things move here once a plan is approved. -->

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
      every playtime option Checkpoint 1b chose between was gone. Escalated
      as a blocker, then settled: playtime now comes from
      `author.playtime_forever` on the appreviews endpoint (populated — 200
      reviewers, median 5,761.5 minutes for ELDEN RING) over the cheaper option
      of promoting CCU per owner to headline. Reasoning, and the two new biases
      it buys, are in the project README's "What didn't work" section. CCU per
      owner is kept as a second metric on the full cohort. 50 tests green.
- [x] Catalogue pull — 60s per `all` page, cached and resumable. This was the
      in-flight status line; the same pull is recorded complete three items
      below, with the two bugs it turned up. Kept rather than deleted so the
      order the work actually happened in still reads straight.
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
- [x] **Full enrichment complete — all 26,017 apps, 2026-09-13.** The audit had
      settled that this was not optional: F2P is ~16% of the cohort, so spread
      across 84 strata only one genre had 8+ games of each pricing model at
      sample scale, and the within-genre correction had nothing to stand on
      until the full pull ran. Verified rather than assumed: `resume.json`
      records 26,017 enriched against 26,017 candidates, with 26,017 cached
      `store_app` payloads and 26,018 `steamspy_app`, and a seeded random sample
      of 200 storefront payloads came back with zero failures and zero empties.
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
- [ ] Phase 2b results — re-run the analysis on the full cohort, then re-run on
      the real headline metric once the playtime pull lands. The ordering
      constraint that governed this item is now satisfied: the playtime pull had
      to wait for the enrichment, because both use store.steampowered.com and
      running them together would halve the effective request spacing (the pacer
      key is shared, so this is enforced rather than just remembered).
      Enrichment finished first; `python -m src.playtime sample` started
      2026-09-13 16:02 and was still running when this was written. Nothing else
      should touch that host until it finishes.
- [ ] Checkpoint 2 (Eileen): the interpretation, once the within-genre numbers
      exist on real playtime.

### Roadmap project 4 — Support Triage: Which Conversations Are About to Go Bad (customer experience)
Started 2026-09-13 on Eileen's ask. Repo: `portfolio-projects/support-triage` —
its own git repo on `master`, nothing pushed anywhere. Full spec:
`portfolio-projects/support-triage/spec-support-triage.md`.

Note against this section's "max 1–2 items" rule: this makes three roadmap
projects open at once (2, 3 and 4). Flagging rather than deciding — if that is
too many in flight, this is the one that just started.

The sequencing note from the backlog still holds and is now satisfied: build
after Launch Sentiment, not back-to-back, so the two don't read as "two NLP
projects in a row" — Launch Sentiment reached its deliverables on 2026-09-13.
Distinctness from it was confirmed when the spec was written: aggregate
public-sentiment monitoring over review text there, per-conversation urgency
triage plus a reply-speed analysis on Twitter support threads here.

- [x] Phase 0 — dataset pulled (Kaggle `thoughtvector/customer-support-on-twitter`,
      516 MB, 2,811,774 tweets) and conversations rebuilt from the reply graph.
      798,197 conversations recovered, 789,448 qualifying for modelling
      (customer-opened, brand-answered, under 100 tweets). 54.5% are a single
      exchange — one customer message, one brand reply. Data quality came back
      cleaner than the spec expected: no duplicate tweet ids, no unparseable
      timestamps, and zero replies stamped before the tweet they answer
      (verified independently of the pipeline across 2,013,577 edges). What did
      need forgiving: 172,500 replies naming a tweet that isn't in the file,
      3,862 the other way, 193 broadcast-sized components, 54,642 threads with
      more than one customer in them. 34 tests green, including the spec's
      hand-built 15-thread fixture.
- [!] Phase 0 finding that shapes Phase 3: the corpus is two months, not the
      nine years its date range suggests. It runs 2008-05-08 to 2017-12-03, but
      only 687 conversations predate 2017 — 94.4% open in October–November 2017
      and 99.2% in October–December. So nothing seasonal can be claimed, there
      is no before/after to compare, and every brand's reply speed is measured
      over the same few weeks (good for comparability, bad for generality).
      Belongs in the limitations section either way.
- [x] Checkpoint 0 (Eileen, 2026-09-13): **AmazonHelp, Delta, TMobileHelp,
      Tesco** — retail, airline, telco, grocery. The first three are fast
      repliers and so comparable; Tesco is in it because at a 101-minute median
      it is ~30x slower than T-Mobile and a third of its conversations run to
      five messages, which is what gives the Phase 3 speed analysis something to
      bite on. 146,506 conversations, 594,288 tweets, all text present.
      Reasoning recorded in `src/config.py`. Caveat carried forward: AmazonHelp
      is 56% of the subset, so pooled figures are mostly Amazon figures.
- [x] Phase 1 build — four candidate bad-outcome definitions (customer keeps
      coming back / sentiment worsens / thread dies on an unanswered negative
      message / escalation language), firing on 11.9%, 3.4%, 3.9% and 2.0% of
      the subset and overlapping little. Leakage boundary enforced by
      perturbation tests in both directions: rewrite the thread after the
      opening message and the features must not move, rewrite the opener and the
      labels must not move. 74 tests green.
- [ ] **Eileen: read 40 conversations in `portfolio-projects/support-triage/label.html`**
      (~1 hour). Open it, answer "did this go badly for the customer?" with
      Y / N / ?, then Export and save `audit-verdicts.json` into
      `data/validation/`. Verdicts persist if interrupted. The page never shows
      which candidate flagged a conversation — the audit is blind on purpose, so
      it measures judgement rather than agreement with a hint. The sample is 25
      per brand and includes 20 threads no candidate flagged at all.
      Then `python -m src.score_audit` ranks the four against those verdicts and
      Checkpoint 1 is the pick. Per the spec this reading session is the single
      best interview story in the project, so it is worth writing down what the
      borderline ones felt like while reading them.

### Site — self-hosted analytics (Cloudflare Workers + D1)
Started 2026-09-13 on Eileen's ask. This session owns it; the resume builder
below is a parallel session.

Note against this section's "max 1-2 items" rule, extending the flag project 4
already raised: these two make four items in flight (roadmap 3 and 4, plus
these). Both of these are site work rather than roadmap projects, and both
were Eileen's explicit ask with a session assigned to each — flagging the
count, not disputing it.

The site has never had any analytics, so there is no answer to "does anyone
reach the case studies" or "does anyone download the CV". Chosen over a
hosted counter (GoatCounter, Cloudflare Web Analytics, Plausible) because
Eileen asked for our own: a Workers collector, D1 for storage, and a
dashboard page on this site, at $0 on the free tier — and because
ingest -> store -> query -> dashboard on real traffic is the second
data-engineering project the Todo section has been arguing about, except the
data is hers.

Standing constraint: no cookies and no third-party beacon, so the page needs
no consent banner. That is a design input, not a nicety — the alternative is
a banner on a portfolio site.

Built 2026-09-13, not deployed. Full deploy guide and the privacy reasoning
are in `analytics/README.md`.

- [ ] **Checkpoint 0 (Eileen): free Cloudflare account.** The only step that
      needs her, and everything below is written and waiting on it. No card
      and no domain required for Workers + D1 on the free plan.
- [x] Collector Worker — `analytics/worker/src/worker.js`. POST /collect and
      a token-gated GET /stats. Stores day, kind, path, referrer *host*,
      two-letter country and a daily-rotating visitor hash; stores no IP, no
      user agent, no full referrer, no query string and no cookie. The hash
      is `SHA-256(secret + UTC-day + IP + UA)` truncated, so a visitor is
      countable within a day and an unrelated hash the next — the same
      construction GoatCounter and Plausible use, and the reason the site
      needs no consent banner. Event kinds are allowlisted, so a stray script
      cannot invent event types. D1 schema in `analytics/worker/schema.sql`,
      raw rows rather than rollups so an unanticipated question can still be
      asked of old traffic.
- [x] Site snippet — `js/analytics.js`, wired into all six pages. Honours Do
      Not Track, inert when no endpoint is set, `sendBeacon` so an outbound
      click survives the page closing. The endpoint lives in exactly one
      place, `js/analytics-config.js`, so deploying means editing one line.
- [x] Dashboard — `analytics.html` + `js/analytics-dashboard.js` +
      `css/analytics.css`. Token gate, 7/30/90/365 ranges, three stat tiles,
      a two-series daily chart with crosshair and tooltip, and tables for
      pages, referrers, countries and events. `noindex`, absent from the nav
      and from `sitemap.xml`: the numbers are behind the token anyway, but a
      recruiter reading the portfolio has no reason to be shown the door.
      The two series colours were run through the palette validator against
      this site's dark surface rather than picked by eye — all six checks
      pass. Verified end to end against a mock `/stats`: tiles, chart,
      tooltip, all five tables, 375px with no overflow.
- [ ] Resume-download event — the mechanism is built (`data-track="download"`,
      optional `data-track-meta` JSON, `window.track()`), and the dashboard
      already has the tile and a roles table reading
      `json_extract(meta,'$.role')`. Both read zero until the resume builder
      ships and fires the event. **Not wired to the current Resume buttons on
      purpose: they do nothing, and counting clicks on a dead button is worse
      than no number.** Contract for the builder session is in
      `analytics/README.md`.
- [ ] Interim hosted counter — still open, still Eileen's call. Every day
      without one is traffic that cannot be recovered later, and the Worker
      cannot go live until Checkpoint 0.

### Site — recruiter-personalised resume builder
Started 2026-09-13 on Eileen's ask, in a parallel session. Not this session's
work; recorded here so the two don't collide.

Reframed by Eileen 2026-09-13, and the reframing is the whole design: the
recruiters who download the CV from the site are cold — she has not sent
them anything — so the tailoring cannot happen in advance the way
`career/build_tailored_resumes.py` does it. It has to happen at download
time, chosen by the recruiter.

Shape: a picker above the download button. The visitor names the role they
are hiring for (Data Analyst / Data Scientist / BI Developer / Data
Engineer), optionally an industry, and the page assembles a PDF in their
browser from the ~28 projects in `CV 2026.docx`. Client-side, because
GitHub Pages runs no server code.

Three constraints, all load-bearing:
- **Selection varies, claims never do.** Bullets stay exactly as written in
  the docx. Choosing which real projects to show is tailoring; rewriting
  achievements per audience is a story that has to be defended in an
  interview.
- **The default is one click.** A visitor who ignores the picker gets a solid
  all-rounder immediately. Nobody should have to configure anything to get a
  CV.
- Every variant is public. Do not publish the per-company PDFs in
  `career/tailored-resumes-2026-09-11/` — a directory listing shows them to
  each other, and the URL pattern reads as mail-merge.

- [ ] Eileen corrects the role/industry tagging of the ~28 CV projects
      (drafted from the CV for her to fix, not invented)
- [ ] `data/resume.json` — the CV as structured data
- [ ] Client-side PDF generation + the picker UI
- [ ] Feeds the analytics above: which role each visitor picks

---

## Todo

Ordered by priority (really-should-do first) per Eileen's 2026-09-10 call.
`subscription-renewal-churn` was cut entirely — same KKBox dataset as the
already-built `subscriber-churn-ltv`, not different enough to justify a
second repo.

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
<!-- Appended here on final approval, newest first, with the date. -->

- [x] 2026-09-13 — **Site polish pass: social card, job tracker, project
      images.** Three items off one ask ("I have credit, what should I spend
      it on"). Not committed at time of writing — left dirty for Eileen to
      review.

      **Social metadata and favicon.** The site had no `og:`/`twitter:` tags,
      no favicon and no canonical, so every LinkedIn or Slack share rendered
      as a bare grey link. Added across all six pages, plus `sitemap.xml` and
      `robots.txt`. The card and icon are generated by
      `scripts/generate_brand_assets.py` from the site's own palette, so a
      palette change is a re-run rather than a hand-edit. Not yet validated
      in LinkedIn's Post Inspector — that needs Eileen's login, and it only
      works once the change is deployed.

      **Job tracker rebuilt for scanning.** Eileen's complaint was that the
      card grid made it impossible to see which roles she is actually in.
      Now a pipeline strip (36 To Apply · 15 Applied · 1 Finished Assessment ·
      30 Rejected · 9 Withdrawn, each clickable as a filter) over rows grouped
      by stage. `data/companies.json` collapses the spreadsheet's spellings
      onto 85 canonical companies — `nab`/`Nab` and `commbank`/`Commonwealth
      Bank` were separate before — and company search now matches the
      canonical name, so "commonwealth" finds rows spelled "commbank".
      74 logos cached into `images/logos/` rather than hot-linked: a hotlink
      breaks when the provider changes and leaks every visitor's request to a
      third party on a page that is already public. Verified at 1280px and
      375px, 91 rows, no horizontal overflow. Dead `.jt-card*` rules removed —
      note that the first attempt deleted the selector lines and left two
      multi-line rule bodies orphaned, which unbalanced the stylesheet by two
      braces; caught by a brace count before anything was committed.

      **Project card images.** Only two of eight projects had an image and one
      of those hot-linked `raw.githubusercontent.com`. Now generated by
      `scripts/generate_project_cards.py` at the 16:10 the grid expects:
      real dashboard screenshots for Ad Creative Pipeline, Launch Sentiment
      and Subscriber Churn, the Creator dashboard PNG downloaded locally,
      Advertising Revenue kept as-is, and typographic tiles for the three with
      no dashboard. **The rule the script enforces: no generated chart
      imagery, ever.** A card that merely looks like a dashboard is a claim
      about work that does not exist and is the first thing an interviewer
      would ask about. The five homepage cards were `role="img"` divs with
      alt text describing a crop that was never there; they now point at real
      files with real alt text.

      Still open, and deliberately: 10 companies show an initials tile instead
      of a logo. ASIO, BMW, Fujitsu, McKinsey and Spotlight Retail Group 404'd
      on fetch; ADN, FMD, "GOVERNMENT", Farrer Capital Management and Openmesh
      have no domain in the registry because guessing one puts the wrong
      company's logo on the row. Fill them into
      `scripts/build_company_registry.py` and re-run.

      **Eileen's standing decision, recorded:** the job tracker, to-do,
      calendar and progress pages stay public and linked from the main nav for
      now, `data/job-applications.json` included — which publishes 30
      rejections by company to anyone who opens the site, recruiters among
      them. Raised 2026-09-13, and she chose to keep it while she works on the
      page. Worth revisiting, not worth re-arguing.

- [x] 2026-09-13 — **Roadmap project 2 — Launch Sentiment, complete.** Built in
      a parallel session to project 3; this entry is that session recording
      itself. Repo: `github.com/EileenIp/launch-sentiment` (public, `main`),
      dashboard live at `eileenip.github.io/launch-sentiment/dashboard/`, case
      study live on the site with all four footer links verified 200 before
      committing. Restores the gaming coverage that went to zero when the two
      orphaned placeholder cards were removed earlier the same day.

      **The launch (Checkpoint 0):** HELLDIVERS 2, chosen over Cyberpunk 2077 on
      recon numbers. It launched well and soured later, which leaves a positive
      baseline for the leading-indicator question to be asked against; Cyberpunk
      collapsed on day one, leaving nothing to lead. Accepted deviation: 31
      months old against the spec's 6–24, Eileen's call.

      **Corpus:** 886,850 reviews, 2024-02-08 to 2024-11-04, 100% of what Steam
      reports. Window extended from the spec's 183 days to 271 after the first
      lag analysis, because the six-month window closed three days into the
      August nerf event — the one event that could plausibly have built
      gradually, so a null measured on it would have been an artefact of the
      window rather than a result.

      **The headline is a null, and it is the strongest thing in the project.**
      No complaint theme leads the review score. Both collapses were triggered
      by dated developer actions — the PSN account-linking announcement and a
      balance patch — so themes and score moved the same day. Raw correlation
      suggested leads in seven of eight themes, up to 12 days; a rotation test,
      a correction for testing eight themes, and a sensitivity sweep on thin
      days each removed them independently. Only psn_access survives, at lag 0.

      **What the data does support:** same-day diagnosis. psn_access 21%→57% on
      3 May while balance fell; balance 0%→46% on 6 August while psn stayed at
      3%. Derived alert rule: a 12-point single-day drop in positive share fired
      3 times in 9 months with zero false alarms, against 35 fires and 29 false
      alarms for the obvious "below 72%" level rule.

      **Checkpoint 2 reversed the spec.** Both sentiment scorers were rejected
      on Eileen's 200 hand labels — VADER 61.5%, RoBERTa 64.0%, against a 72.0%
      majority-class baseline. Both lose to guessing "positive". Steam's own
      thumbs-up matched her labels 95.0%, so the index uses that and the models
      stay in the repo as the evidence for the decision. The failure is specific
      to this game: players express enthusiasm through violence and
      self-deprecation, which general-purpose models read as negative.

      **Authorship, and how it was resolved — this is the difference from
      project 1.** Eileen asked the agent to draft the Limitations, "What didn't
      work" and Recommendation sections, then asked for them to be rewritten in
      her voice. The agent declined to imitate her and interviewed her instead;
      her four answers went in verbatim, and `src/deliverables.py`'s authorship
      note names exactly which passages are hers. Hers: the opening of
      Limitations (the binary thumbs-up as the limitation she raises first, and
      "direction, not measurement" as how far she trusts the daily share), the
      answer to the obvious objection to the threshold — "a 12-point drop is
      still a 12-point drop" — and the opening of "On the result being a null",
      "a good outcome, better than forcing a fake finding". Those three are hers
      and should be left as written; the same four answers are in the report,
      the deck and the case study.

      **Still the agent's words, and still worth reading before an interview:**
      everything else in those three sections — the rest of Limitations, all of
      "What didn't work", and the mechanics of the threshold recommendation. The
      claims are traceable to numbers the project produced and the threshold was
      derived by testing rules against the data rather than asserted, but the
      framing is not hers yet.

      Still open: `NOTES.md` has never been written by the agent and holds none
      of this project's decisions — the spec reserves it for Eileen and the agent
      has never written to it. The repo is not pinned on the GitHub profile;
      pinning was attempted three times on 2026-09-13, once from a private
      window, and never saved. There is no API for it (the GraphQL `pinnedItems`
      field is read-only), so this cannot be scripted and further retries are not
      worth the time — the README's Featured Projects section renders above the
      repo grid, so the profile still leads with the right work.

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
      **Caveat, same shape as the project-1 limitations:** the alternatives
      and their rejection reasons were written to fill the gap, not drawn
      from the original project work. What's
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
      interview** — they're real and grounded in the project's actual
      findings, but they were written to fill the gap rather than
      drafted by Eileen first.
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
