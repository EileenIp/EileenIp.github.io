# Contributing — EileenIp.github.io

Standing context for any work in this repo. Read this first.

---

## What this repo is

Eileen Ip's personal portfolio site, served by GitHub Pages at
`https://eileenip.github.io`. It is the primary artifact she sends to recruiters
and hiring managers. Treat it as production.

**Owner:** Eileen Ip — BCompSci/BCom (Data Science + Business Analytics),
University of Queensland, graduating Dec 2026. Based in Brisbane, AU.

**Target roles:** Data Analyst, Data Scientist, Data Engineer, BI Developer.
Technical, heads-down, written/async communication. Not client-facing.

**Target domains (projects should come from these):** gaming, media &
entertainment, social media, marketing, customer experience.

---

## The site's job

> The portfolio's job isn't to look impressive — it's to reduce a hiring
> manager's risk in taking a chance on Eileen.

A hiring manager spends 30–90 seconds on a project before deciding. Every page
should give them evidence that Eileen can think clearly, work independently,
and communicate findings in writing.

When writing or editing any project page, it should be able to answer:

1. **Industry relevance** — would someone in the target industry recognise
   their own problems here?
2. **Depth** — does it explain *why* a pattern exists, not just *what* the
   chart shows?
3. **Thought process** — are the methodology decisions and their reasons
   visible?
4. **Defendability** — could Eileen justify every choice in an interview?
5. **Trade-offs** — are speed/accuracy, simple/complex decisions acknowledged?
6. **Independence** — is the scope self-defined, not tutorial-shaped?
7. **Ambiguity** — are assumptions, data-quality issues and limitations stated?
8. **Implementation** — is there any thought about production, reuse, upkeep?

A page missing 3–4 of these is a page worth flagging in `TODO.md`.

---

## Hard rules — never break these

- **Never invent a number.** No metrics, dataset sizes, accuracy figures, row
  counts or dates unless they appear in an existing file, a repo, or Eileen's
  own words. If a number is needed and unavailable, write `[NUMBER NEEDED]`
  and raise it under "Needs Eileen" in `TODO.md`.
- **Never push to `main`.** All work goes on a branch named
  `agent/YYYY-MM-DD`, and reaches `main` through a pull request that Eileen
  merges. Push the branch, open the PR, hand her the link — do not merge it
  yourself, and do not merge locally and push the result. "Merge it into
  main" means get it merged, not skip the PR. See Commits below.
- **Never delete a project page or a project's assets.** Archiving or
  de-listing is Eileen's decision, not something to action unasked.
- **Never overstate.** If something was small-scale, exploratory, or built on
  synthetic/sample data, say so plainly on the page. Honest framing beats
  inflated framing — it survives an interview, inflation doesn't.
- **Never rewrite the CV content or contact details** without an explicit
  instruction in that day's approved plan.
- **When a task is ambiguous, stop and ask.** Do not guess and proceed.
  Move it to "Needs Eileen" with a one-line note on what's blocking.

---

## Writing voice

- Plain, direct, first person. Short sentences.
- No hype words: "leveraged", "cutting-edge", "revolutionised", "seamless",
  "passionate about data".
- Lead with the business question, not the tool. "Which pricing model keeps
  players engaged longer?" beats "A Power BI dashboard using DAX measures".
- Australian/British spelling (visualisation, optimise, analyse) — matches the
  CV and the target market.
- Every project page should include a "What didn't work" or "Limitations"
  section. This is a feature, not an admission.

---

## Project page structure (SPIDER)

New or rewritten project pages should follow this shape:

1. **Summary impact** — 3–5 sentences: problem context, what was built, data
   source, method, key finding.
2. **Problem space** — why this matters and who would care.
3. **Inputs** — data source, size, format, how it was collected.
4. **Discovery** — data quality issues, surprises, hypotheses vs. reality,
   dead ends.
5. **Execution** — method chosen, alternatives considered, why.
6. **Results & recommendations** — findings, what a stakeholder should do,
   limitations and assumptions, next steps.

Not every section needs a heading on the page — but the information should be
there and findable in under 90 seconds.

---

## Repo conventions

- **Stack:** Plain static HTML/CSS/JS. There's a Jekyll `_config.yml`
  (`theme: jekyll-theme-minimal`) but no front matter and no Liquid tags
  (`{{ }}` / `{% %}`) in any `.html` file, and no Gemfile — the theme isn't
  actually applied to these hand-built pages.
- **Deploy:** GitHub Pages, built from `main`. No `.github/workflows` folder,
  so this is GitHub's default Pages build rather than a custom Actions
  pipeline. Confirmed live 2026-09-15: a merge to `main` was serving at
  `https://eileenip.github.io` within a minute. Assets come back with
  `Cache-Control: max-age=600`, so a returning visitor can run the previous
  version of a JS or CSS file for up to ten minutes after a deploy — worth
  remembering before concluding a change did not ship.
- **Project pages:** `projects.html` fetches `data/projects.json`
  (`js/projects.js:914`, `fetch('data/projects.json')`) and renders cards +
  a modal client-side, filterable by `industry` / `projectType` /
  `serviceType` / `tools`. Deep-linking via `?project=<slug>` opens a
  project's modal directly.
- **Adding a project:** add/edit an entry in `data/projects.json` by hand.
  This used to point at `tools/project-entry-form.html` and
  `tools/add-entry.html`; both were deleted in `03e9ad3` ("remove entry
  forms") and the pointer outlived them.
- **`tools/`** holds standalone pages Eileen uses, not pages the site links
  to. Currently one: `resume-tagger.html`, where she corrects the drafted
  role and industry tags behind the resume builder. They need the site served
  locally, since they fetch from `data/`.
- **Local preview:** `.claude/launch.json` defines a `static-site` config —
  `python -m http.server 5500` — i.e. serve the repo root and open
  `http://localhost:5500`.
- **Assets:** project images go in `images/projects/` (e.g.
  `images/projects/advertising-revenue-sales-efficiency-card.png`).
  Compression before committing wasn't verifiable from the repo — no
  observed convention either way.

---

## Commits and pull requests

- One commit per task, not one commit per file.
- Message format: `<area>: <what changed>` — e.g.
  `projects: add limitations section to ecommerce funnel writeup`
- Never force-push. Never rewrite history on a pushed branch.

Landing work:

```bash
git checkout -b agent/YYYY-MM-DD-short-topic
# ... commit ...
git push -u origin agent/YYYY-MM-DD-short-topic
gh pr create --fill          # then give Eileen the link
```

Eileen merges. `main` deploys straight to the live site on merge, so the PR
is the only place a change can be looked at before recruiters see it — that
is the whole reason this step exists, not ceremony.

Two sessions have shared this checkout before and both committed onto one
branch (2026-09-13, recorded in `TODO.md`). If `git log` shows commits you
did not write, say so rather than quietly folding them into your own PR.

---

## Where things live

- `TODO.md` — the backlog. Work is taken from here, and it gets updated as
  it goes.
- `DAILY-PLAN.md` — today's proposed work, awaiting Eileen's approval.
- `agent-log/` — archived daily plans, one per run date.
