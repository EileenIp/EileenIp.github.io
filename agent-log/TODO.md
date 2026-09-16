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
- [x] Checkpoint 1 (Eileen, 2026-09-15): she read all 100, not the 40 asked for —
      67 bad, 15 not, 18 can't tell. Three findings, full evidence in
      `data/validation/checkpoint1-findings.md`:
      (a) all four of the spec's candidates are high-precision, low-recall — they
      agree when they fire and miss most of what she calls bad. The rule she was
      actually using was not among them, and is now implemented as
      **`left_unanswered`**: the thread ends on a customer message that doesn't
      say it got sorted. 91% precision against her reading, 13.4% of the subset.
      (b) all 18 of her can't-tells are the ghosting case, which is 83% of the
      corpus, 45% of it ending on a push to DM or a link — for most conversations
      the outcome happens where this data cannot see it. Her difficulty was the
      dataset answering, not indecision.
      (c) reweighting her sample to the population puts P(went badly) near 0.56,
      range 0.34–0.78. Bad outcomes are probably **not** the minority class the
      spec assumes; the label carried forward is a strict observable subset of a
      problem a human reads as much larger.
      Also decided: ghosted-after-handoff conversations (37.6%) are **censored**,
      excluded rather than counted as negatives, since calling them "not bad"
      asserts something nobody observed.
- [x] Phase 2 — modelling set 91,449 after censoring, 21% positive, split by time
      at 2017-11-16. Keyword baseline PR-AUC 0.251 against a 23% base rate;
      TF-IDF + logistic regression 0.368, catching 19% of bad outcomes in the
      worst 10% of the queue. Two defects the first run exposed and fixed: the
      model's strongest feature was a customer's account number (raw @mentions in
      TF-IDF — memorising individuals, worth only 0.011 PR-AUC), and calibration
      failed exactly where triage uses it (predicted 0.74, actual 0.40). Isotonic
      on a time-held-out slice now tracks, and compresses the range so nothing
      scores above 0.6 — the model admitting it cannot call anyone more than
      coin-flip risky. 108 tests green.
- [x] Checkpoint 2 (Eileen, 2026-09-15): fast-track the worst **10%** of the
      queue, score over 0.40. Her defence in staffing terms: one handler's shift
      is ~160 conversations and the lane is 159 a day, seeing 44% bad outcomes
      against 23% in the queue at large. Tightening to 5% barely moves precision
      and gives up half the bad outcomes; widening to 25% is close to not
      prioritising. It leaves 295 bad conversations a day unprioritised, and that
      number goes in the write-up next to the first.
- [x] Phase 3 — **the counterintuitive result, and it survives the controls.**
      Faster first replies go with *worse* outcomes: -5.9pp per tenfold increase
      in reply time, -4.8pp within brand, -3.2pp within predicted-difficulty
      band. Reversing the censoring decision halves it (-2.1pp) but does not
      change its sign, so the exclusion amplifies the finding rather than
      creating it. Stated as association throughout — nobody randomised who got
      a fast reply. Also threw out the first summary statistic, which was being
      set by buckets holding as few as 8 conversations.
- [x] Phase 4 — all four deliverables built from the pipeline's own artifacts:
      self-contained dashboard (hero is a real day's queue, ranked, with per-
      message drivers in plain words and a reveal-the-outcome toggle), 4-page
      report (.md + .docx), 9-slide deck (.pptx), and the website case study,
      which **replaced the `support-ticket-sentiment-tracker` placeholder in
      `data/projects.json`** and kept its id so the deep link still resolves.
      128 tests green, 9 commits, nothing pushed anywhere.
- [ ] **Eileen: rewrite the three reserved sections.** Limitations, "What didn't
      work" and the Recommendation are drafted in
      `deliverables/support-triage-report.md`, each marked
      `[DRAFT — EILEEN TO REPLACE]` (a test enforces the marker). They are the
      sections an interviewer probes hardest and they should be in her words.
- [ ] **Eileen: review the site diff before committing it.** `data/projects.json`
      and the card image are modified in the working tree, not committed —
      166 insertions confined to the one entry.
- [ ] Repo has no git remote, so the case study ships without links by design
      (dead links are worse than none). Create `EileenIp/support-triage`, push,
      then re-run `python -m src.case_study --write` and the dashboard/report
      links appear automatically.
