const ARROW_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const CHEVRON_PATH = 'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z';

// Rainbow tag colors, matching the hand-picked assignments on the homepage
// cards so the same project shows the same colors in both places.
const RAINBOW_TAGS = ['tag-red', 'tag-orange', 'tag-yellow', 'tag-green', 'tag-blue', 'tag-indigo', 'tag-violet'];
const INDUSTRY_COLOR = {
  'Marketing': 'tag-red',
  'Digital Advertising': 'tag-orange',
  'Media & Entertainment': 'tag-yellow',
  'Subscription Media': 'tag-green',
  'Gaming': 'tag-blue',
  'E-Commerce': 'tag-indigo',
  'Customer Experience': 'tag-violet',
  'Accessibility': 'tag-violet',
};
const PROJECT_TYPE_COLOR = {
  'Data Pipeline': 'tag-indigo',
  'Classification + Segmentation': 'tag-violet',
  'Business Intelligence': 'tag-red',
  'Statistical Analysis': 'tag-orange',
  'Dashboard': 'tag-yellow',
  'Classification + Operational Analysis': 'tag-green',
  'NLP Analysis': 'tag-blue',
  'AI Application': 'tag-indigo',
};
// Falls back to a stable hash so any category not in the map above still
// gets a consistent (if unassigned) rainbow color instead of breaking.
function rainbowClass(value, map) {
  if (!value) return 'tag-neutral';
  if (map[value]) return map[value];
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return RAINBOW_TAGS[hash % RAINBOW_TAGS.length];
}

// Long-text sections shown collapsed in the modal, in display order. Each
// entry optionally names a `visuals` section key whose charts render inside
// that section's body. Every SPIDER section is now a standalone
// always-visible section instead (see renderProjectBody) — this stays
// empty but in place in case a future section wants the collapsed treatment.
const COLLAPSIBLE_SECTIONS = [];

// Footer links, in display order. caseStudyPage isn't in the original spec's
// 4 named links, but rather than drop it silently if a project has one, it
// renders as a 5th button.
const FOOTER_LINKS = [
  ['dashboard', 'Dashboard'],
  ['technicalFindings', 'Technical Findings'],
  ['nonTechnicalSummary', 'Summary'],
  ['notebookRepo', 'Notebook / Repo'],
  ['caseStudyPage', 'Full Case Study'],
];

// — Filtering —

let allProjects = [];
const FILTER_KEYS = ['industry', 'projectType', 'serviceType', 'tools'];
const activeFilters = { industry: new Set(), projectType: new Set(), serviceType: new Set(), tools: new Set() };
const FILTER_GROUPS = [
  ['Industry', 'industry', 'Search industries…'],
  ['Project Type', 'projectType', 'Search project types…'],
  ['Service Type', 'serviceType', 'Search service types…'],
  ['Tools', 'tools', 'Search tools…'],
];
const YEAR_FIRST = 2023;
const YEAR_LAST = Math.max(2026, new Date().getFullYear());
let yearFrom = '';
let yearTo = '';

