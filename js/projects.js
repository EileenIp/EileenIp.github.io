/* Projects page: role picks, sidebar filters, cards and the case-study pop-up.
   Everything is driven by data/projects.json. Filters live in the page address
   (e.g. projects.html?role=engineer&industry=Gaming), so any view can be shared;
   ?project=<id> opens that case study straight away. */
'use strict';

const ARROW_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const CHEVRON_PATH = 'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z';
const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 14.4 9.6 22.5 12 14.4 14.4 12 22.5 9.6 14.4 1.5 12 9.6 9.6Z" fill="currentColor"/></svg>';
const ICON_CODE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7 3 12l5 5"/><path d="m16 7 5 5-5 5"/><path d="m14 4-4 16"/></svg>';
const ICON_CHART = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>';
const ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

// Kept for the case-study renderer below.
const COLLAPSIBLE_SECTIONS = [];
const FOOTER_LINKS = [
  ['dashboard', 'Dashboard'],
  ['technicalFindings', 'Technical Findings'],
  ['nonTechnicalSummary', 'Summary'],
  ['notebookRepo', 'Notebook / Repo'],
  ['caseStudyPage', 'Full Case Study'],
];

// "Hiring for" quick picks. Rules, not lists, so new projects sort themselves.
const ROLES = {
  analyst: { label: 'Data Analyst', hint: 'Dashboards, BI and statistical analysis that answer a business question.', test: (p) => /Dashboard/.test(p.serviceType || '') || /Business Intelligence|Statistical|NLP/.test(p.projectType || '') },
  scientist: { label: 'Data Scientist', hint: 'Predictive models, classification and NLP, validated on held-out data.', test: (p) => /Model/.test(p.serviceType || '') || /Classification|NLP|AI/.test(p.projectType || '') },
  engineer: { label: 'Data Engineer', hint: 'Pipelines, entity resolution and tested, automated data flows.', test: (p) => /Pipeline/.test(p.projectType || '') || /Pipeline/.test(p.serviceType || '') || p.projectType === 'AI Application' },
};
const DATA_LABEL = { real: 'Real data', synthetic: 'Synthetic data', prototype: 'Prototype' };

// Filter state <-> URL parameter names.
const PARAMS = { role: 'role', query: 'q', industry: 'industry', projectType: 'type', serviceType: 'service', tool: 'tool', dataSource: 'data', yearFrom: 'from', yearTo: 'to', sort: 'sort' };
const state = { role: '', query: '', industry: '', projectType: '', serviceType: '', tool: '', dataSource: '', yearFrom: '', yearTo: '', sort: 'new' };
let allProjects = [];
let openId = null;

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// — URL —
function readStateFromURL() {
  const q = new URLSearchParams(window.location.search);
  for (const [key, name] of Object.entries(PARAMS)) {
    const v = q.get(name);
    if (v != null) state[key] = v;
  }
  if (state.role && !ROLES[state.role]) state.role = '';
  if (!['new', 'old', 'az'].includes(state.sort)) state.sort = 'new';
}

function buildURL(extra) {
  const q = new URLSearchParams();
  for (const [key, name] of Object.entries(PARAMS)) {
    const v = state[key];
    if (v && !(key === 'sort' && v === 'new')) q.set(name, v);
  }
  // Keep a theme picked via ?theme= on links people copy.
  const theme = new URLSearchParams(window.location.search).get('theme');
  if (theme) q.set('theme', theme);
  if (extra) for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const s = q.toString();
  return window.location.pathname + (s ? '?' + s : '') + window.location.hash;
}

function syncURL() {
  try { window.history.replaceState(null, '', buildURL(openId ? { project: openId } : null)); } catch (e) { /* file:// */ }
}

function absolute(url) {
  return new URL(url, window.location.href).href;
}

// — Filtering —
function matches(p, skip) {
  if (skip !== 'role' && state.role && !ROLES[state.role].test(p)) return false;
  if (state.yearFrom && (!p.year || p.year < Number(state.yearFrom))) return false;
  if (state.yearTo && (!p.year || p.year > Number(state.yearTo))) return false;
  if (state.industry && p.industry !== state.industry) return false;
  if (state.projectType && p.projectType !== state.projectType) return false;
  if (state.serviceType && p.serviceType !== state.serviceType) return false;
  if (state.dataSource && p.dataSource !== state.dataSource) return false;
  if (state.tool && !(p.tools || []).some((t) => t.toLowerCase() === state.tool)) return false;
  if (state.query) {
    const hay = [p.title, p.cardDescription, p.industry, p.projectType, p.serviceType, (p.tools || []).join(' ')].join(' ').toLowerCase();
    if (!hay.includes(state.query.trim().toLowerCase())) return false;
  }
  return true;
}