- [ ] Transformer variant still encoding (16,000 of 91,449 when Phase 4 landed).
      Resumable, so it survives a kill. If it finishes it gets added to the model
      comparison; if it does not, cutting a model variant is the trim this
      project's spec nominates, and the reply-speed half it protects is done.
- [x] The 40-conversation audit — done 2026-09-15, all 100 read. Her own account of
      the judgement, which is the interview answer and is quoted in the findings
      file: customers usually ghost after receiving a reply; ghosting after asking
      for assistance reads as bad, ghosting after a plain question reads as
      undecidable; staff not replying is bad; staff asking for a response and
      getting none is bad; a customer coming back to say it's solved is fine.

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
- [x] Resume-download event — **wired 2026-09-15.** `resume.html` shipped and
      fires `download` with `{ role, roleLabel, industry, youtube }`, verified
      end to end against a stubbed endpoint. The roles query now prefers
      `$.roleLabel` and falls back to `$.role`, so the table reads "Data
      Analyst" rather than "data-analyst" while still grouping on a stable
      slug. The warning this line used to carry — don't track the placeholder
      Resume buttons because they do nothing — is retired: they link to
      `resume.html` now. Still reads zero until Checkpoint 0 puts the Worker
      online.
- [ ] Interim hosted counter — still open, still Eileen's call. Every day
      without one is traffic that cannot be recovered later, and the Worker
      cannot go live until Checkpoint 0.

### Site — recruiter-personalised resume builder
Started 2026-09-13 on Eileen's ask. **Built 2026-09-13** in this session, not
the parallel one that first claimed it — that session left no files, so this
one took it over on Eileen's ask. **Merged via PR #1 and live at
`https://eileenip.github.io/resume.html`** — verified in production
2026-09-15: all four roles build a one-page PDF in the browser.

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

**Branch collision, 2026-09-13 — worth knowing before merging.** Two sessions
were writing to the same checkout. The analytics session committed its work
(the polish pass, job tracker, project images and the analytics collector)
onto *this* branch, `agent/2026-09-13-resume-builder`, while this session was
mid-task — so the branch carries both sessions' work, not just the resume
builder, and none of it is on `main` yet. One casualty: the homepage's two
Resume buttons were rewired here, but that edit was swept into their commit
`403a95b site: social card, favicon, canonical, sitemap`, whose message says
nothing about it. Nothing was lost and nothing was rewritten to tidy it —
flagging it so the merge isn't read as one session's work.

Eileen's three answers on 2026-09-13 settled the design. **What varies:**
projects, the order of the skills line, and whether the YouTube channel
appears under Experience — not the summary. **Data Engineer:** offered, framed
honestly. **Tag review:** a browser tool, like `label.html`.

- [x] `data/resume.json` — the CV as structured data, generated by
      `scripts/build_resume_json.py` rather than hand-maintained, so a CV edit
      is a re-run. 29 projects, not the ~28 estimated.
- [x] Client-side PDF generation + the picker UI. `resume.html`, jsPDF 3.0.1
      vendored into `js/vendor/` (not a CDN — same reasoning as the cached
      logos). Layout matches `career/build_tailored_resumes.py` exactly: A4,
      37/29pt margins, Helvetica, one page. Verified across all 112
      role × industry × YouTube combinations — zero run to two pages.
- [x] Feeds the analytics: the collector already had the hook waiting
      (`data-track="download"` plus `data-track-meta`, with a comment naming
      the resume builder). Verified end-to-end against a stubbed endpoint —
      the event carries role, industry and the YouTube flag. It records
      nothing until the Worker endpoint is set in `js/analytics-config.js`.
- [x] The two "Resume" buttons on the homepage were `<button>` elements with
      no handler and had never done anything. They now go to `resume.html`,
      which also joins the nav on every page.
- [x] Role labels in the analytics meta (2026-09-15). The builder was emitting
      the slug where `analytics/README.md` documented a human-readable label,
      which would have made the dashboard's roles table read "data-analyst".
      It now sends both.
