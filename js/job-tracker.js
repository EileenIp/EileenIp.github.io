const STATUS_STYLE = {
  'To Apply': { tagClass: 'tag-to-apply', dot: 'var(--color-neutral-400)' },
  Applied: { tagClass: 'tag-outline', dot: 'var(--color-accent)' },
  Interviewing: { tagClass: 'tag-interviewing', dot: 'var(--color-accent-2)' },
  Offer: { tagClass: 'tag-accent', dot: 'var(--color-accent-300)' },
  Rejected: { tagClass: 'tag-neutral', dot: 'var(--color-neutral-600)' },
  Withdrawn: { tagClass: 'tag-neutral', dot: 'var(--color-neutral-500)' },
  Ghosted: { tagClass: 'tag-ghosted', dot: 'var(--color-neutral-700)' },
};
const DEFAULT_STATUS_STYLE = { tagClass: 'tag-neutral', dot: 'var(--color-neutral-400)' };

// Canonical filter option order for each dimension. Any value found in the
// data that isn't in a canonical list gets appended automatically (sorted)
// so nothing is ever silently unselectable — except Location, which has an
// explicit "Other" catch-all by design.
const STATUS_FILTER_CANONICAL = ['To Apply', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];
const TYPE_FILTER_CANONICAL = ['Internship', 'Graduate Program', 'Full-Time', 'Part-Time', 'Casual', 'Contract'];
const LOCATION_FILTER_CANONICAL = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Remote', 'Hybrid', 'Other'];
const PRIORITY_FILTER_CANONICAL = ['High', 'Medium', 'Low'];
const PRIORITY_RANK = { High: 3, Medium: 2, Low: 1 };
const DEADLINE_MONTH_LOOKUP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A blank Status cell means the role hasn't been applied to yet, same as an
// explicit "To Apply" — unless there's an Applied Date on the row, in which
// case blank Status just means the field wasn't updated after applying.
function effectiveStatus(entry) {
  if (entry.status) return entry.status;
  return entry.date_applied ? 'Applied' : 'To Apply';
}

