# GitHub link check — 2026-09-08

Scope: every `github.com` URL referenced anywhere in the site's HTML/JS/JSON
source (`index.html`, `data/projects.json` — the only two files that
reference `github.com`; `tools/` has none). Checked with `curl -sL` for the
resolved HTTP status code.

| Link | Where | Status |
|---|---|---|
| https://github.com/EileenIp | `index.html:302` (Contact section) | 200 OK |
| https://github.com/EileenIp/Ecommerce-Behaviour-Conversion-Analysis | `data/projects.json:218` — `ecommerce-behavior-conversion-2019` → `notebookRepo` | 200 OK |
| https://github.com/EileenIp/advertising-revenue-sales-efficiency/blob/main/power-bi/Advertising%20Revenue%20and%20Sales%20Efficiency.pbix | `data/projects.json:359` — `advertising-revenue-sales-efficiency-2026` → `dashboard` | 200 OK |
| https://github.com/EileenIp/advertising-revenue-sales-efficiency/blob/main/docs/Business_Case_Study.md | `data/projects.json:360` → `technicalFindings` | 200 OK |
| https://github.com/EileenIp/advertising-revenue-sales-efficiency | `data/projects.json:361` → `notebookRepo` | 200 OK |
| https://github.com/EileenIp/advertising-revenue-sales-efficiency#readme | `data/projects.json:362` → `caseStudyPage` | 200 OK |

**Result: all 6 links resolve. No 404s, no missing repos.**

## Out of scope, flagged for a separate pass

`TODO.md` already has two open "CV / content gaps" items that are related
but not part of this check (they're about the CV document, not the site):
`Dynamic AI Chatbot` and `Creator Content Decision Dashboard` have no
GitHub link on the CV at all. Not actioned here — leaving as-is in `TODO.md`.