- [x] **Five built projects added to the CV (2026-09-16), on Eileen's explicit
      ask.** `scripts/add_cv_projects.py` writes
      `career/cv/CV 2026 working (5 projects added).docx` — a NEW file; the
      master is untouched until Eileen swaps it in. Launch Sentiment, Steam
      F2P, Support Triage, Subscriber Churn and Ad Creative Pipeline, each
      with a real GitHub link and bullets whose every number comes from
      `data/projects.json`. Formatting is cloned from the Vendor Performance
      entry rather than rebuilt, so tab stops, numbering and fonts are the
      CV's own. Verified: zip intact, all XML well-formed, 34/34 hyperlinks
      resolve, and the CV parser reads 29 -> 34 projects. NOT verified: how
      Word renders it — no LibreOffice on this machine, so Eileen should open
      it before trusting the layout.
      — *Streaming Engagement was deliberately left out. Its repo is empty and
      its own impact stat reads "Placeholder — project not yet built". This
      corrects my earlier claim that six built projects were missing; it was
      five.*
- [x] **CV swapped in and `resume.json` regenerated (2026-09-16).** Eileen
      asked this session to do the swap; the previous master is kept as
      `career/cv/CV 2026 working (pre-5-projects backup).docx` and both files
      were checksum-verified before and after. 29 -> 34 projects.
      **Gaming is now in the picker for the first time**, carried by Launch
      Sentiment and Steam F2P. Data Engineer went from 3 projects to 6, led by
      Ad Creative Pipeline — the only project in the portfolio on a real data
      engineering stack (dbt, warehouse, dimensional models, tests, CI), which
      is a better answer to the thin-DE-evidence problem than reordering the
      old three was. Re-verified across all 128 role x industry x YouTube
      combinations: none runs to two pages; 75 carry three projects and 53
      carry two, up from 30 — the new bullets are longer, and the page says so.
      The five carry drafted tags and a drafted featured order like the rest.
- [x] **Tags reviewed and accepted by Eileen, 2026-09-16.** She was shown what
      the tags are, what they control, and the four I rated shakiest — Bitcoin
      tagged Data Analyst, Artist Selection missing BI, the chatbot tagged Data
      Scientist, and sixteen Jan-2026 dashboards tagged identically — and
      accepted the draft as it stood. Recorded as accepted rather than
      corrected, because those are different things and the file should say
      which: `TAGS_ACCEPTED` in `scripts/build_resume_json.py`, surfaced as
      `tagsAcceptedOn` / `tagsAcceptedNote` in `data/resume.json`. A re-run
      preserves it. `tools/resume-tagger.html` still works if she wants to
      change any of it later.
      — *superseded, kept for the trail:* correct the drafted tags in
      `tools/resume-tagger.html`
      (~20 minutes). Serve the site locally, open it, fix any project tagged
      for a role it doesn't really support, then Export and replace
      `data/resume.json`. Edits autosave. It also sets what each role leads
      with, which is what actually decides the three projects a recruiter
      sees. Nothing is blocked on this — the drafted tags work — but they are
      drafted, and a wrong one puts the wrong project in front of someone.

Three things found on the way that are Eileen's calls, not blockers:

- **The CV docx has three defects.** The E-commerce Purchase-Prediction entry
  appears twice verbatim; the Advertising Revenue project's three bullets have
  no title line at all and sit stranded under that duplicate; the Creator
  dashboard carries five bullets where the last two restate the first three
  (already logged under CV / content gaps below). `build_resume_json.py` works
  around all three and prints them on every run, but they want fixing at
  source. The Advertising Revenue title, tools and repo URL were recovered
  from `data/projects.json`, not invented.
- **One page does not hold the full CV.** The fixed sections — education, five
  NDIS bullets, three YouTube bullets, skills, five certification lines —
  measure 652pt of the 784pt an A4 page has, which leaves room for exactly one
  project. `build_tailored_resumes.py` had already solved this and the fix is
  reused: `resume.json` carries a `length` setting, defaulting to
  `"condensed"`, which uses the shorter NDIS and YouTube bullets from the nine
  resumes Eileen actually sent out in September, and runs the certifications
  into one paragraph rather than dropping any. That gets 82 of 112
  combinations to three projects; the other 30 show two and say so on the
  page. Setting `length` to `"full"` uses the docx's own wording and drops
  every variant to one project. It is one setting for every variant — never
  per role or per visitor, which would be varying claims by audience.
- **The docx misspells two tool names** — `Power Bi` and `Qilk`. Normalised to
  `Power BI` (matching the tailored-resume script) and `Qlik` on the generated
  PDFs; still wrong in the docx.

`resume.json` has a `summary` field sitting at `null`. The docx has no summary
section, so nothing was invented for it. If Eileen wants one it is a single
fixed line shared by every variant — per her own call, the summary does not
vary by role.

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