function sorted(list) {
  const out = [...list];
  if (state.sort === 'az') out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  else if (state.sort === 'old') out.sort((a, b) => (a.year || 0) - (b.year || 0));
  else out.sort((a, b) => (b.year || 0) - (a.year || 0));
  return out;
}

function activeFilters() {
  const chips = [];
  if (state.role) chips.push(['Role: ' + ROLES[state.role].label, () => { state.role = ''; }]);
  if (state.query.trim()) chips.push(['“' + state.query.trim() + '”', () => { state.query = ''; }]);
  if (state.yearFrom || state.yearTo) chips.push([(state.yearFrom || 'Any') + ' – ' + (state.yearTo || 'Any'), () => { state.yearFrom = ''; state.yearTo = ''; }]);
  if (state.industry) chips.push([state.industry, () => { state.industry = ''; }]);
  if (state.projectType) chips.push([state.projectType, () => { state.projectType = ''; }]);
  if (state.serviceType) chips.push([state.serviceType, () => { state.serviceType = ''; }]);
  if (state.tool) chips.push([toolLabel(state.tool), () => { state.tool = ''; }]);
  if (state.dataSource) chips.push([DATA_LABEL[state.dataSource] || state.dataSource, () => { state.dataSource = ''; }]);
  return chips;
}

function clearAll() {
  Object.assign(state, { role: '', query: '', industry: '', projectType: '', serviceType: '', tool: '', dataSource: '', yearFrom: '', yearTo: '' });
  render();
}

// — Controls —
let toolNames = new Map();
function toolLabel(key) { return toolNames.get(key) || key; }

function fillSelect(select, options, value, allLabel) {
  select.replaceChildren(new Option(allLabel, ''));
  for (const [v, label] of options) select.append(new Option(label, v));
  select.value = options.some(([v]) => v === value) ? value : '';
}

function countBy(fn) {
  const m = new Map();
  for (const p of allProjects) for (const v of [].concat(fn(p))) if (v) m.set(v, (m.get(v) || 0) + 1);
  return m;
}

function initControls() {
  const byLabel = (m, labeler) => [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([v, n]) => [v, (labeler ? labeler(v) : v) + ' (' + n + ')']);
  fillSelect($('f-industry'), byLabel(countBy((p) => p.industry)), state.industry, 'All industries');
  fillSelect($('f-ptype'), byLabel(countBy((p) => p.projectType)), state.projectType, 'All project types');
  fillSelect($('f-stype'), byLabel(countBy((p) => p.serviceType)), state.serviceType, 'All service types');
  fillSelect($('f-data'), byLabel(countBy((p) => p.dataSource), (v) => DATA_LABEL[v] || v), state.dataSource, 'Any data source');

  const tools = new Map();
  for (const p of allProjects) for (const t of p.tools || []) {
    const k = t.toLowerCase();
    if (!toolNames.has(k)) toolNames.set(k, t);
    tools.set(k, (tools.get(k) || 0) + 1);
  }
  const toolOpts = [...tools.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => [k, toolLabel(k) + ' (' + n + ')']);
  fillSelect($('f-tool'), toolOpts, state.tool, 'All tools');

  const years = allProjects.map((p) => p.year).filter(Boolean);
  const min = Math.min(...years);
  const max = Math.max(...years, new Date().getFullYear());
  const list = [];
  for (let y = min; y <= max; y++) list.push([String(y), String(y)]);
  fillSelect($('f-from'), list, state.yearFrom, 'Any');
  fillSelect($('f-to'), [...list].reverse(), state.yearTo, 'Any');
  $('f-search').value = state.query;
  $('f-sort').value = state.sort;

  const bind = (id, key, evt) => $(id).addEventListener(evt || 'change', (e) => { state[key] = e.target.value; render(); });
  bind('f-industry', 'industry'); bind('f-ptype', 'projectType'); bind('f-stype', 'serviceType');
  bind('f-tool', 'tool'); bind('f-data', 'dataSource'); bind('f-from', 'yearFrom'); bind('f-to', 'yearTo');
  bind('f-sort', 'sort'); bind('f-search', 'query', 'input');
  $('f-clear').addEventListener('click', clearAll);
  $('p-empty-clear').addEventListener('click', clearAll);
  $('p-copy-view').addEventListener('click', () => copyLink(absolute(buildURL()), $('p-copy-view')));

  $('p-total').textContent = allProjects.length; $('p-total-2').textContent = allProjects.length;
  $('p-industries').textContent = countBy((p) => p.industry).size;
  $('p-real').textContent = allProjects.filter((p) => p.dataSource === 'real').length;
}