function formatDate(isoDate) {
  if (!isoDate) return 'unknown date';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function computeStats(entries) {
  return {
    total: entries.length,
    toApply: entries.filter((e) => effectiveStatus(e) === 'To Apply').length,
    interviewing: entries.filter((e) => e.status === 'Interviewing').length,
    rejected: entries.filter((e) => e.status === 'Rejected').length,
    withdrawn: entries.filter((e) => e.status === 'Withdrawn').length,
    active: entries.filter((e) => effectiveStatus(e) === 'Applied').length,
  };
}

function renderStats(stats) {
  const grid = document.getElementById('stats-grid');
  const tiles = [
    ['To Apply', stats.toApply],
    ['Applied', stats.total],
    ['Interviewing', stats.interviewing],
    ['Rejected', stats.rejected],
    ['Withdrawn', stats.withdrawn],
    ['Active', stats.active],
  ];
  for (const [label, value] of tiles) {
    const card = document.createElement('div');
    card.className = 'card stat-card';

    const kicker = document.createElement('div');
    kicker.className = 'card-kicker';
    kicker.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = String(value);

    card.append(kicker, valueEl);
    grid.append(card);
  }
}

function metaLine(parts) {
  const text = parts.filter(Boolean).join(' · ');
  if (!text) return null;
  const div = document.createElement('div');
  div.className = 'card-meta';
  div.textContent = text;
  return div;
}

function renderEntry(entry) {
  const status = effectiveStatus(entry);
  const style = STATUS_STYLE[status] || DEFAULT_STATUS_STYLE;

  const row = document.createElement('div');
  row.className = 'timeline-entry';

  const dotWrap = document.createElement('div');
  dotWrap.className = 'timeline-dot-wrap';
  const dot = document.createElement('div');
  dot.className = 'timeline-dot';
  dot.style.background = style.dot;
  dotWrap.append(dot);

  const card = document.createElement('div');
  card.className = 'card entry-card';

  const head = document.createElement('div');
  head.className = 'entry-head';

  const titleBlock = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = entry.role || 'Untitled role';
  titleBlock.append(title);
  const companyMeta = metaLine([entry.company, entry.location]);
  if (companyMeta) titleBlock.append(companyMeta);

  const tag = document.createElement('span');
  tag.className = `tag ${style.tagClass}`;
  tag.style.flex = 'none';
  tag.textContent = status;

  head.append(titleBlock, tag);
  card.append(head);

  const dateFragment = entry.date_applied
    ? `Applied ${formatDate(entry.date_applied)}`
    : status === 'To Apply'
      ? 'Not yet applied'
      : null;
  const dateMeta = metaLine([dateFragment, entry.stage ? `Stage: ${entry.stage}` : null]);
  if (dateMeta) card.append(dateMeta);

  if (entry.reason) {
    const reason = document.createElement('p');
    reason.className = 'card-body';
    reason.textContent = entry.reason;
    card.append(reason);
  }

  if (entry.next_action) {
    const next = document.createElement('div');
    next.className = 'next-action';
    const kicker = document.createElement('span');
    kicker.className = 'card-kicker';
    kicker.textContent = 'Next';
    const text = document.createElement('span');
    text.textContent = entry.next_action;
    next.append(kicker, text);
    card.append(next);
  }

  const qaRow = document.createElement('div');
  qaRow.className = 'qa-row';
  const qaBtn = document.createElement('button');
  qaBtn.type = 'button';
  qaBtn.className = 'qa-btn';
  qaBtn.textContent = '+';
  qaBtn.setAttribute('aria-label', `View saved answers for ${entry.role || 'this role'} at ${entry.company || 'this company'}`);
  qaBtn.addEventListener('click', () => openQAModal(entry));
  qaRow.append(qaBtn);

  const answerCount = (entry.answers || []).length;
  if (answerCount > 0) {
    const count = document.createElement('span');
    count.className = 'qa-count';
    count.textContent = `${answerCount} saved answer${answerCount === 1 ? '' : 's'}`;
    qaRow.append(count);
  }
  card.append(qaRow);

  row.append(dotWrap, card);
  return row;
}

// — Q&A modal —

let qaActiveEntry = null;
let qaActiveTagFilter = null;

function makeTagPill(tagName, onClick) {
  const pill = document.createElement('span');
  pill.className = 'tag tag-outline';
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
      filterBar.append(makeTagPill(tag, () => toggleTagFilter(tag)));
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
        tagsRow.append(makeTagPill(tag, () => toggleTagFilter(tag)));
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
  document.getElementById('qa-title').textContent = `${entry.role || 'Untitled role'} — ${entry.company || 'Unknown company'}`;
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

// — Filtering & sorting —

let allEntries = [];
const activeFilters = { status: new Set(), type: new Set(), location: new Set(), priority: new Set() };
let searchQuery = '';
let sortMode = 'date_desc';

function matchCanonical(raw, canonicalList) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = canonicalList.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

function getEntryType(entry) {
  return matchCanonical(entry.type, TYPE_FILTER_CANONICAL);
}

function getEntryPriority(entry) {
  return matchCanonical(entry.priority, PRIORITY_FILTER_CANONICAL);
}

// Location cells can hold multiple comma-separated values (e.g. "VIC, NSW").
// Anything not on the fixed canonical list (e.g. "Singapore") becomes "Other".
function getEntryLocations(entry) {
  if (!entry.location) return [];
  return entry.location
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((loc) => {
      const match = LOCATION_FILTER_CANONICAL.find((c) => c !== 'Other' && c.toLowerCase() === loc.toLowerCase());
      return match || 'Other';
    });
}

function buildFilterOptions(entries) {
  const extraStatus = new Set();
  const extraType = new Set();
  const extraPriority = new Set();
  for (const entry of entries) {
    const s = effectiveStatus(entry);
    if (s && !STATUS_FILTER_CANONICAL.includes(s)) extraStatus.add(s);
    const t = getEntryType(entry);
    if (t && !TYPE_FILTER_CANONICAL.includes(t)) extraType.add(t);
    const p = getEntryPriority(entry);
    if (p && !PRIORITY_FILTER_CANONICAL.includes(p)) extraPriority.add(p);
  }
  return {
    status: [...STATUS_FILTER_CANONICAL, ...[...extraStatus].sort()],
    type: [...TYPE_FILTER_CANONICAL, ...[...extraType].sort()],
    location: LOCATION_FILTER_CANONICAL,
    priority: [...PRIORITY_FILTER_CANONICAL, ...[...extraPriority].sort()],
  };
}

function entryMatchesFilters(entry) {
  if (activeFilters.status.size && !activeFilters.status.has(effectiveStatus(entry))) return false;
  if (activeFilters.type.size) {
    const t = getEntryType(entry);
    if (!t || !activeFilters.type.has(t)) return false;
  }
  if (activeFilters.location.size) {
    const locs = getEntryLocations(entry);
    if (!locs.some((l) => activeFilters.location.has(l))) return false;
  }
  if (activeFilters.priority.size) {
    const p = getEntryPriority(entry);
    if (!p || !activeFilters.priority.has(p)) return false;
  }
  if (searchQuery) {
    const haystack = `${entry.company || ''} ${entry.role || ''}`.toLowerCase();
    if (!haystack.includes(searchQuery)) return false;
  }
  return true;
}

function parseDeadlineSortKey(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const month = DEADLINE_MONTH_LOOKUP[raw.trim().toLowerCase()];
  if (month) return `2026-${String(month).padStart(2, '0')}-01`;
  return null;
}

function sortEntries(entries) {
  const arr = [...entries];
  switch (sortMode) {
    case 'date_asc':
      arr.sort((a, b) => (a.date_applied || '￿').localeCompare(b.date_applied || '￿'));
      break;
    case 'deadline_asc':
      arr.sort((a, b) => (parseDeadlineSortKey(a.deadline) || '￿').localeCompare(parseDeadlineSortKey(b.deadline) || '￿'));
      break;
    case 'status':
      arr.sort((a, b) => {
        const ia = STATUS_FILTER_CANONICAL.indexOf(effectiveStatus(a));
        const ib = STATUS_FILTER_CANONICAL.indexOf(effectiveStatus(b));
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      break;
    case 'priority_desc':
      arr.sort((a, b) => (PRIORITY_RANK[getEntryPriority(b)] || 0) - (PRIORITY_RANK[getEntryPriority(a)] || 0));
      break;
    case 'date_desc':
    default:
      arr.sort((a, b) => (b.date_applied || '').localeCompare(a.date_applied || ''));
      break;
  }
  return arr;
}

function syncFilterPillStates() {
  document.querySelectorAll('.filter-pill').forEach((pill) => {
    const isSelected = activeFilters[pill.dataset.filterKey].has(pill.dataset.filterValue);
    pill.classList.toggle('selected', isSelected);
  });
}

function toggleFilter(key, value) {
  const set = activeFilters[key];
  if (set.has(value)) set.delete(value);
  else set.add(value);
  syncFilterPillStates();
  renderTimelineView();
}

function removeFilter(key, value) {
  if (key === 'search') {
    searchQuery = '';
    document.getElementById('search-input').value = '';
  } else {
    activeFilters[key].delete(value);
  }
  syncFilterPillStates();
  renderTimelineView();
}

function clearAllFilters() {
  activeFilters.status.clear();
  activeFilters.type.clear();
  activeFilters.location.clear();
  activeFilters.priority.clear();
  searchQuery = '';
  document.getElementById('search-input').value = '';
  syncFilterPillStates();
  renderTimelineView();
}

function renderFilterGroups(options) {
  const container = document.getElementById('filter-groups');
  container.replaceChildren();
  const groups = [
    ['Status', 'status', options.status],
    ['Type', 'type', options.type],
    ['Location', 'location', options.location],
    ['Priority', 'priority', options.priority],
  ];
  for (const [label, key, values] of groups) {
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
      pill.addEventListener('click', () => toggleFilter(key, value));
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
  for (const key of ['status', 'type', 'location', 'priority']) {
    for (const value of activeFilters[key]) chips.push({ key, value, label: value });
  }
  if (searchQuery) chips.push({ key: 'search', value: searchQuery, label: `"${searchQuery}"` });

  if (chips.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  const countLabel = document.createElement('span');
  countLabel.className = 'active-filter-count';
  countLabel.textContent = `${chips.length} filter${chips.length === 1 ? '' : 's'} active:`;
  wrap.append(countLabel);

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
  clearBtn.className = 'qa-clear-filter';
  clearBtn.textContent = 'Clear all';
  clearBtn.addEventListener('click', clearAllFilters);
  wrap.append(clearBtn);
}

function renderTimelineView() {
  const timeline = document.getElementById('timeline');
  const filtersEmptyMsg = document.getElementById('filters-empty');

  timeline.querySelectorAll('.timeline-entry').forEach((el) => el.remove());

  const filtered = allEntries.filter(entryMatchesFilters);
  const sorted = sortEntries(filtered);

  filtersEmptyMsg.style.display = sorted.length === 0 ? '' : 'none';

  for (const entry of sorted) {
    timeline.append(renderEntry(entry));
  }

  renderActiveFilters();
}

function initFilterControls() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderTimelineView();
  });
  document.getElementById('sort-select').addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderTimelineView();
  });
}

async function init() {
  initQAModal();

  const emptyMsg = document.getElementById('timeline-empty');
  const errorMsg = document.getElementById('timeline-error');

  let entries;
  try {
    const res = await fetch('data/job-applications.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    entries = await res.json();
  } catch (err) {
    errorMsg.style.display = '';
    return;
  }

  // Stats always reflect the full dataset, computed once, never re-run on filter change.
  renderStats(computeStats(entries));

  if (entries.length === 0) {
    emptyMsg.style.display = '';
    return;
  }

  allEntries = entries;
  initFilterControls();
  renderFilterGroups(buildFilterOptions(allEntries));
  document.getElementById('filters-panel').style.display = '';
  renderTimelineView();
}

init();
