const STATUS_STYLE = {
  Applied: { tagClass: 'tag-outline', dot: 'var(--color-accent)' },
  Interviewing: { tagClass: 'tag-interviewing', dot: 'var(--color-accent-2)' },
  Offer: { tagClass: 'tag-accent', dot: 'var(--color-accent-300)' },
  Rejected: { tagClass: 'tag-neutral', dot: 'var(--color-neutral-600)' },
  Withdrawn: { tagClass: 'tag-neutral', dot: 'var(--color-neutral-500)' },
};
const DEFAULT_STATUS_STYLE = { tagClass: 'tag-neutral', dot: 'var(--color-neutral-400)' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(isoDate) {
  if (!isoDate) return 'unknown date';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function computeStats(entries) {
  return {
    total: entries.length,
    interviewing: entries.filter((e) => e.status === 'Interviewing').length,
    rejected: entries.filter((e) => e.status === 'Rejected').length,
    withdrawn: entries.filter((e) => e.status === 'Withdrawn').length,
    active: entries.filter((e) => e.status === 'Applied').length,
  };
}

function renderStats(stats) {
  const grid = document.getElementById('stats-grid');
  const tiles = [
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
  const div = document.createElement('div');
  div.className = 'card-meta';
  div.textContent = parts.filter(Boolean).join(' · ');
  return div;
}

function renderEntry(entry) {
  const style = STATUS_STYLE[entry.status] || DEFAULT_STATUS_STYLE;

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
  titleBlock.append(title, metaLine([entry.company, entry.location]));

  const tag = document.createElement('span');
  tag.className = `tag ${style.tagClass}`;
  tag.style.flex = 'none';
  tag.textContent = entry.status || 'Unknown';

  head.append(titleBlock, tag);
  card.append(head);
  card.append(metaLine([`Applied ${formatDate(entry.date_applied)}`, entry.stage ? `Stage: ${entry.stage}` : null]));

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

async function init() {
  initQAModal();

  const timeline = document.getElementById('timeline');
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

  renderStats(computeStats(entries));

  if (entries.length === 0) {
    emptyMsg.style.display = '';
    return;
  }

  const sorted = [...entries].sort((a, b) => (b.date_applied || '').localeCompare(a.date_applied || ''));
  for (const entry of sorted) {
    timeline.append(renderEntry(entry));
  }
}

init();