// value -> number of projects using it, for one filter key
function countFilterValues(key) {
  const counts = new Map();
  for (const p of allProjects) {
    const values = key === 'tools' ? (p.tools || []) : [p[key]];
    for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}

function projectMatchesFilters(p) {
  if (yearFrom && (!p.year || p.year < Number(yearFrom))) return false;
  if (yearTo && (!p.year || p.year > Number(yearTo))) return false;

  for (const key of ['industry', 'projectType', 'serviceType']) {
    if (activeFilters[key].size && !activeFilters[key].has(p[key])) return false;
  }

  const tools = p.tools || [];
  if (activeFilters.tools.size && !tools.some((t) => activeFilters.tools.has(t))) return false;

  return true;
}

// No sort order was specified for this page — defaulting to newest year first.
function sortProjects(projects) {
  return [...projects].sort((a, b) => (b.year || 0) - (a.year || 0));
}

function toggleFilter(key, value) {
  if (activeFilters[key].has(value)) activeFilters[key].delete(value);
  else activeFilters[key].add(value);
  renderGridView();
}

// Accepts only a 4-digit year; anything else clears that bound.
function setYear(which, raw) {
  const value = /^\d{4}$/.test(String(raw).trim()) ? String(raw).trim() : '';
  if (which === 'from') yearFrom = value;
  else yearTo = value;
  document.getElementById(which === 'from' ? 'f-year-from' : 'f-year-to').value = value;
  renderGridView();
}

function removeFilter(key, value) {
  if (key === 'yearFrom') setYear('from', '');
  else if (key === 'yearTo') setYear('to', '');
  else toggleFilter(key, value);
}

function clearAllFilters() {
  for (const key of FILTER_KEYS) activeFilters[key].clear();
  yearFrom = '';
  yearTo = '';
  document.getElementById('f-year-from').value = '';
  document.getElementById('f-year-to').value = '';
  renderGridView();
}

// Each filter group is a searchable dropdown: focusing lists every value,
// typing narrows it, picking a value toggles it on or off.
function renderFilterGroups() {
  const container = document.getElementById('filter-groups');
  container.replaceChildren();
  for (const [label, key, placeholder] of FILTER_GROUPS) {
    const counts = countFilterValues(key);
    if (counts.size === 0) continue;

    const group = document.createElement('div');
    group.className = 'field combo';
    const labelEl = document.createElement('label');
    labelEl.htmlFor = `f-${key}`;
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.type = 'search';
    input.id = `f-${key}`;
    input.className = 'input';
    input.placeholder = placeholder;
    group.append(labelEl, input);
    container.append(group);

    createCombobox(input, {
      getOptions: (q) => [...counts]
        .filter(([value]) => value.toLowerCase().includes(q))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
        .map(([value, count]) => ({
          label: value,
          meta: `${count} project${count === 1 ? '' : 's'}`,
          selected: activeFilters[key].has(value),
        })),
      onChoose: (item) => toggleFilter(key, item.label),
    });
  }
}

function renderActiveFilters() {
  const wrap = document.getElementById('active-filters');
  wrap.replaceChildren();

  const chips = [];
  if (yearFrom) chips.push({ key: 'yearFrom', label: `From ${yearFrom}` });
  if (yearTo) chips.push({ key: 'yearTo', label: `To ${yearTo}` });
  for (const key of FILTER_KEYS) {
    for (const value of activeFilters[key]) chips.push({ key, value, label: value });
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

function renderCard(project) {
  const card = document.createElement('div');
  card.className = 'card project-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View case study: ${project.title || 'Untitled project'}`);
  card.addEventListener('click', () => openProjectModal(project));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProjectModal(project);
    }
  });

  const thumb = document.createElement('div');
  thumb.className = 'project-thumb';
  if (project.image) {
    const img = document.createElement('img');
    img.src = project.image;
    img.alt = project.title || 'Project thumbnail';
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    thumb.append(img);
  }
  card.append(thumb);

  const body = document.createElement('div');
  body.className = 'project-body';

  const head = document.createElement('div');
  head.className = 'project-head';
  const title = document.createElement('h3');
  title.textContent = project.title || 'Untitled project';
  head.append(title);
  // `dateLabel` (e.g. "August 2026") is display-only; filtering and sorting
  // still run on the numeric `year`.
  if (project.year) {
    const year = document.createElement('span');
    year.className = 'project-year';
    year.textContent = project.dateLabel || project.year;
    head.append(year);
  }
  body.append(head);

  const tags = document.createElement('ul');
  tags.className = 'project-tags';
  const tagSpecs = [
    [project.projectType, rainbowClass(project.projectType, PROJECT_TYPE_COLOR)],
    [project.industry, rainbowClass(project.industry, INDUSTRY_COLOR)],
    [project.serviceType, 'tag-neutral'],
  ];
  for (const [value, cls] of tagSpecs) {
    if (!value) continue;
    const li = document.createElement('li');
    li.className = `tag ${cls}`;
    li.textContent = value;
    tags.append(li);
  }
  for (const tool of project.tools || []) {
    const li = document.createElement('li');
    li.className = 'tag tag-outline';
    li.textContent = tool;
    tags.append(li);
  }
  body.append(tags);

  if (project.cardDescription) {
    const desc = document.createElement('p');
    desc.className = 'project-desc';
    desc.textContent = project.cardDescription;
    body.append(desc);
  }

  if (project.impactStat) {
    const impact = document.createElement('div');
    impact.className = 'project-impact';
    const label = document.createElement('span');
    label.className = 'label-xs';
    label.textContent = 'Impact';
    const text = document.createElement('span');
    text.textContent = project.impactStat;
    impact.append(label, text);
    body.append(impact);
  }

  const cta = document.createElement('div');
  cta.className = 'project-cta';
  cta.innerHTML = `<span>View case study</span>${ARROW_ICON}`;
  body.append(cta);

  card.append(body);
  return card;
}

