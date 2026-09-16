# TODO — EileenIp.github.io

The working backlog. Work top-to-bottom within each section. Eileen edits
freely; otherwise items only move between sections and pick up notes.

**Priority order:** `Needs Eileen` is never worked on. `In progress` first,
then `Todo` top-down.

---

## Needs Eileen
<!-- Blocked items move here with a one-line note on what's needed.
     Never attempt these. -->

- [ ] Support Triage is now done, so the question the 2026-09-17 featured-five
      entry held back is live: should it displace the Creator Dashboard on the
      homepage? The case for it, from that entry: Customer Experience is a
      target domain with no featured coverage, and its stat is sharper. The
      case against: Creator is the only featured Tableau project and the only
      Media & Entertainment one. Judgement call — propose, don't execute.
---

## In progress
<!-- Max 1–2 items. Things move here once a plan is approved. -->

Nothing. Support Triage and the resume builder were both finished and moved to
Done on 2026-09-17, after a check of the repos found every open item already
closed.

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
- [ ] The E-commerce Purchase-Prediction entry's "GitHub" link on the CV goes
      to the site's case study (`projects.html?project=...`), not to GitHub.
      A public repo exists, `EileenIp/Ecommerce-Behaviour-Conversion-Analysis`
      — point the link there, or relabel it. Found 2026-09-17, not changed.
- [ ] The Advertising Revenue entry has no italic keyword line on the CV,
      unlike every other project; one never existed. Its title line lists
      `Power BI, SQL Server, Python` and wraps its date onto a second line, as
      Launch Sentiment's and Steam's already do. Eileen's wording if she wants
      either changed.
- [ ] Optional: `data/resume.json` has `summary: null` because the docx has no
      summary section, so nothing was invented. If Eileen wants one it is a
      single fixed line shared by every variant — her call was that the
      summary does not vary by role.
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

