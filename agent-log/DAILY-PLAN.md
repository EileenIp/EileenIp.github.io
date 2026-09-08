# Daily plan

Status: `NO PLAN` <!-- NO PLAN | AWAITING APPROVAL | APPROVED | AWAITING FINAL APPROVAL | FINALISED -->
Date: —
Branch: —

---

The agent overwrites this file at the start of each run and updates the status
line as it moves through the two gates. The finished version is copied to
`agent-log/YYYY-MM-DD.md` on final approval.

**Gate 1** — agent proposes, Eileen approves before any site files are touched.
**Gate 2** — agent completes and pushes a branch, Eileen approves before it
counts as done and moves to `Done` in `TODO.md`.

---

## Template the agent fills in

### Proposed work — YYYY-MM-DD

**Gate 1 · awaiting your approval**

| # | Task (from TODO.md) | Files I expect to touch | Est. size | Risk |
|---|---------------------|-------------------------|-----------|------|
| 1 |                     |                         | S / M / L | low / med |
| 2 |                     |                         |           |          |

**Why these:**
_One or two sentences. Why these items, why now, why in this order._

**What I'm deliberately NOT doing today:**
_Anything skipped and the reason — blocked, too ambiguous, too large for one run._

**Questions before I start:**
_Anything that would change the approach. If there are none, say "none"._

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