function renderGridView() {
  const grid = document.getElementById('proj-grid');
  const emptyMsg = document.getElementById('proj-empty');

  grid.replaceChildren();

  const filtered = allProjects.filter(projectMatchesFilters);
  const sorted = sortProjects(filtered);

  emptyMsg.style.display = sorted.length === 0 ? '' : 'none';

  for (const project of sorted) {
    grid.append(renderCard(project));
  }

  document.getElementById('proj-summary').textContent = `${sorted.length} of ${allProjects.length} shown`;

  renderActiveFilters();
}

function initFilterControls() {
  for (const which of ['from', 'to']) {
    const input = document.getElementById(which === 'from' ? 'f-year-from' : 'f-year-to');
    // typed years apply when the field is left
    input.addEventListener('change', () => setYear(which, input.value));
    createCombobox(input, {
      clearOnChoose: false,
      getOptions: (q) => {
        const years = [];
        for (let y = YEAR_FIRST; y <= YEAR_LAST; y++) if (String(y).startsWith(q)) years.push(String(y));
        const current = which === 'from' ? yearFrom : yearTo;
        return years.map((y) => ({ label: y, selected: y === current }));
      },
      onChoose: (item) => setYear(which, item.label),
      onEnterText: (text) => setYear(which, text),
    });
  }

  createCombobox(document.getElementById('proj-search-input'), {
    getOptions: (q) => (q ? allProjects
      .filter((p) => [p.title, p.oneSentenceDescription].some((t) => t && t.toLowerCase().includes(q)))
      .map((p) => ({ label: p.title || 'Untitled project', meta: [p.industry, p.year].filter(Boolean).join(' · '), project: p }))
      : []),
    onChoose: (item) => openProjectModal(item.project),
  });

  document.getElementById('proj-empty-clear').addEventListener('click', clearAllFilters);
}

// — Searchable dropdown —
// Turns a text input into a combobox: focusing or typing shows matching
// options below it, arrow keys move, Enter picks, Esc closes. getOptions(query)
// gets the lowercased trimmed text and returns [{ label, meta?, selected? }].

function createCombobox(input, { getOptions, onChoose, onEnterText, clearOnChoose = true }) {
  const list = document.createElement('ul');
  list.id = `${input.id}-list`;
  list.className = 'combo-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  input.after(list);
  input.parentElement.classList.add('combo');

  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');

  let items = [];
  let active = -1;
  let open = false;

  function render() {
    list.replaceChildren();
    const hasText = input.value.trim() !== '';
    const show = open && (items.length > 0 || hasText);
    list.hidden = !show;
    input.setAttribute('aria-expanded', String(show));
    input.removeAttribute('aria-activedescendant');
    if (!show) return;

    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'combo-none';
      li.textContent = 'No matches';
      list.append(li);
      return;
    }

    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.id = `${list.id}-${i}`;
      li.className = 'combo-item' + (i === active ? ' active' : '') + (item.selected ? ' selected' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(Boolean(item.selected)));

      const label = document.createElement('span');
      label.className = 'combo-label';
      label.textContent = item.label;
      li.append(label);
      if (item.meta) {
        const meta = document.createElement('span');
        meta.className = 'combo-meta';
        meta.textContent = item.meta;
        li.append(meta);
      }

      // mousedown rather than click, so the input's blur doesn't close the list first
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        choose(item);
      });
      li.addEventListener('mousemove', () => {
        if (active !== i) { active = i; render(); }
      });
      list.append(li);
    });
    if (active >= 0) {
      input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
      list.children[active].scrollIntoView({ block: 'nearest' });
    }
  }

  function refresh() {
    items = getOptions(input.value.trim().toLowerCase());
    active = input.value.trim() && items.length ? 0 : -1;
    open = true;
    render();
  }

  function close() {
    open = false;
    items = [];
    active = -1;
    render();
  }

  function choose(item) {
    if (clearOnChoose) input.value = '';
    close();
    onChoose(item);
  }

  input.addEventListener('input', refresh);
  input.addEventListener('focus', refresh);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { refresh(); return; }
      if (!items.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      active = active < 0 ? (step > 0 ? 0 : items.length - 1) : (active + step + items.length) % items.length;
      render();
    } else if (e.key === 'Enter') {
      if (open && items[active]) {
        e.preventDefault();
        choose(items[active]);
      } else if (onEnterText) {
        e.preventDefault();
        close();
        onEnterText(input.value);
      }
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); close(); }
    }
  });
}