- [x] 2026-09-17 — **CV docx fixed at source — and found to be unopenable in
      Word.** On Eileen's ask, the four CV defects logged under `CV / content
      gaps` were fixed in `career/cv/CV 2026 working.docx` itself:
      - the duplicated E-commerce Purchase-Prediction entry is gone, and its
        second copy's title line became the missing **Advertising Revenue &
        Sales Efficiency Growth Diagnostic** title, linked to
        `EileenIp/advertising-revenue-sales-efficiency`, so the three stranded
        bullets have their heading back;
      - Creator Content Decision Dashboard's "GitHub" now links to
        `EileenIp/creator-content-decision-dashboard`, and its two restated
        bullets are removed — the last two, the same ones the build script was
        already dropping, so no resume the site produces loses anything;
      - `Power Bi` → `Power BI` (16 places) and `Qilk` → `Qlik`.

      **The bigger finding: the master CV had not opened in Word since
      2026-09-16.** Word reported "The file appears to be corrupted." The cause
      was `scripts/add_cv_projects.py`: it rewrote the XML with ElementTree,
      which renamed Word's namespace prefixes (`w14` → `ns2`, `mc` → `ns1`, …)
      while the `mc:Ignorable` list still named the originals. The site's
      parser never noticed, and the "not verified in Word" caveat on the
      resume-builder entry below is exactly where it hid. Prefixes were
      restored by namespace URI from the last Word-saved copy. **Do not re-run
      `add_cv_projects.py` against the CV as it stands** — it would repeat
      both the damage and the additions.

      **Verified:** the fixed file opens in Word (9 pages) and was exported to
      PDF and read page by page; it passes OOXML schema validation, which the
      previous master did not; paragraph count moved by exactly the 7 removed
      (4 duplicate, 2 Creator, 1 stray spacer). The previous master is kept
      unmodified as `CV 2026 working (pre-cv-fixes backup, will not open in
      Word).docx`, checksum-verified.

      **Site side:** `data/resume.json` regenerated. Creator gains its link;
      the Advertising Revenue entry now comes from the CV rather than being
      reconstructed from `data/projects.json`, so its tools follow the CV's
      shorter line (DAX and Power Query dropped from the list, still named in
      its bullets). The workarounds in `build_resume_json.py` are removed; a
      duplicated entry or an untitled bullet now stops the build rather than
      being patched. Re-verified in the browser across all 128 role ×
      industry × YouTube combinations against the previous data: identical
      project picks, 75 with three projects, 53 with two, none over a page.

- [x] 2026-09-17 — **Roadmap project 4 — Support Triage: Which Conversations
      Are About to Go Bad. Built, written up and shipped.** Started 2026-09-13,
      finished 2026-09-15, closed out here on 2026-09-17 when a check of the
      repos found every item still listed as open already done. Repo:
      `github.com/EileenIp/support-triage` (public, `main`, 128 tests),
      dashboard live at `eileenip.github.io/support-triage/dashboard/`, case
      study live on the site (PR #2) with its dashboard, report and repo links.
      It replaced the `support-ticket-sentiment-tracker` placeholder and kept
      its id, so the deep link still resolves. Decision trail:
      `portfolio-projects/support-triage/spec-support-triage.md` and
      `data/validation/checkpoint1-findings.md`.

      **Data:** Kaggle `thoughtvector/customer-support-on-twitter`, 2.8M tweets
      rebuilt into 798,197 conversations from the reply graph. Checkpoint 0
      (Eileen) picked AmazonHelp, Delta, TMobileHelp and Tesco — 146,506
      conversations. Two caveats that belong in any retelling: the corpus is
      effectively two months (94.4% of conversations open in Oct–Nov 2017), so
      nothing seasonal or before/after can be claimed; and AmazonHelp is 56% of
      the subset, so pooled figures are mostly Amazon figures.

      **The label came from Eileen's reading, not the spec.** She read all 100
      conversations at Checkpoint 1, not the 40 asked for. All four of the
      spec's candidate definitions were high-precision, low-recall; the rule
      she was actually using became `left_unanswered` — the thread ends on a
      customer message that doesn't say it got sorted, 91% precision against
      her reading. All 18 of her can't-tells were the ghosting case, and
      ghosted-after-handoff conversations (37.6%) are censored rather than
      counted as negatives. Reweighting her sample puts P(went badly) near
      0.56: bad outcomes are probably not the minority class the spec assumed.

      **Model:** TF-IDF + logistic regression, isotonic-calibrated, against a
      keyword baseline (PR-AUC 0.368 vs 0.251 at Phase 2, 23% base rate).
      Checkpoint 2 (Eileen): fast-track the worst 10%, score over 0.40 — 159
      conversations a day, about one handler's shift, 44% of them bad against
      23% in the queue at large. The 295 bad conversations a day it leaves
      unprioritised are in the write-up next to that. The transformer variant
      that looked abandoned did finish, and won the paired comparison
      (0.374 vs 0.361, 95% CI [+0.005, +0.019]) — and **is not shipped**: it
      catches the same share at the operating point (19.2% vs 19.0%) and loses
      the per-message plain-words explanation the dashboard is built on. A
      deliberate call, reversible in one line.

      **Finding:** faster first replies go with *worse* outcomes — -5.9pp per
      tenfold increase in reply time, -4.8pp within brand, -3.2pp within
      predicted-difficulty band, and still negative (-2.1pp) with the
      censoring decision reversed. Stated as association throughout.

      **Authorship, stated plainly:** Limitations, "What didn't work" and the
      Recommendation were reserved for Eileen. On 2026-09-15 she asked for
      them to be written, so they are the agent's words. The
      `[DRAFT — EILEEN TO REPLACE]` markers were replaced by an authorship note
      in the report and README, and a test keeps the note in place. Her own
      account of the Checkpoint 1 judgement is quoted in the findings file and
      is the interview answer. Same standing caveat as projects 1–3 — **read
      those three sections before an interview and make sure you would defend
      them as your own.**

      Unblocks the question the featured-five entry below held back — whether
      Support Triage displaces the Creator Dashboard. Raised in `Needs Eileen`,
      not acted on.

- [x] 2026-09-17 — **Recruiter-personalised resume builder, live.** Built
      2026-09-13, merged via PR #1 and verified in production 2026-09-15 at
      `eileenip.github.io/resume.html` — all four roles build a one-page PDF in
      the browser. Follow-ups in PRs #12–14 on 2026-09-16. Closed out here on
      2026-09-17.

      **The design, and why:** recruiters who download the CV from the site are
      cold — Eileen has sent them nothing — so tailoring has to happen at
      download time, chosen by the visitor. A picker (Data Analyst / Data
      Scientist / BI Developer / Data Engineer, optional industry) assembles a
      PDF client-side from `data/resume.json`, which
      `scripts/build_resume_json.py` generates from the CV docx, so a CV edit
      is a re-run. jsPDF is vendored, not loaded from a CDN. Three constraints
      carry the design: **selection varies, claims never do** — bullets stay
      exactly as written; the default is one click; and the per-company PDFs
      in `career/tailored-resumes-2026-09-11/` are never published. What varies
      is the projects, the order of the skills line, and whether the YouTube
      channel appears — not the summary.

      **State at close:** 34 projects, after five built ones were added to the
      CV on Eileen's ask (Launch Sentiment, Steam F2P, Support Triage,
      Subscriber Churn, Ad Creative Pipeline; Streaming Engagement left out
      because it isn't built). The previous master is kept as
      `career/cv/CV 2026 working (pre-5-projects backup).docx`. Gaming is in
      the picker for the first time, and Data Engineer went from 3 projects to
      6. All 128 role × industry × YouTube combinations fit one page — 75
      carry three projects, 53 carry two, and the page says so. One page is
      only possible because of the `condensed` length setting, which is one
      setting for every variant, never per role. Tags reviewed and accepted by
      Eileen on 2026-09-16, recorded as accepted rather than corrected
      (`TAGS_ACCEPTED`); `tools/resume-tagger.html` still works for later
      changes. Downloads reach the analytics with role, industry and the
      YouTube flag.

      **Not verified by the agent:** how Word renders the swapped-in CV — there
      is no LibreOffice on this machine. **Worth knowing about the history:**
      the resume-builder branch also carried a parallel session's polish-pass
      and analytics work, and the homepage Resume-button rewiring landed inside
      that session's commit `403a95b`, whose message doesn't mention it. The CV
      defects found along the way moved to `CV / content gaps`.

- [x] 2026-09-17 — **Homepage featured five re-picked: E-Commerce out, Steam
      in.** The set was chosen on 2026-09-13, before Launch Sentiment and Steam
      shipped, and had not been revisited since. Eileen asked which five were
      best; this is the swap the `Needs Eileen` item had proposed, now acted on
      at her instruction.

      **The five:** Ad Creative Pipeline (the only data-engineering project),
      Subscriber Churn (strongest data science), Advertising Revenue (BI on
      Power BI / SQL Server), **F2P vs Paid on Steam**, Creator Dashboard (BI
      on Tableau, Media & Entertainment).

      **Why E-Commerce went:** 2019 among four 2026 projects; not one of the
      five target domains; the identical toolchain to Subscriber Churn, which
      was visible on the page itself as two cards both tagged
      `Python · LightGBM`; and a single bare-repo link. The only argument for
      keeping it — a card with a number beats a card without — expired when
      the Creator dashboard got its stat. It remains on `projects.html`.

      **Why Steam, and not Launch Sentiment:** gaming is the first target
      domain listed and had two finished projects featured nowhere, so it
      needed a slot. Steam reads in three seconds; Launch Sentiment's headline
      is a null result, which is the better interview story and the worse
      card, because a null needs a paragraph. The intro line now reads
      "marketing, advertising, media and gaming".

      The card's description is the project's own `oneSentenceDescription`,
      verbatim. `cardDescription` was not used because it restates the impact
      line almost word for word.

      **Found while deciding, fixed separately (PR #27):** two featured cards,
      Ad Creative Pipeline and Subscriber Churn, had `links: null` — both
      public repos, no route to either from the site. Subscriber Churn's
      dashboard is still unlinked, deliberately: Pages is disabled on
      `subscriber-churn-ltv`, so its built `docs/` dashboard 404s publicly.
      Enabling Pages is Eileen's settings change.

      **Next candidate to revisit:** when Support Triage finishes, it is the
      strongest case to displace the Creator Dashboard — Customer Experience
      is a target domain with no featured coverage, and its stat is sharper.
      Held until it is actually done; it is still In progress.

- [x] 2026-09-16 — **Creator dashboard impact stat, the last `Needs Eileen`
      blocker on the homepage.** All five featured cards now carry a number;
      card 5 is no longer the conspicuous blank.

      **Shipped:** "Shorts are 8.8% of views but 1.2% of watch time and 2.7%
      of revenue — a views leaderboard misreads the channel three ways."
      Computed from the project's own dataset,
      `youtube-creator-trends/outputs/Synthetic_YouTube_Creator_Trends_Tableau.xlsx`:
      6,857 daily rows, 36 videos, Sep 2025 – Aug 2026, 7.40M views and
      616,788 watch hours. Shorts run 0.67 minutes per view against 5.00 for
      long-form, and the single live replay delivers 14.48 — 4% of views but
      11.6% of watch time, more than all five Shorts combined.

      **A stronger-looking candidate was rejected, and this is the part worth
      reading before an interview.** Ranking topics by views puts AI Tools
      first and Digital Marketing last; ranking by revenue per 1,000 views
      reverses it exactly — 73% more views for 16% less revenue per view. A
      clean inversion, and an artifact. Every topic's median is exactly
      $4.80/1k; the only videos that differ are the five Shorts at $1.40, and
      Digital Marketing is the one topic with no Short. The whole finding was
      composition, not a topic effect, and it would have collapsed the first
      time anyone asked for the breakdown. Format is the real structure in
      the data, which is why the shipped stat is about format.

      **Authorship, stated plainly:** Eileen chose the shorts finding over
      the alternatives and said the agent's wording was fine, so the sentence
      on the card is the agent's, not hers. The numbers are real and
      reproducible from the file above. Same standing caveat as projects 1
      and 2 — **read it before an interview and make sure you would defend
      that framing as your own.**

      **One thing to check:** the stat describes a format comparison. Whether
      the Tableau workbook itself surfaces a format breakdown was raised and
      not answered. If it does not, "where do I see that in the dashboard?"
      has no answer yet — either add the view or move the stat to something
      the dashboard shows.

- [x] 2026-09-16 — **Self-hosted analytics, live.** Built 2026-09-13,
      deployed today. Collector at
      `eileenip-analytics.eileen-ip.workers.dev`, D1 database
      `eileenip-analytics` in region OC (queries serve from the Brisbane
      colo), dashboard at `/analytics.html`. Chosen over a hosted counter
      (GoatCounter, Cloudflare Web Analytics, Plausible) on Eileen's ask, and
      because ingest -> store -> query -> dashboard over real traffic is a
      data-engineering project where the data is hers. $0 on the free tier.

      **The privacy design is the load-bearing part.** Stored per event: UTC
      day, event kind, same-origin path, referrer *host*, two-letter country,
      a daily-rotating visitor hash, and an optional small JSON blob. Not
      stored: IP, user agent, full referrer, query string, and any identifier
      that survives midnight. The hash is
      `SHA-256(secret + UTC-day + IP + UA)` truncated, so a visitor is
      countable within a day and an unrelated hash the next — the same
      construction GoatCounter and Plausible use, and the reason the site
      needs no consent banner. **If a later change starts writing a cookie or
      a localStorage id, the banner question comes back with it.** That
      constraint is recorded in the Worker, the snippet and the README.

      **Verified against the deployed Worker, not just locally:** `/` 404s,
      `/stats` 401s without a token, `/collect` 400s an unknown event kind
      and 204s a pageview and a download. Then verified in the rows it wrote,
      which is where the claims above either hold or don't — a referrer of
      `https://www.linkedin.com/feed/?q=secret` stored as `www.linkedin.com`
      with path and query gone, an oversized meta blob dropped rather than
      stored, country resolved, one stable visitor hash across three
      requests, no IP anywhere. Test rows deleted, so the table started
      empty. Eileen confirmed the dashboard loads with her token — the one
      path the agent could not check, since the token never passed through
      it.

      **Two setup facts, both now in `analytics/README.md`:** `workers.dev`
      subdomains are globally unique, so the account's is `eileen-ip` rather
      than `eileenip` — hence the double-barrelled host. And the TLS
      certificate for a freshly registered subdomain takes a few minutes to
      issue; until it does, every client fails the handshake, which reads
      exactly like a broken deploy and isn't.

      The interim hosted counter was dropped rather than done. It only ever
      made sense as a stopgap while ours was built, and ours went live three
      days later — a signup for a day of overlap.

      **Secrets are Eileen's and deliberately never passed through the
      agent.** `STATS_TOKEN` gates the dashboard and is safe to re-set at
      any time; she did once, on 2026-09-16, at no cost. `SALT_SECRET` is
      baked into the visitor hash — **changing it resets unique-visitor
      counts** while leaving views, paths, referrers and countries intact.
      Leave it alone.

      Open, and only interesting once traffic exists: the dashboard's
      unique-visitor tile does not dedupe across days, because the hash
      rotates at UTC midnight by design. A person who visits Monday and
      Friday counts twice in a 30-day total. That is the trade for storing no
      identifier, and the tile says so underneath.

      **Hardened and finished the same day, PRs #18 and #20-22.** Launch was
      not the end of it; Eileen asked what was left and the answer was three
      real things.

      *The origin gate (#18).* `/collect` enforced the allowlist only on the
      CORS response header -- the insert happened regardless of who asked. So
      anyone with the URL could post rows, and a local preview of the site
      wrote into the production database, which is not hypothetical: it
      happened repeatedly while building it. The allowed list is now derived
      from the Worker's own hostname, so localhost is honoured only under
      `wrangler dev`. `/stats` stays token-only: a bearer token is a stronger
      gate than a header the client picks, and curl-able is what makes it
      debuggable.

      *Outbound clicks (#18).* Detected rather than hand-tagged, because the
      case-study links are built at runtime from `data/projects.json` and
      tagging markup would have missed exactly the links worth measuring --
      whether anyone opens the repos and dashboards. Records host and path
      with the query dropped; `mailto:` records the scheme alone.

      *Tests (#19, #20).* 65 inside workerd against a real local D1, plus 9
      driving real Chromium via `analytics/smoke_test.py`. Two layers because
      one is not enough, and the unit suite found two bugs on its own: tied
      rows had no secondary sort so the dashboard's tables reshuffled between
      refreshes, and `?days=0` returned 30 days while `?days=-5` returned 1,
      because `parseInt(...) || 30` treats a parseable zero as missing.

      *Download alerts (#21, #22).* A Discord webhook fires when a resume
      download lands, carrying the role the visitor picked. Discord because
      Cloudflare's own email sending needs a custom domain and there isn't
      one. Runs in `ctx.waitUntil` so it cannot slow a visitor down, swallows
      every failure so it cannot break analytics, and dedupes on the visitor
      so a double-click pings once while both rows are still stored.

      **Two corrections, recorded because the wrong versions are in this
      repo's history.**

      (1) The beacon bug was described in #18, in its commit message and to
      Eileen as "no browser pageview ever reached the collector; the site was
      recording nothing". That was wrong, and the browser smoke test is what
      established it. `application/json` is not CORS-safelisted so it forced a
      preflight that `sendBeacon`'s credentials mode made unsatisfiable -- but
      the preflight *succeeded*, the POST was sent, the row was inserted, and
      only the *response* was rejected. The data landed while the browser
      logged `ERR_FAILED`. The cost was a console full of errors and a client
      that could not tell success from failure, not data loss. Beacons now
      send `text/plain`, which is safelisted.

      (2) The notifier originally swallowed failures behind a comment saying
      there was nobody to report them to. False -- there is `wrangler tail`.
      When the first real alert did not arrive there was no way to tell a bad
      webhook from a bug without adding logging and redeploying (#22).

      **The lesson worth more than any of the code:** the collector was
      verified with `curl` and declared working. curl does no CORS at all, so
      the server was fine while the browser never got a clean request through.
      A test suite that cannot fail the way production fails is not
      verification. That is why `smoke_test.py` exists, and why it was
      deliberately watched fail -- the bug was reintroduced on purpose, and
      seven of nine checks still passed, including "a pageview reaches the
      collector".

      **Windows, `wrangler secret put` and control characters -- this cost
      real time twice.** Pressing Ctrl+V at wrangler's secret prompt inserts
      the SYN character (0x16) instead of pasting, and the secret is stored as
      that one character. It happened to `STATS_TOKEN`, then to
      `DISCORD_WEBHOOK_URL`, where it surfaced only as
      `discord webhook threw: Invalid URL: \u0016`. **Set secrets from the
      Cloudflare dashboard on Windows**, or pipe them from a file with
      `(Get-Content file -Raw).Trim()`. Never paste into the prompt.

      Verified live end to end on 2026-09-16: a real browser on the deployed
      site produced a pageview, an outbound click and a download; the download
      reached Discord with no warning logged; every test row was deleted by id
      rather than with `DELETE FROM events`, which would have destroyed the
      one genuine visitor row in the table.

- [x] 2026-09-15 — **Roadmap project 3 — F2P vs Paid: Pricing & Engagement on
      Steam. Built, written up and shipped.** Repo:
      `github.com/EileenIp/steam-pricing-engagement` (public, 105 tests).
      **Finding:** free games are played a quarter as long as paid ones — 124
      median minutes against 530 — and the within-genre correction that was
      meant to explain the gap widened it instead (-0.457 to -0.482 across 58
      genres). Free wins only in Clicker, ties in Idler, loses everywhere else
      including MMORPG. Price beats pricing model as a predictor: 233 min in the
      0-10 AUD band rising to 2,484 in 60+. All three owner bounds agree to
      0.001, so the Checkpoint 0 interval decision does not drive the result.
      **What didn't work, written up rather than hidden:** the planned headline
      metric died — SteamSpy still serves the playtime fields but they are all
      zero — so playtime was rebuilt on Steam review payloads; genre
      stratification needed a circularity guard (Dota 2's top tag is "Free to
      Play" at 60,040 votes) and a specificity tier (a votes-only rule put 65%
      of the cohort in umbrella buckets). **Shipped:** case study live on the
      site (PR #6), 4-page report, 9-slide deck, self-contained dashboard,
      `NOTES.md` decision log, card image screenshotted from the real dashboard.
      **Still Eileen's:** Checkpoint 2 — the interpretation across all four
      deliverables is currently the agent's, and the two claims that need to be
      hers are named in `NOTES.md`.


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

      Resolved same day by Eileen: ADN is Australian Disability Network and the
      bare "GOVERNMENT" is Queensland Government, both now in the registry with
      logos; FMD, Farrer Capital Management and Openmesh were removed outright
      -- not companies she is applying to. The removal went into
      `job-applications.xlsx`, the source of truth, so regenerating the JSON
      won't resurrect them. 91 entries -> 88.

      Still open: five logos 404'd on fetch (ASIO, BMW, Fujitsu, McKinsey,
      Spotlight Retail Group) and show an initials tile. Google's favicon
      service simply has nothing for those domains; a different source, or a
      hand-saved file in `images/logos/`, is the fix if it ever matters.

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
