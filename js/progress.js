const GOAL_STATUS_STYLE = {
  "In progress": "tag-outline",
  "Done": "tag-accent",
  "Not started": "tag-neutral",
};
const DEFAULT_GOAL_STYLE = "tag-neutral";

const CHEVRON_PATH = "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z";

function renderGoals(goals) {
  const grid = document.getElementById("goal-grid");
  for (const goal of goals) {
    const card = document.createElement("div");
    card.className = "card goal-card";

    const head = document.createElement("div");
    head.className = "goal-card-head";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = goal.title;

    const tag = document.createElement("span");
    tag.className = `tag ${GOAL_STATUS_STYLE[goal.status] || DEFAULT_GOAL_STYLE}`;
    tag.textContent = goal.status;

    head.append(title, tag);

    const body = document.createElement("p");
    body.className = "card-body";
    body.textContent = goal.description;

    card.append(head, body);
    grid.append(card);
  }
}

function renderMonthlyLog(entries) {
  const container = document.getElementById("monthly-log");
  for (const item of entries) {
    const group = document.createElement("div");
    group.className = "month-group";

    const label = document.createElement("div");
    label.className = "month-label";
    label.textContent = `${item.month} ${item.year}`;

    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = item.entry;

    group.append(label, entry);
    container.append(group);
  }
}

function renderPastYears(years) {
  const container = document.getElementById("past-years");
  for (const y of years) {
    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.className = "year-row";

    const left = document.createElement("span");
    left.className = "year-row-left";

    const num = document.createElement("span");
    num.className = "year-num";
    num.textContent = String(y.year);

    const summaryText = document.createElement("span");
    summaryText.className = "year-summary";
    summaryText.textContent = y.summary;

    left.append(num, summaryText);

    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("class", "year-chevron");
    chevron.setAttribute("width", "14");
    chevron.setAttribute("height", "14");
    chevron.setAttribute("viewBox", "0 0 256 256");
    chevron.setAttribute("fill", "currentColor");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", CHEVRON_PATH);
    chevron.append(path);

    summary.append(left, chevron);

    const detailText = document.createElement("div");
    detailText.className = "year-detail";
    detailText.textContent = y.details;

    details.append(summary, detailText);
    container.append(details);
  }
}

renderGoals(PROGRESS_DATA.goals);
renderMonthlyLog(PROGRESS_DATA.monthlyLog);
renderPastYears(PROGRESS_DATA.pastYears);
