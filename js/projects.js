const ARROW_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const CHEVRON_PATH = 'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z';

// Long-text sections shown collapsed in the modal, in display order.
const COLLAPSIBLE_SECTIONS = [
  ['problemSpace', 'Problem Space'],
  ['discovery', 'Discovery'],
  ['execution', 'Execution'],
  ['results', 'Results'],
  ['recommendations', 'Recommendations'],
];

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
const excludedFilters = { industry: new Set(), projectType: new Set(), serviceType: new Set(), tools: new Set() };
let yearFrom = '';
let yearTo = '';

function buildFilterOptions(projects) {
  return {
    industry: [...new Set(projects.map((p) => p.industry).filter(Boolean))].sort(),
    projectType: [...new Set(projects.map((p) => p.projectType).filter(Boolean))].sort(),
    serviceType: [...new Set(projects.map((p) => p.serviceType).filter(Boolean))].sort(),
    tools: [...new Set(projects.flatMap((p) => p.tools || []))].sort(),
  };
}

function projectMatchesFilters(p) {
  if (yearFrom && (!p.year || p.year < Number(yearFrom))) return false;
  if (yearTo && (!p.year || p.year > Number(yearTo))) return false;

  for (const key of ['industry', 'projectType', 'serviceType']) {
    const val = p[key];
    if (excludedFilters[key].has(val)) return false;
    if (activeFilters[key].size && !activeFilters[key].has(val)) return false;
  }

  const tools = p.tools || [];
  if (tools.some((t) => excludedFilters.tools.has(t))) return false;
  if (activeFilters.tools.size && !tools.some((t) => activeFilters.tools.has(t))) return false;

  return true;
}

// No sort order was specified for this page — defaulting to newest year first.
function sortProjects(projects) {
  return [...projects].sort((a, b) => (b.year || 0) - (a.year || 0));
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
  if (key === 'yearFrom') { yearFrom = ''; document.getElementById('f-year-from').value = ''; }
  else if (key === 'yearTo') { yearTo = ''; document.getElementById('f-year-to').value = ''; }
  else if (key.endsWith('-exclude')) { excludedFilters[key.slice(0, -'-exclude'.length)].delete(value); }
  else { activeFilters[key].delete(value); }
  syncFilterPillStates();
  renderGridView();
}

function clearAllFilters() {
  for (const key of FILTER_KEYS) {
    activeFilters[key].clear();
    excludedFilters[key].clear();
  }
  yearFrom = '';
  yearTo = '';
  document.getElementById('f-year-from').value = '';
  document.getElementById('f-year-to').value = '';
  syncFilterPillStates();
  renderGridView();
}

function renderFilterGroups(options) {
  const container = document.getElementById('filter-groups');
  container.replaceChildren();
  const groups = [
    ['Industry', 'industry', options.industry],
    ['Project Type', 'projectType', options.projectType],
    ['Service Type', 'serviceType', options.serviceType],
    ['Tools', 'tools', options.tools],
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
  if (yearFrom) chips.push({ key: 'yearFrom', label: `From ${yearFrom}` });
  if (yearTo) chips.push({ key: 'yearTo', label: `To ${yearTo}` });
  for (const key of FILTER_KEYS) {
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
  if (project.year) {
    const year = document.createElement('span');
    year.className = 'project-year';
    year.textContent = project.year;
    head.append(year);
  }
  body.append(head);

  const tags = document.createElement('ul');
  tags.className = 'project-tags';
  const tagSpecs = [
    [project.projectType, 'tag-accent'],
    [project.industry, 'tag-accent-2'],
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
  document.getElementById('f-year-from').addEventListener('change', (e) => {
    yearFrom = e.target.value;
    renderGridView();
  });
  document.getElementById('f-year-to').addEventListener('change', (e) => {
    yearTo = e.target.value;
    renderGridView();
  });
  document.getElementById('proj-empty-clear').addEventListener('click', clearAllFilters);
}

// — Case study modal —

function appendCollapsible(container, label, text) {
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
  container.append(details);
}

function renderInputsList(inputs) {
  const fields = [
    ['primarySource', 'Primary source'],
    ['size', 'Size'],
    ['format', 'Format'],
    ['collectionMethod', 'Collection method'],
    ['targetVariable', 'Target variable'],
    ['keyPredictors', 'Key predictors'],
  ];
  const present = fields.filter(([key]) => inputs[key]);
  if (present.length === 0) return null;

  const dl = document.createElement('dl');
  dl.className = 'proj-dl';
  for (const [key, label] of present) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = inputs[key];
    dl.append(dt, dd);
  }
  return dl;
}

function renderVisualsGrid(visuals) {
  if (!visuals || visuals.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'viz-grid';
  for (const visual of visuals) {
    const card = document.createElement('div');
    card.className = 'viz-card';

    // SVG markup is authored data from this site's own projects.json, not
    // third-party input — safe to insert directly, and far simpler than
    // rebuilding each chart's shapes via createElementNS.
    const svgWrap = document.createElement('div');
    svgWrap.innerHTML = visual.svg || '';
    card.append(svgWrap.firstElementChild || svgWrap);

    if (visual.caption) {
      const caption = document.createElement('div');
      caption.className = 'viz-caption';
      caption.textContent = visual.caption;
      card.append(caption);
    }

    grid.append(card);
  }
  return grid;
}

function renderProjectBody(project) {
  const body = document.getElementById('proj-body');
  body.replaceChildren();

  if (project.summaryImpact) {
    const p = document.createElement('p');
    p.className = 'dialog-body-text';
    p.textContent = project.summaryImpact;
    body.append(p);
  }

  const visualsGrid = renderVisualsGrid(project.visuals);
  if (visualsGrid) body.append(visualsGrid);

  if (project.inputs) {
    const inputsList = renderInputsList(project.inputs);
    if (inputsList) {
      const wrap = document.createElement('div');
      wrap.style.margin = 'var(--space-3) 0';
      const label = document.createElement('div');
      label.className = 'label-xs';
      label.style.marginBottom = '6px';
      label.textContent = 'Inputs';
      wrap.append(label, inputsList);
      body.append(wrap);
    }
  }

  const collapsibleWrap = document.createElement('div');
  for (const [key, label] of COLLAPSIBLE_SECTIONS) {
    appendCollapsible(collapsibleWrap, label, project[key]);
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
  renderFilterGroups(buildFilterOptions(allProjects));
  renderGridView();
}

init();