function syncControls() {
  const set = (id, v) => { if ($(id).value !== v) $(id).value = v; };
  set('f-industry', state.industry); set('f-ptype', state.projectType); set('f-stype', state.serviceType);
  set('f-tool', state.tool); set('f-data', state.dataSource); set('f-from', state.yearFrom); set('f-to', state.yearTo);
  set('f-sort', state.sort);
  if (document.activeElement !== $('f-search')) $('f-search').value = state.query;
}

function copyLink(url, button) {
  const label = button.querySelector('.label') || button;
  const original = label.dataset.original || label.textContent;
  label.dataset.original = original;
  const done = (text) => { label.textContent = text; setTimeout(() => { label.textContent = original; }, 2000); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => done('Link copied'), () => done('Copy the address bar'));
  } else {
    done('Copy the address bar');
  }
}

// — Rendering —
function renderRoles() {
  const host = $('p-roles');
  host.replaceChildren();
  const make = (id, label, count) => {
    const b = el('button', 'p-role');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(state.role === id));
    b.append(el('span', 'p-role-label', label), el('span', 'p-role-count', String(count)));
    b.addEventListener('click', () => { state.role = id; render(); });
    host.append(b);
  };
  make('', 'All roles', allProjects.length);
  for (const [id, r] of Object.entries(ROLES)) make(id, r.label, allProjects.filter(r.test).length);
  $('p-role-hint').textContent = state.role ? ROLES[state.role].hint : 'Pick a role to see the projects that fit it best.';
}

function badge(source) {
  const b = el('span', 'p-badge p-badge-' + (source || 'unknown'), DATA_LABEL[source] || 'Data source not set');
  return b;
}

function renderCard(p) {
  const card = el('article', 'p-card');
  card.append(el('div', 'p-card-bar'));

  const media = el('div', 'p-card-media');
  if (p.image) {
    const img = new Image();
    img.src = p.image;
    img.alt = 'Preview of ' + (p.title || 'project');
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    media.append(img);
  }
  media.append(badge(p.dataSource));
  card.append(media);

  const metric = el('div', 'p-card-metric');
  const meta = el('div', 'p-card-meta');
  meta.append(el('span', null, p.industry || ''), el('span', null, p.year ? String(p.year) : ''));
  metric.append(meta);
  if (p.headlineMetric) {
    metric.append(el('strong', null, p.headlineMetric.value), el('span', 'p-card-metric-label', p.headlineMetric.label));
  }
  card.append(metric);

  const body = el('div', 'p-card-body');
  if (p.projectType) body.append(el('p', 'p-card-type', p.projectType));
  const h = el('h2');
  const a = el('a', null, p.title || 'Untitled project');
  a.href = 'projects.html?project=' + encodeURIComponent(p.id);
  a.addEventListener('click', (e) => { e.preventDefault(); openProjectModal(p); });
  h.append(a);
  body.append(h);
  if (p.cardDescription) body.append(el('p', 'p-card-desc', p.cardDescription));

  const tags = el('ul', 'p-tags');
  tags.setAttribute('aria-label', 'Tools');
  for (const t of (p.tools || []).slice(0, 3)) tags.append(el('li', null, t));
  body.append(tags);

  const actions = el('div', 'p-card-actions');
  const open = el('button', 'p-btn p-btn-cta', 'Open case study →');
  open.type = 'button';
  open.addEventListener('click', () => openProjectModal(p));
  actions.append(open);
  const quick = el('div', 'p-quick');
  const links = p.links || {};
  const quickLink = (href, icon, text, title) => {
    const q = el('a', 'p-quick-link');
    q.href = href; q.target = '_blank'; q.rel = 'noopener noreferrer';
    q.setAttribute('aria-label', text + ' for ' + (p.title || 'this project') + ' (opens in a new tab)');
    q.innerHTML = icon;
    q.append(el('span', null, text));
    q.title = title;
    quick.append(q);
  };
  if (links.notebookRepo) quickLink(links.notebookRepo, ICON_CODE, 'Repo', 'Code repository');
  if (links.dashboard) quickLink(links.dashboard, ICON_CHART, 'Dashboard', 'Dashboard');
  actions.append(quick);
  body.append(actions);
  card.append(body);
  return card;
}