// — Case study modal —

function appendCollapsible(container, label, text, extraNode) {
  if (!text) return;
  const details = document.createElement('details');

  const summary = document.createElement('summary');
  summary.className = 'collapsible-row';
  const labelEl = document.createElement('span');
  labelEl.className = 'collapsible-label';
  labelEl.textContent = label;
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('class', 'collapsible-chevron');
  chevron.setAttribute('width', '14');
  chevron.setAttribute('height', '14');
  chevron.setAttribute('viewBox', '0 0 256 256');
  chevron.setAttribute('fill', 'currentColor');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', CHEVRON_PATH);
  chevron.append(path);
  summary.append(labelEl, chevron);

  const body = document.createElement('div');
  body.className = 'collapsible-body';
  body.textContent = text;

  details.append(summary, body);
  if (extraNode) details.append(extraNode);
  container.append(details);
}

// `neutral` gives a muted gray border/label instead of the accent color —
// used for lower-emphasis callouts like Dead Ends vs. Data Quality.
function renderCallout(data, neutral) {
  if (!data || !data.items || data.items.length === 0) return null;

  const box = document.createElement('div');
  box.className = 'viz-callout' + (neutral ? ' neutral' : '');

  if (data.label) {
    const label = document.createElement('div');
    label.className = 'viz-callout-label';
    label.textContent = data.label;
    box.append(label);
  }

  const ul = document.createElement('ul');
  for (const item of data.items) {
    const li = document.createElement('li');
    appendRichText(li, item);
    ul.append(li);
  }
  box.append(ul);
  return box;
}

function renderInputsSection(inputs) {
  if (!inputs) return null;
  const wrap = document.createElement('div');

  if (inputs.description) appendParagraphs(wrap, inputs.description);

  const statsGrid = renderSummaryMetrics(inputs.stats);
  if (statsGrid) wrap.append(statsGrid);

  const callout = renderCallout(inputs.dataQuality, false);
  if (callout) wrap.append(callout);

  const closingCallout = renderCallout(inputs.closingNote, false);
  if (closingCallout) wrap.append(closingCallout);

  return wrap;
}

