# Daily plan

Status: `AWAITING APPROVAL` <!-- NO PLAN | AWAITING APPROVAL | APPROVED | AWAITING FINAL APPROVAL | FINALISED -->
Date: 2026-09-08
Branch: agent/2026-09-08

---

**Gate 1** — agent proposes, Eileen approves before any site files are touched.
**Gate 2** — agent completes and pushes a branch, Eileen approves before it
counts as done and moves to `Done` in `TODO.md`.

---

## Before the table: a conflict I found and did not resolve myself

Two separate task-tracking systems currently exist in this repo, and they
disagree about what "today's backlog" is:

1. **This gated workflow** — `CLAUDE.md` / `TODO.md` / `DAILY-PLAN.md`, all
   currently sitting in `agent-log/` rather than at the repo root (which is
   where `CLAUDE.md`'s own "Where things live" section says they belong).
   `TODO.md` here lists portfolio-content backlog items (project audits,
   roadmap projects, CV gaps).
2. **A newer shared system described in root `TASKS.md`** — `data/tasks.json`
   plus `todo.html`, explicitly built for Eileen, Codex, and Claude to share.
   It holds 33 active tasks dated 2026-09-07/08 (TikTok/ADN applications,
   BSAN4201 coursework, and several website tasks — e.g.
   `plan-20260908-website-location` and `plan-20260908-website-polish`,
   both currently `Unassigned`).

Both look freshly set up within a day of each other, neither references the
other, and no activity has been recorded against `data/tasks.json` yet (its
`activity` array is empty) — so I can't tell from repo evidence alone
whether the `tasks.json` system was meant to **replace** this gated
CLAUDE.md workflow, or the two are meant to run side by side for different
kinds of work (this one for portfolio-content maintenance, that one for
Eileen's broader life/application tracking).

Per the hard rule in `CLAUDE.md` ("when a task is ambiguous, stop and ask"),
I'm not guessing at this. I picked today's two tasks from **this** system's
`TODO.md` specifically because they're read-only audits that don't exist in
`tasks.json` and don't touch any live page — so they're safe under either
interpretation. I have **not** touched anything from the `tasks.json`
backlog (including the two well-specified website tasks) because doing so
would mean picking a commit/branch/review process for it without knowing
which one applies.

**I'd like your answer on this before tomorrow's run:** does `data/tasks.json`
now govern portfolio-site work too, and should `CLAUDE.md`/`TODO.md`/
`DAILY-PLAN.md` move from `agent-log/` to the repo root as originally
specified (or be retired in favour of the `tasks.json` system)?

Separately, small piece of bookkeeping: `TODO.md`'s "Needs Eileen" item
*"Confirm the repo conventions marked `[CONFIRM]` in `CLAUDE.md`"* was
resolved earlier today — the stack, deploy, data source, and asset-path
questions are now answered in `CLAUDE.md`. I haven't edited `TODO.md` yet
(Gate 1 only commits `DAILY-PLAN.md`); I'll clear that line during Finalise
unless you say otherwise.

---

### Proposed work — 2026-09-08

**Gate 1 · awaiting your approval**

| # | Task (from TODO.md) | Files I expect to touch | Est. size | Risk |
|---|---------------------|-------------------------|-----------|------|
| 1 | Check every GitHub link on the site resolves (no 404s, no missing repos) | New file: `agent-log/link-check-2026-09-08.md` (report only — no site files edited) | S | low |
| 2 | Audit both existing project pages against the 8 hiring-manager criteria in `CLAUDE.md`, and confirm each states its data source and real/sample/synthetic status | New file: `agent-log/audit-2026-09-08.md` (report only — no site files edited) | S | low |

**Why these:**
Only 2 projects currently exist in `data/projects.json`
(`ecommerce-behavior-conversion-2019`,
`advertising-revenue-sales-efficiency-2026`), so both audits are smaller
than `TODO.md` implies and pair well as two small, low-risk, report-only
tasks — nothing here edits a live page, so they're safe to do regardless of
how the two-system question above gets answered.

**What I'm deliberately NOT doing today:**
- Everything under `Needs Eileen` in `TODO.md` (untouched, per the rule).
- The two `tasks.json` website tasks (`website-location`,
  `website-polish`) — well-specified, but I don't yet know which
  commit/branch/approval process governs `tasks.json`-sourced work. Flagged
  above instead of guessed at.
- The mobile-viewport check and the CV-gap items from `TODO.md` — holding
  those for a future run so today stays to two small items per the
  "prefer small work" guidance, and so this run's main deliverable is
  getting a clear answer on the system question above.

**Questions before I start:**
1. The two-system question above — which backlog governs portfolio-site
   work, and should the gated-workflow files move to repo root?
2. OK to clear the now-resolved `[CONFIRM]` item from `TODO.md`'s
   "Needs Eileen" section at Finalise, or would you rather review the
   `CLAUDE.md` changes first?

If there are none, treat only question 2 as optional — question 1 is the
one I actually need an answer to before this becomes a recurring pattern.

**Reply `approved` to proceed, or edit the table and reply `approved` to run
the edited version.**

---

### Completed work — YYYY-MM-DD

**Gate 2 · awaiting your final approval**

Branch: `agent/YYYY-MM-DD`

| # | Task | What I actually changed | Deviated from plan? |
|---|------|-------------------------|---------------------|
| 1 |      |                         | no / yes — because… |

**Things to look at closely:**
_Where the agent made a judgement call, or is least confident._

**New items added to TODO.md:**
_Anything discovered mid-task that became a new backlog entry._

**Nothing has been merged to `main`.**

**Reply `finalise` and I'll move these to Done in TODO.md and archive this
plan. Merge the branch yourself when you're happy with it.**