function render() {
  const list = sorted(allProjects.filter((p) => matches(p)));
  renderRoles();
  syncControls();

  const grid = $('p-grid');
  grid.replaceChildren(...list.map(renderCard));
  $('p-shown').textContent = list.length;
  $('p-empty').hidden = list.length > 0;

  const chips = activeFilters();
  const chipHost = $('p-chips');
  chipHost.replaceChildren();
  for (const [label, remove] of chips) {
    const b = el('button', 'p-chip');
    b.type = 'button';
    b.setAttribute('aria-label', 'Remove filter ' + label);
    b.append(el('span', null, label), el('span', null, '✕'));
    b.lastChild.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', () => { remove(); render(); });
    chipHost.append(b);
  }
  chipHost.hidden = chips.length === 0;
  $('f-active').textContent = chips.length ? chips.length + ' active' : 'None active';
  $('f-clear').classList.toggle('is-active', chips.length > 0);
  syncURL();
}

// — Case-study renderer (unchanged) —

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

// — Case-study pop-up —
const MODAL_LINKS = [
  ['notebookRepo', 'Notebook / Repo'],
  ['dashboard', 'Dashboard'],
  ['technicalFindings', 'Technical report'],
  ['caseStudyPage', 'Full case study'],
];
let lastFocus = null;

function renderModalIntro(project) {
  const intro = el('div', 'p-modal-intro');

  const badges = el('div', 'p-modal-badges');
  badges.append(badge(project.dataSource));
  for (const v of [project.industry, project.projectType, project.year]) if (v) badges.append(el('span', 'p-chip p-chip-static', String(v)));
  intro.append(badges);

  const links = project.links || {};
  const row = el('div', 'p-modal-links');
  MODAL_LINKS.filter(([k]) => links[k]).forEach(([k, label], i) => {
    const a = el('a', 'p-btn ' + (i === 0 ? 'p-btn-cta' : 'p-btn-ghost'), label + ' →');
    a.href = links[k]; a.target = '_blank'; a.rel = 'noopener noreferrer';
    row.append(a);
  });
  const copy = el('button', 'p-btn p-btn-dashed');
  copy.type = 'button';
  copy.innerHTML = ICON_LINK;
  copy.append(el('span', 'label', 'Copy link to this case study'));
  copy.addEventListener('click', () => copyLink(absolute('projects.html?project=' + encodeURIComponent(project.id)), copy));
  row.append(copy);
  intro.append(row);

  if (project.image) {
    const img = new Image();
    img.src = project.image;
    img.alt = 'Preview of ' + (project.title || 'project');
    img.className = 'p-modal-image';
    img.addEventListener('error', () => img.remove());
    intro.append(img);
  }
  if (project.headlineMetric) {
    const band = el('div', 'p-modal-metric');
    band.append(el('strong', null, project.headlineMetric.value), el('p', null, project.impactStat || project.headlineMetric.label));
    intro.append(band);
  }
  return intro;
}

function openProjectModal(project) {
  lastFocus = document.activeElement;
  openId = project.id;
  $('proj-title').textContent = project.title || 'Untitled project';
  $('proj-role').textContent = project.targetIndustryRole || 'Case study';
  $('proj-onesentence').textContent = project.oneSentenceDescription || '';
  $('proj-onesentence').hidden = !project.oneSentenceDescription;
  renderProjectBody(project);
  $('proj-body').prepend(renderModalIntro(project));
  $('proj-backdrop').classList.add('open');
  $('proj-dialog').scrollTop = 0;
  document.body.style.overflow = 'hidden';
  $('proj-close').focus();
  syncURL();
}

function closeProjectModal() {
  $('proj-backdrop').classList.remove('open');
  document.body.style.overflow = '';
  openId = null;
  syncURL();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

function initProjectModal() {
  const backdrop = $('proj-backdrop');
  $('proj-close').addEventListener('click', closeProjectModal);
  $('proj-download').addEventListener('click', () => {
    const originalTitle = document.title;
    document.title = $('proj-title').textContent || originalTitle;
    const restoreTitle = () => { document.title = originalTitle; window.removeEventListener('afterprint', restoreTitle); };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  });
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeProjectModal(); });
  document.addEventListener('keydown', (e) => {
    if (!backdrop.classList.contains('open')) return;
    if (e.key === 'Escape') { closeProjectModal(); return; }
    if (e.key === 'Tab') {
      // Keep keyboard focus inside the pop-up while it's open.
      const focusables = $('proj-dialog').querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

// — Init —
async function init() {
  initProjectModal();
  readStateFromURL();
  // Read before the first render, which rewrites the address bar.
  const wantedId = new URLSearchParams(window.location.search).get('project');

  let projects;
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    projects = data.projects || [];
  } catch (err) {
    $('proj-load-error').hidden = false;
    return;
  }
  if (projects.length === 0) {
    $('proj-load-empty').hidden = false;
    return;
  }

  allProjects = projects;
  initControls();
  render();

  // projects.html?project=<id> opens that case study (links from the home page and resume).
  const project = wantedId && allProjects.find((p) => p.id === wantedId);
  if (project) openProjectModal(project);
}

init();