function renderSummaryMetrics(metrics) {
  if (!metrics || metrics.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'viz-stats-grid';
  for (const metric of metrics) {
    const cell = document.createElement('div');
    cell.className = 'viz-stat';

    const value = document.createElement('div');
    value.className = 'viz-stat-value' + (metric.highlight ? ' highlight' : '');
    value.append(document.createTextNode(metric.value));
    if (metric.unit) {
      const unit = document.createElement('span');
      unit.className = 'viz-stat-unit';
      unit.textContent = metric.unit;
      value.append(unit);
    }

    const label = document.createElement('div');
    label.className = 'viz-stat-label';
    label.textContent = metric.label;

    cell.append(value, label);
    grid.append(cell);
  }
  return grid;
}

function buildChartCard(visual) {
  const card = document.createElement('div');
  card.className = 'viz-card';

  if (visual.label) {
    const label = document.createElement('div');
    label.className = 'viz-card-label';
    label.textContent = visual.label;
    card.append(label);
  }

  if (visual.image) {
    // Screenshot instead of a chart. `wide` spans the whole grid row; the
    // image links to itself so small UI text can be read at full size.
    card.classList.add('viz-shot');
    if (visual.wide) card.classList.add('wide');
    const link = document.createElement('a');
    link.href = visual.image;
    link.target = '_blank';
    link.rel = 'noopener';
    const img = document.createElement('img');
    img.src = visual.image;
    img.alt = visual.alt || visual.label || '';
    img.loading = 'lazy';
    link.append(img);
    card.append(link);
  } else {
    // SVG markup is authored data from this site's own projects.json, not
    // third-party input — safe to insert directly, and far simpler than
    // rebuilding each chart's shapes via createElementNS.
    const svgWrap = document.createElement('div');
    svgWrap.innerHTML = visual.svg || '';
    card.append(svgWrap.firstElementChild || svgWrap);
  }

  if (visual.caption) {
    const caption = document.createElement('div');
    caption.className = 'viz-caption';
    caption.textContent = visual.caption;
    card.append(caption);
  }

  return card;
}

function renderVisualsGrid(visuals, section) {
  const filtered = (visuals || []).filter((v) => v.section === section);
  if (filtered.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'viz-grid';
  for (const visual of filtered) {
    grid.append(buildChartCard(visual));
  }
  return grid;
}

function buildCategoryLeaderCard(data) {
  if (!data) return null;
  const card = document.createElement('div');
  card.className = 'viz-card';

  if (data.label) {
    const label = document.createElement('div');
    label.className = 'viz-card-label';
    label.textContent = data.label;
    card.append(label);
  }

  if (data.heading) {
    const heading = document.createElement('div');
    heading.className = 'viz-highlight-heading';
    heading.textContent = data.heading;
    card.append(heading);
  }

  if (data.stats && data.stats.length > 0) {
    const row = document.createElement('div');
    row.className = 'viz-stat-row';
    for (const stat of data.stats) {
      const cell = document.createElement('div');
      const value = document.createElement('div');
      value.className = 'viz-stat-row-value';
      value.textContent = stat.value;
      const label = document.createElement('div');
      label.className = 'viz-stat-row-label';
      label.textContent = stat.label;
      cell.append(value, label);
      row.append(cell);
    }
    card.append(row);
  }

  if (data.description) {
    const desc = document.createElement('div');
    desc.className = 'viz-caption';
    desc.textContent = data.description;
    card.append(desc);
  }

  return card;
}

function buildPriceBehaviourCard(data) {
  if (!data) return null;
  const card = document.createElement('div');
  card.className = 'viz-card';

  if (data.label) {
    const label = document.createElement('div');
    label.className = 'viz-card-label';
    label.textContent = data.label;
    card.append(label);
  }

  const row = document.createElement('div');
  row.className = 'viz-price-row';

  function pricePair(point, accent) {
    const pair = document.createElement('div');
    pair.className = 'viz-price-pair';
    const value = document.createElement('div');
    value.className = 'viz-price-value' + (accent ? ' accent' : '');
    value.textContent = point.value;
    const label = document.createElement('div');
    label.className = 'viz-price-label';
    label.textContent = point.label;
    const stack = document.createElement('div');
    stack.append(value, label);
    pair.append(stack);
    return pair;
  }

  if (data.from) row.append(pricePair(data.from, false));
  if (data.from && data.to) {
    const arrow = document.createElement('div');
    arrow.className = 'viz-price-arrow';
    arrow.textContent = '→';
    row.append(arrow);
  }
  if (data.to) row.append(pricePair(data.to, true));
  if (data.description) {
    const desc = document.createElement('div');
    desc.className = 'viz-price-desc';
    desc.textContent = data.description;
    row.append(desc);
  }

  card.append(row);
  return card;
}

function renderMethodGrid(methodology) {
  if (!methodology || methodology.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'method-grid';
  for (const item of methodology) {
    const card = document.createElement('div');
    card.className = 'viz-card';

    const title = document.createElement('div');
    title.className = 'method-card-title';
    title.textContent = item.heading;
    card.append(title);

    const desc = document.createElement('div');
    desc.className = 'method-card-desc';
    appendRichText(desc, item.description);
    card.append(desc);

    grid.append(card);
  }
  return grid;
}

function buildShapCard(data) {
  if (!data || !data.items || data.items.length === 0) return null;
  const card = document.createElement('div');
  card.className = 'viz-card';

  if (data.label) {
    const label = document.createElement('div');
    label.className = 'viz-card-label';
    label.textContent = data.label;
    card.append(label);
  }

  const list = document.createElement('div');
  list.className = 'shap-list';
  for (const item of data.items) {
    const row = document.createElement('div');
    row.className = 'shap-row';

    const icon = document.createElement('div');
    icon.className = 'shap-icon' + (item.weak ? ' weak' : '');
    icon.textContent = item.direction === 'down' ? '↓' : '↑';

    const text = document.createElement('div');
    text.className = 'shap-text';
    appendRichText(text, item.text);

    row.append(icon, text);
    list.append(row);
  }
  card.append(list);
  return card;
}

function renderRecommendations(data) {
  if (!data) return null;
  const wrap = document.createElement('div');

  if (data.items && data.items.length > 0) {
    for (const rec of data.items) {
      const row = document.createElement('div');
      row.className = 'recommendation-row';

      const tag = document.createElement('div');
      tag.className = 'recommendation-tag';
      tag.textContent = rec.tag;

      const text = document.createElement('div');
      text.className = 'recommendation-text';
      appendRichText(text, rec.text);

      row.append(tag, text);
      wrap.append(row);
    }
  }

  if ((data.limitations && data.limitations.length) || (data.nextSteps && data.nextSteps.length)) {
    const grid = document.createElement('div');
    grid.className = 'note-grid';
    for (const [heading, items] of [['Limitations', data.limitations], ['Next steps', data.nextSteps]]) {
      if (!items || items.length === 0) continue;
      const note = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'note-title';
      title.textContent = heading;
      const list = document.createElement('ul');
      list.className = 'note-text';
      for (const item of items) {
        const li = document.createElement('li');
        appendRichText(li, item);
        list.append(li);
      }
      note.append(title, list);
      grid.append(note);
    }
    wrap.append(grid);
  }

  return wrap;
}

// Minimal markdown support for narrative text fields — **bold** becomes
// <strong>, `code` becomes <code>, everything else stays plain text (still
// injection-safe: only textContent/createElement are used, never innerHTML,
// so no other markup can sneak in through the JSON).
function appendRichText(container, text) {
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      container.append(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    if (match[1] !== undefined) {
      const strong = document.createElement('strong');
      strong.textContent = match[1];
      container.append(strong);
    } else {
      const code = document.createElement('code');
      code.textContent = match[2];
      container.append(code);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) container.append(document.createTextNode(text.slice(lastIndex)));
}

// Appends one <p class="dialog-body-text"> per blank-line-separated
// paragraph in `text`, each supporting the markup appendRichText handles.
function appendParagraphs(container, text) {
  for (const paragraph of text.split(/\n\s*\n/)) {
    if (!paragraph.trim()) continue;
    const p = document.createElement('p');
    p.className = 'dialog-body-text';
    appendRichText(p, paragraph.trim());
    container.append(p);
  }
}

function appendSectionHeading(container, text, headline) {
  const heading = document.createElement('div');
  heading.className = 'section-label dialog-section-heading';
  heading.textContent = text;
  container.append(heading);

  if (headline) {
    const headlineEl = document.createElement('div');
    headlineEl.className = 'dialog-section-headline';
    headlineEl.textContent = headline;
    container.append(headlineEl);
  }
}

function renderStakeholders(stakeholders) {
  if (!stakeholders || stakeholders.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'stakeholder-grid';
  for (const s of stakeholders) {
    const card = document.createElement('div');
    card.className = 'stakeholder-card';

    const role = document.createElement('div');
    role.className = 'stakeholder-role';
    role.textContent = s.role;

    const desc = document.createElement('div');
    desc.className = 'stakeholder-desc';
    desc.textContent = s.description;

    card.append(role, desc);
    grid.append(card);
  }
  return grid;
}

function renderProjectBody(project) {
  const body = document.getElementById('proj-body');
  body.replaceChildren();
  const headlines = project.sectionHeadlines || {};

  // — Summary Impact —
  appendSectionHeading(body, 'Summary Impact', headlines.summaryImpact);
  if (project.summaryImpact) appendParagraphs(body, project.summaryImpact);

  const metricsGrid = renderSummaryMetrics(project.summaryMetrics);
  if (metricsGrid) body.append(metricsGrid);

  const summaryVisuals = renderVisualsGrid(project.visuals, 'summary');
  if (summaryVisuals) body.append(summaryVisuals);

  // — Problem Space —
  if (project.problemSpace) {
    appendSectionHeading(body, 'Problem Space', headlines.problemSpace);
    appendParagraphs(body, project.problemSpace);
    const stakeholders = renderStakeholders(project.stakeholders);
    if (stakeholders) body.append(stakeholders);
  }

  // — Inputs (Data sources) —
  if (project.inputs) {
    const inputsSection = renderInputsSection(project.inputs);
    if (inputsSection) {
      appendSectionHeading(body, 'Inputs (Data sources)', headlines.inputs);
      body.append(inputsSection);
    }
  }

  // — Discovery —
  const hourChart = (project.visuals || []).find((v) => v.section === 'discovery');
  const categoryLeaderCard = buildCategoryLeaderCard(project.categoryLeader);
  if (hourChart || categoryLeaderCard) {
    appendSectionHeading(body, 'Discovery (Exploratory Data Analysis)', headlines.discovery);
    const topRow = document.createElement('div');
    topRow.className = 'viz-grid';
    if (hourChart) topRow.append(buildChartCard(hourChart));
    if (categoryLeaderCard) topRow.append(categoryLeaderCard);
    body.append(topRow);
  }

  const priceBehaviourCard = buildPriceBehaviourCard(project.priceBehaviour);
  if (priceBehaviourCard) body.append(priceBehaviourCard);

  const surprisingPatternsCallout = renderCallout(project.surprisingPatterns, false);
  if (surprisingPatternsCallout) body.append(surprisingPatternsCallout);

  const hypothesisCallout = renderCallout(project.hypothesisVsReality, true);
  if (hypothesisCallout) body.append(hypothesisCallout);

  const deadEndsCallout = renderCallout(project.deadEnds, true);
  if (deadEndsCallout) body.append(deadEndsCallout);

  // — Execution —
  const methodGrid = renderMethodGrid(project.methodology);
  const ablationChart = (project.visuals || []).find((v) => v.section === 'execution');
  if (methodGrid || ablationChart) {
    appendSectionHeading(body, 'Execution (Methodology)', headlines.execution);
    if (methodGrid) body.append(methodGrid);
    if (ablationChart) body.append(buildChartCard(ablationChart));

    const secondaryModelCallout = renderCallout(project.secondaryModel, true);
    if (secondaryModelCallout) body.append(secondaryModelCallout);

    const executionDeadEndsCallout = renderCallout(project.executionDeadEnds, true);
    if (executionDeadEndsCallout) body.append(executionDeadEndsCallout);
  }

  // — Results & Recommendations —
  const shapCard = buildShapCard(project.shapDrivers);
  const resultsCharts = (project.visuals || []).filter((v) => v.section === 'results');
  const rocChart = resultsCharts.find((v) => v.id === 'roc-generalization');
  const segmentsChart = resultsCharts.find((v) => v.id === 'segments');
  // Any other results chart renders generically. Without this, a visual placed in
  // the results section with an id this function does not name is silently dropped —
  // it validates, it loads, and it simply never appears on the page.
  const otherResultsCharts = resultsCharts.filter((v) => v !== rocChart && v !== segmentsChart);

  if (shapCard || rocChart || segmentsChart || otherResultsCharts.length || project.recommendations) {
    appendSectionHeading(body, 'Results', headlines.results);

    if (shapCard || rocChart) {
      const topRow = document.createElement('div');
      topRow.className = 'viz-grid';
      if (shapCard) topRow.append(shapCard);
      if (rocChart) topRow.append(buildChartCard(rocChart));
      body.append(topRow);
    }

    if (segmentsChart) body.append(buildChartCard(segmentsChart));

    if (otherResultsCharts.length) {
      const grid = document.createElement('div');
      grid.className = 'viz-grid';
      for (const visual of otherResultsCharts) grid.append(buildChartCard(visual));
      body.append(grid);
    }

    const keyResultsCallout = renderCallout(project.keyResults, false);
    if (keyResultsCallout) body.append(keyResultsCallout);

    if (project.businessInterpretation) {
      const biHeading = document.createElement('div');
      biHeading.className = 'viz-highlight-heading';
      biHeading.style.marginTop = 'var(--space-4)';
      biHeading.textContent = 'What This Means';
      body.append(biHeading);
      appendParagraphs(body, project.businessInterpretation);
    }

    if (project.recommendations) {
      const recHeading = document.createElement('div');
      recHeading.className = 'viz-highlight-heading';
      recHeading.style.marginTop = 'var(--space-4)';
      recHeading.textContent = 'Recommendations';
      body.append(recHeading);
      body.append(renderRecommendations(project.recommendations));
    }
  }

  // — Remaining long-text sections, still collapsed, each carrying its own charts —
  const collapsibleWrap = document.createElement('div');
  collapsibleWrap.style.marginTop = 'var(--space-4)';
  for (const [key, label, visualsSection] of COLLAPSIBLE_SECTIONS) {
    const extra = visualsSection ? renderVisualsGrid(project.visuals, visualsSection) : null;
    appendCollapsible(collapsibleWrap, label, project[key], extra);
  }
  body.append(collapsibleWrap);

  const links = project.links || {};
  const availableLinks = FOOTER_LINKS.filter(([key]) => links[key]);
  if (availableLinks.length > 0) {
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; margin-top:var(--space-2); padding-top:var(--space-3); border-top:1px solid var(--color-divider);';
    for (const [key, label] of availableLinks) {
      const a = document.createElement('a');
      a.href = links[key];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn btn-secondary';
      a.style.fontSize = '13px';
      a.innerHTML = `${label} ${ARROW_ICON}`;
      footer.append(a);
    }
    body.append(footer);
  }
}

function openProjectModal(project) {
  document.getElementById('proj-title').textContent = project.title || 'Untitled project';
  document.getElementById('proj-role').textContent = project.targetIndustryRole || 'Case study';
  document.getElementById('proj-onesentence').textContent = project.oneSentenceDescription || '';
  document.getElementById('proj-onesentence').style.display = project.oneSentenceDescription ? '' : 'none';
  renderProjectBody(project);
  document.getElementById('proj-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('proj-close').focus();
}

function closeProjectModal() {
  document.getElementById('proj-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function initProjectModal() {
  const backdrop = document.getElementById('proj-backdrop');
  document.getElementById('proj-close').addEventListener('click', closeProjectModal);
  document.getElementById('proj-download').addEventListener('click', () => {
    const originalTitle = document.title;
    const projectTitle = document.getElementById('proj-title').textContent || originalTitle;
    document.title = projectTitle;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeProjectModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeProjectModal();
  });
}

// — Init —

async function init() {
  initProjectModal();

  const loadEmptyMsg = document.getElementById('proj-load-empty');
  const loadErrorMsg = document.getElementById('proj-load-error');

  let projects;
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    projects = data.projects || [];
  } catch (err) {
    loadErrorMsg.style.display = '';
    return;
  }

  if (projects.length === 0) {
    loadEmptyMsg.style.display = '';
    return;
  }

  allProjects = projects;
  initFilterControls();
  renderFilterGroups();
  renderGridView();
  openProjectFromURL();
}

// Lets an external link (e.g. a resume) deep-link straight into a project's
// modal via projects.html?project=<id>, instead of just landing on the grid.
function openProjectFromURL() {
  const id = new URLSearchParams(window.location.search).get('project');
  if (!id) return;
  const project = allProjects.find((p) => p.id === id);
  if (project) openProjectModal(project);
}

init();
