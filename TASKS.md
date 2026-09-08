# Shared task workflow

The shared source of truth is data/tasks.json. The to-do page is todo.html.

For Eileen, Codex, and Claude:
1. Read the latest task file before starting. Work only on tasks the user has authorized. Assignment alone does not invoke an assistant.
2. Claim a task by setting owner and status to In progress. Avoid taking work already claimed by another assistant unless the user requests it.
3. Keep the task ID stable. Update updatedAt with an ISO timestamp. Preserve other tasks and unrelated changes. Re-read the file before writing to reduce concurrent edit conflicts; do not edit it simultaneously.
4. Record affected files, validation, blockers, and next steps in handoff. Use Review when user review is needed and Done when the authorized work is complete.
5. Browser edits are local drafts. Connect data/tasks.json and save, or download and replace the file manually. Reload before editing to see updates from others. File saving checks whether the file changed since it was loaded, but is not a transactional multi-user lock.

Schema: version 1, tasks array. Each task has string fields id, title, owner (Unassigned/Eileen/Codex/Claude), status (To do/In progress/Blocked/Review/Done), priority (Normal/High/Low), due (YYYY-MM-DD or empty), details, handoff, updatedAt (ISO timestamp).

No backend, accounts, automatic assistant execution, or GitHub write credentials are required. A published copy of the page reads the published JSON; updating the local file still requires the usual commit/deploy process to update the live site. Tasks published on GitHub Pages are public.

Tasks may include an optional goal field: internship, bsan, website, projects, course, or other. The page groups tasks under expandable goals and shows completion counts. Existing September 8 task IDs map to their goals automatically when the field is absent. Preserve goal when updating a task. New tasks can choose a goal in the editor.

## Activity history
Before choosing work, read the tasks and top-level activity array in data/tasks.json. Browser saves automatically append history entries; direct file edits do not. For EVERY assistant task mutation, append an activity entry and preserve all previous entries. Do not infer actor from owner.

Entry fields: id (unique UUID), taskId, title, actor (Eileen/Codex/Claude), at (ISO timestamp), action (Created/Updated/Deleted), notes (work completed, files changed, checks performed, blockers and next step), before (full previous task or null), after (full resulting task or null). Update the task and append its history in the same file write after rereading for concurrent edits. Do not rewrite history or invent past events. Older files without activity remain supported.

Keep completed tasks with status Done. If a task is removed, record Deleted with the full before snapshot. History records declared names, not verified identity; this is a shared editable JSON log, not an immutable audit system.
