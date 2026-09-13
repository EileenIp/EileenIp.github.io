// Status colors are deliberate one-offs lifted from the reference design's
// own status palette (some as OKLCH literals via CSS classes below), not
// generic ramp steps — see the "status tag colors" comment in style.css.
const STATUS_STYLE = {
  'To Apply': 'tag-to-apply',
  Applied: 'tag-outline',
  Interview: 'tag-accent',
  'Finished Assessment': 'tag-finished-assessment',
  Rejected: 'tag-rejected',
  Withdrawn: 'tag-withdrawn',
};
const DEFAULT_STATUS_TAG_CLASS = 'tag-neutral';

// Pipeline-ish order for the Status filter pill row. Any status value found
// in the data that isn't listed here gets appended automatically (sorted)
// so nothing is ever silently unselectable.
const STATUS_FILTER_CANONICAL = ['To Apply', 'Applied', 'Interview', 'Finished Assessment', 'Rejected', 'Withdrawn'];

// — Companies —

// data/companies.json maps the raw spreadsheet spelling ('nab', 'Nab',
// 'commbank') onto one canonical display name and a domain whose logo has
// been cached into images/logos/. Missing or unresolved companies fall back
// to an initials tile, so a gap in the registry costs a logo, not a row.
let companyRegistry = {};

