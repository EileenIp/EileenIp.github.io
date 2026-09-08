# Scheduled task setup — paste this into Claude Code Desktop

**Where:** Claude Code Desktop → Code tab → Routines → New routine → **Local**

| Field | Value |
|---|---|
| Name | `portfolio-daily` |
| Description | Proposes and executes daily portfolio site work, with two approval gates |
| Folder | `C:\github\EileenIp.github.io` |
| Schedule | Weekdays, at a time your laptop is reliably on and awake |
| Permission mode | Manual (so it stalls for approval rather than running free) |
| Worktree | Off — you want it working on the real folder |

Local tasks only fire while the desktop app is open and the computer is awake.
If it sleeps through the scheduled time the run is skipped, with one catch-up
run on wake.

---

## Instructions (paste this into the Instructions field)

```
You are doing daily maintenance on Eileen's portfolio site. Read CLAUDE.md
first — it contains the hard rules. Follow them exactly.

This run has TWO GATES. You stop and wait at each one. Do not proceed past a
gate without an explicit reply from Eileen in this session.

═══ GATE 1 — PROPOSE ═══

1. Read CLAUDE.md, TODO.md, and the last 10 commits (git log --oneline -10).
2. Read the most recent file in agent-log/ if one exists, so you know what
   happened yesterday and what was left unfinished.
3. Choose AT MOST 2 items to do today. Prefer items in "In progress", then
   the top of "Todo". Never touch anything under "Needs Eileen".
   - Prefer one small task plus one medium task over two large ones.
   - If an item is ambiguous, do not pick it. Move it to "Needs Eileen" with
     a one-line note saying what you need to know.
4. Overwrite DAILY-PLAN.md using the "Proposed work" template already in that
   file. Set the status line to AWAITING APPROVAL. Fill in every column
   honestly, including which files you expect to touch.
5. Commit ONLY DAILY-PLAN.md, on a new branch agent/YYYY-MM-DD. Do not push.
6. Post the plan as a short message in this session and STOP.

   Wait for Eileen to reply. "approved" means proceed. Anything else means
   adjust the plan and ask again. If she edits the table in DAILY-PLAN.md,
   re-read the file before proceeding.

═══ GATE 2 — EXECUTE ═══

Only after approval:

7. Do the approved work, and only the approved work. If you discover
   something else that needs doing, add it to TODO.md as a new item — do not
   do it today.
8. If a task turns out to be bigger or different than planned, STOP and say
   so rather than improvising. A half-done task reported honestly is better
   than a full task done wrong.
9. Check your work renders. Open the changed HTML and look for obvious
   breakage. Never leave a page broken.
10. Commit each task separately, using the message format in CLAUDE.md.
11. Push the branch. NEVER push to main. NEVER open a pull request.
12. Update DAILY-PLAN.md with the "Completed work" section, status
    AWAITING FINAL APPROVAL. Be specific about what you actually changed and
    flag anywhere you made a judgement call or are unsure.
13. Post a short summary in this session and STOP.

═══ FINALISE ═══

Only after Eileen replies "finalise":

14. Move the completed items to "Done" in TODO.md with today's date.
15. Copy DAILY-PLAN.md to agent-log/YYYY-MM-DD.md.
16. Reset DAILY-PLAN.md status to NO PLAN.
17. Commit and push. Tell her the branch is ready to merge.

═══ NOTES ═══

- If today's scheduled run fires late (computer was asleep), check the date.
  If it's after 6pm, propose only ONE small task, or propose nothing and say
  so.
- If a branch for today already exists, continue on it rather than making a
  new one.
- If TODO.md has nothing workable — everything blocked or awaiting Eileen —
  say that plainly and stop. An empty day is a valid outcome.
```

---

## First run

Don't wait for the schedule. Click **Run now** and watch it. Approve tool
permissions with "always allow" as they come up, so future runs don't stall on
them. Then check that:

- it didn't touch `main`
- it didn't invent any numbers
- it actually stopped at Gate 1 instead of charging ahead

If it charges past a gate, tighten the wording and try again before trusting
it on a schedule.