function companyKey(raw) {
  return (raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function companyInfo(entry) {
  const key = companyKey(entry.company);
  const hit = companyRegistry[key];
  const name = (hit && hit.name) || entry.company || 'Unknown company';
  return { name, logo: (hit && hit.logo) || null, initials: initialsFor(name) };
}

function initialsFor(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function renderLogo(info) {
  const wrap = document.createElement('div');
  wrap.className = 'jt-logo';

  const fallback = document.createElement('span');
  fallback.className = 'jt-logo-initials';
  fallback.textContent = info.initials;
  wrap.append(fallback);

  if (info.logo) {
    const img = document.createElement('img');
    img.src = info.logo;
    img.alt = '';
    img.loading = 'lazy';
    // A cached logo that 404s (or a company added to the data before its
    // logo was fetched) leaves the initials tile showing underneath.
    img.addEventListener('error', () => img.remove());
    wrap.append(img);
  }
  return wrap;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A blank Status cell means the role hasn't been applied to yet ("To Apply")
// — unless there's an Applied Date on the row, in which case blank Status
// just means the field wasn't updated after applying.
function effectiveStatus(entry) {
  if (entry.status) return entry.status;
  return entry.date_applied ? 'Applied' : 'To Apply';
}

function formatDate(isoDate) {
  if (!isoDate) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Deadline cells are mostly clean dates but a handful are bare month names
// ("sep", "jun") — show real dates formatted, show text values as-is rather
// than fabricating a fake day.
function formatFlexibleDate(raw) {
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatDate(raw);
  return raw;
}

// — Filtering —

let allEntries = [];
const activeFilters = { status: new Set(), type: new Set(), location: new Set() };
const excludedFilters = { status: new Set(), type: new Set(), location: new Set() };
let companyQuery = '';
let roleQuery = '';
let dateFrom = '';
let dateTo = '';

function getEntryLocations(entry) {
  if (!entry.location) return [];
  return entry.location.split(',').map((s) => s.trim()).filter(Boolean);
}

function buildFilterOptions(entries) {
  const extraStatus = new Set();
  for (const entry of entries) {
    const s = effectiveStatus(entry);
    if (s && !STATUS_FILTER_CANONICAL.includes(s)) extraStatus.add(s);
  }
  const statusOptions = [...STATUS_FILTER_CANONICAL, ...[...extraStatus].sort()];

  const typeOptions = [...new Set(entries.map((e) => e.type).filter(Boolean))].sort();

  const locationOptions = [...new Set(entries.flatMap(getEntryLocations))].sort();

  return { status: statusOptions, type: typeOptions, location: locationOptions };
}

function entryMatchesFilters(entry) {
  if (companyQuery) {
    const haystack = `${entry.company || ''} ${companyInfo(entry).name}`.toLowerCase();
    if (!haystack.includes(companyQuery)) return false;
  }
  if (roleQuery && !(entry.role || '').toLowerCase().includes(roleQuery)) return false;

  if (dateFrom || dateTo) {
    if (!entry.date_applied) return false;
    if (dateFrom && entry.date_applied < dateFrom) return false;
    if (dateTo && entry.date_applied > dateTo) return false;
  }

  const status = effectiveStatus(entry);
  if (excludedFilters.status.has(status)) return false;
  if (activeFilters.status.size && !activeFilters.status.has(status)) return false;

  if (excludedFilters.type.has(entry.type)) return false;
  if (activeFilters.type.size && !activeFilters.type.has(entry.type)) return false;

  const locs = getEntryLocations(entry);
  if (locs.some((l) => excludedFilters.location.has(l))) return false;
  if (activeFilters.location.size && !locs.some((l) => activeFilters.location.has(l))) return false;

  return true;
}

// Most-recently-updated first: Outcome Date > Interview Date > Applied Date > Open Date.
// Entries with none of those sink to the end.
function mostRecentDate(entry) {
  return entry.outcome_date || entry.interview_date || entry.date_applied || entry.open_date || null;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => (mostRecentDate(b) || '').localeCompare(mostRecentDate(a) || ''));
}

function syncFilterPillStates() {
  document.querySelectorAll('.filter-pill').forEach((pill) => {
    const key = pill.dataset.filterKey;
    const value = pill.dataset.filterValue;
    pill.classList.toggle('selected', activeFilters[key].has(value));
    pill.classList.toggle('excluded', excludedFilters[key].has(value));
  });
}

// Three-state cycle per pill: neutral -> include -> exclude -> neutral.
function cycleFilter(key, value) {
  const included = activeFilters[key];
  const excluded = excludedFilters[key];
  if (included.has(value)) {
    included.delete(value);
    excluded.add(value);
  } else if (excluded.has(value)) {
    excluded.delete(value);
  } else {
    included.add(value);
  }
  syncFilterPillStates();
  renderGridView();
}

function removeFilter(key, value) {
  if (key === 'company') { companyQuery = ''; document.getElementById('f-company').value = ''; }
  else if (key === 'role') { roleQuery = ''; document.getElementById('f-role').value = ''; }
  else if (key === 'from') { dateFrom = ''; document.getElementById('f-from').value = ''; }
  else if (key === 'to') { dateTo = ''; document.getElementById('f-to').value = ''; }
  else if (key.endsWith('-exclude')) { excludedFilters[key.slice(0, -'-exclude'.length)].delete(value); }
  else { activeFilters[key].delete(value); }
  syncFilterPillStates();
  renderGridView();
}

function clearAllFilters() {
  for (const key of ['status', 'type', 'location']) {
    activeFilters[key].clear();
    excludedFilters[key].clear();
  }
  companyQuery = '';
  roleQuery = '';
  dateFrom = '';
  dateTo = '';
  document.getElementById('f-company').value = '';
  document.getElementById('f-role').value = '';
  document.getElementById('f-from').value = '';
  document.getElementById('f-to').value = '';
  syncFilterPillStates();
  renderGridView();
}

function renderFilterGroups(options) {
  const container = document.getElementById('filter-groups');
  container.replaceChildren();
  const groups = [
    ['Status', 'status', options.status],
    ['Type', 'type', options.type],
    ['Location', 'location', options.location],
  ];
  for (const [label, key, values] of groups) {
    if (values.length === 0) continue;
    const group = document.createElement('div');
    group.className = 'filter-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'filter-group-label';
    labelEl.textContent = label;
    group.append(labelEl);

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'filter-pills';
    for (const value of values) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'tag filter-pill';
      pill.textContent = value;
      pill.dataset.filterKey = key;
      pill.dataset.filterValue = value;
      pill.title = 'Click to show only this. Click again to hide it. Click again to clear.';
      pill.addEventListener('click', () => cycleFilter(key, value));
      pillsWrap.append(pill);
    }
    group.append(pillsWrap);
    container.append(group);
  }
}

function renderActiveFilters() {
  const wrap = document.getElementById('active-filters');
  wrap.replaceChildren();

  const chips = [];
  if (companyQuery) chips.push({ key: 'company', label: `Company: ${companyQuery}` });
  if (roleQuery) chips.push({ key: 'role', label: `Role: ${roleQuery}` });
  if (dateFrom) chips.push({ key: 'from', label: `From ${formatDate(dateFrom)}` });
  if (dateTo) chips.push({ key: 'to', label: `To ${formatDate(dateTo)}` });
  for (const key of ['status', 'type', 'location']) {
    for (const value of activeFilters[key]) chips.push({ key, value, label: value });
    for (const value of excludedFilters[key]) chips.push({ key: `${key}-exclude`, value, label: `Not ${value}` });
  }

  if (chips.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  for (const chip of chips) {
    const chipEl = document.createElement('button');
    chipEl.type = 'button';
    chipEl.className = 'tag tag-outline active-filter-chip';
    chipEl.textContent = chip.label;
    chipEl.setAttribute('aria-label', `Remove filter ${chip.label}`);
    chipEl.addEventListener('click', () => removeFilter(chip.key, chip.value));
    wrap.append(chipEl);
  }

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-ghost';
  clearBtn.style.fontSize = '12px';
  clearBtn.textContent = 'Clear all';
  clearBtn.addEventListener('click', clearAllFilters);
  wrap.append(clearBtn);
}

// — Cards —

function entryDateLines(entry) {
  const status = effectiveStatus(entry);
  const lines = [];

  if (status === 'To Apply') {
    if (entry.deadline) lines.push({ text: `Deadline: ${formatFlexibleDate(entry.deadline)}` });
  } else if (entry.date_applied) {
    lines.push({ text: `Applied: ${formatDate(entry.date_applied)}` });
  }

  if (entry.interview_date) {
    lines.push({ text: `Interview: ${formatDate(entry.interview_date)}`, accent: true });
  }

  if (status !== 'To Apply' && entry.start_date) {
    lines.push({ text: `Start: ${formatFlexibleDate(entry.start_date)}` });
  }

  return lines;
}

function renderRow(entry) {
  const info = companyInfo(entry);
  const status = effectiveStatus(entry);
  const answers = entry.answers || [];

  const row = document.createElement(answers.length > 0 ? 'button' : 'div');
  row.className = 'jt-row';
  if (answers.length > 0) {
    row.type = 'button';
    row.classList.add('jt-row-interactive');
    row.setAttribute('aria-label',
      `View ${answers.length} saved answer${answers.length === 1 ? '' : 's'} for ${entry.role || 'this role'} at ${info.name}`);
    row.addEventListener('click', () => openQAModal(entry));
  }

  row.append(renderLogo(info));

  const main = document.createElement('div');
  main.className = 'jt-row-main';
  const company = document.createElement('span');
  company.className = 'jt-row-company';
  company.textContent = info.name;
  const role = document.createElement('span');
  role.className = 'jt-row-role';
  role.textContent = entry.role || 'Untitled role';
  main.append(company, role);
  row.append(main);

  const meta = document.createElement('div');
  meta.className = 'jt-row-meta';
  if (entry.type) {
    const typeTag = document.createElement('span');
    typeTag.className = 'tag tag-outline';
    typeTag.textContent = entry.type;
    meta.append(typeTag);
  }
  if (entry.location) {
    const loc = document.createElement('span');
    loc.className = 'jt-row-loc';
    loc.textContent = entry.location;
    meta.append(loc);
  }
  row.append(meta);

  const dates = document.createElement('div');
  dates.className = 'jt-row-dates';
  for (const line of entryDateLines(entry)) {
    const el = document.createElement('span');
    el.className = line.accent ? 'jt-row-interview' : '';
    el.textContent = line.text;
    dates.append(el);
  }
  row.append(dates);

  const right = document.createElement('div');
  right.className = 'jt-row-right';
  const statusTag = document.createElement('span');
  statusTag.className = `tag ${STATUS_STYLE[status] || DEFAULT_STATUS_TAG_CLASS}`;
  statusTag.textContent = status;
  right.append(statusTag);
  if (answers.length > 0) {
    const badge = document.createElement('span');
    badge.className = 'jt-row-answers';
    badge.textContent = `${answers.length} Q&A`;
    right.append(badge);
  }
  row.append(right);

  return row;
}

// The pipeline strip: every stage, with its count, always in the same order
// so the shape of the search is readable at a glance rather than inferred
// by counting cards. Clicking a segment filters to that stage.
function renderPipeline(entries) {
  const wrap = document.getElementById('jt-pipeline');
  wrap.replaceChildren();

  const counts = new Map(STATUS_FILTER_CANONICAL.map((s) => [s, 0]));
  for (const entry of entries) {
    const s = effectiveStatus(entry);
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  for (const [status, count] of counts) {
    if (count === 0) continue;
    const seg = document.createElement('button');
    seg.type = 'button';
    seg.className = 'jt-pipe';
    seg.classList.toggle('selected', activeFilters.status.has(status));
    seg.addEventListener('click', () => cycleFilter('status', status));

    const n = document.createElement('span');
    n.className = 'jt-pipe-count';
    n.textContent = count;
    const label = document.createElement('span');
    label.className = 'jt-pipe-label';
    label.textContent = status;
    const bar = document.createElement('span');
    bar.className = `jt-pipe-bar ${STATUS_STYLE[status] || DEFAULT_STATUS_TAG_CLASS}`;

    seg.append(n, label, bar);
    wrap.append(seg);
  }
}

function renderGridView() {
  const grid = document.getElementById('jt-grid');
  const emptyMsg = document.getElementById('jt-empty');

  grid.replaceChildren();

  const filtered = allEntries.filter(entryMatchesFilters);
  const sorted = sortEntries(filtered);

  emptyMsg.style.display = sorted.length === 0 ? '' : 'none';

  // Grouped by stage rather than one flat list: "which roles am I actually
  // in" is the question the page is asked most, and a date-sorted flat list
  // answers it only by reading every row.
  const groups = new Map(STATUS_FILTER_CANONICAL.map((s) => [s, []]));
  for (const entry of sorted) {
    const s = effectiveStatus(entry);
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s).push(entry);
  }

  for (const [status, rows] of groups) {
    if (rows.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'jt-group';

    const head = document.createElement('h2');
    head.className = 'jt-group-head';
    const dot = document.createElement('span');
    dot.className = `jt-group-dot ${STATUS_STYLE[status] || DEFAULT_STATUS_TAG_CLASS}`;
    const label = document.createElement('span');
    label.textContent = status;
    const count = document.createElement('span');
    count.className = 'jt-group-count';
    count.textContent = rows.length;
    head.append(dot, label, count);
    section.append(head);

    const list = document.createElement('div');
    list.className = 'jt-list';
    for (const entry of rows) list.append(renderRow(entry));
    section.append(list);

    grid.append(section);
  }

  renderPipeline(allEntries);

  const activeCount = allEntries.filter((e) => {
    const s = effectiveStatus(e);
    return s !== 'Rejected' && s !== 'Withdrawn';
  }).length;
  document.getElementById('jt-summary').textContent =
    `${sorted.length} of ${allEntries.length} shown · ${activeCount} active`;

  renderActiveFilters();
}

function initFilterControls() {
  document.getElementById('f-company').addEventListener('input', (e) => {
    companyQuery = e.target.value.trim().toLowerCase();
    renderGridView();
  });
  document.getElementById('f-role').addEventListener('input', (e) => {
    roleQuery = e.target.value.trim().toLowerCase();
    renderGridView();
  });
  document.getElementById('f-from').addEventListener('change', (e) => {
    dateFrom = e.target.value;
    renderGridView();
  });
  document.getElementById('f-to').addEventListener('change', (e) => {
    dateTo = e.target.value;
    renderGridView();
  });
  document.getElementById('jt-empty-clear').addEventListener('click', clearAllFilters);
}

// — Q&A modal —

let qaActiveEntry = null;
let qaActiveTagFilter = null;

function makeTagPill(tagName, baseClass, onClick) {
  const pill = document.createElement('span');
  pill.className = `tag ${baseClass}`;
  if (tagName === qaActiveTagFilter) pill.classList.add('selected');
  pill.textContent = tagName;
  pill.addEventListener('click', onClick);
  return pill;
}

function renderQABody() {
  const body = document.getElementById('qa-body');
  body.replaceChildren();

  const answers = (qaActiveEntry && qaActiveEntry.answers) || [];

  if (answers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dialog-body-text';
    empty.textContent = 'No answers saved yet.';
    body.append(empty);
    return;
  }

  const allTags = [...new Set(answers.flatMap((a) => a.tags || []))].sort();

  function toggleTagFilter(tag) {
    qaActiveTagFilter = qaActiveTagFilter === tag ? null : tag;
    renderQABody();
  }

  if (allTags.length > 0) {
    const filterBar = document.createElement('div');
    filterBar.className = 'qa-filter-bar';
    for (const tag of allTags) {
      filterBar.append(makeTagPill(tag, 'tag-outline', () => toggleTagFilter(tag)));
    }
    if (qaActiveTagFilter) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'qa-clear-filter';
      clear.textContent = 'Show all answers';
      clear.addEventListener('click', () => toggleTagFilter(qaActiveTagFilter));
      filterBar.append(clear);
    }
    body.append(filterBar);
  }

  const visibleAnswers = qaActiveTagFilter
    ? answers.filter((a) => (a.tags || []).includes(qaActiveTagFilter))
    : answers;

  const list = document.createElement('div');
  list.className = 'qa-list';

  for (const answer of visibleAnswers) {
    const item = document.createElement('div');
    item.className = 'qa-item';

    const question = document.createElement('div');
    question.className = 'qa-question';
    question.textContent = answer.question;
    item.append(question);

    if ((answer.tags || []).length > 0) {
      const tagsRow = document.createElement('div');
      tagsRow.className = 'qa-tags';
      for (const tag of answer.tags) {
        tagsRow.append(makeTagPill(tag, 'tag-accent', () => toggleTagFilter(tag)));
      }
      item.append(tagsRow);
    }

    const text = document.createElement('p');
    text.className = 'qa-text';
    text.textContent = answer.text;
    item.append(text);

    list.append(item);
  }

  body.append(list);
}

function openQAModal(entry) {
  qaActiveEntry = entry;
  qaActiveTagFilter = null;
  document.getElementById('qa-title').textContent = entry.company || 'Unknown company';
  document.getElementById('qa-subtitle').textContent = entry.role || 'Untitled role';
  renderQABody();
  document.getElementById('qa-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('qa-close').focus();
}

function closeQAModal() {
  document.getElementById('qa-backdrop').classList.remove('open');
  document.body.style.overflow = '';
  qaActiveEntry = null;
  qaActiveTagFilter = null;
}

function initQAModal() {
  const backdrop = document.getElementById('qa-backdrop');
  document.getElementById('qa-close').addEventListener('click', closeQAModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeQAModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeQAModal();
  });
}

// — Init —

async function init() {
  initQAModal();

  const loadEmptyMsg = document.getElementById('jt-load-empty');
  const loadErrorMsg = document.getElementById('jt-load-error');

  let entries;
  try {
    const res = await fetch('data/job-applications.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    entries = await res.json();
  } catch (err) {
    loadErrorMsg.style.display = '';
    return;
  }

  if (entries.length === 0) {
    loadEmptyMsg.style.display = '';
    return;
  }

  // Non-fatal: the page renders with initials tiles if the registry is
  // missing, rather than failing to load at all.
  try {
    const regRes = await fetch('data/companies.json');
    if (regRes.ok) companyRegistry = (await regRes.json()).companies || {};
  } catch (err) {
    companyRegistry = {};
  }

  allEntries = entries;
  initFilterControls();
  renderFilterGroups(buildFilterOptions(allEntries));
  renderGridView();
}

init();
