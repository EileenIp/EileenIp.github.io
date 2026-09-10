'use strict';
(() => {
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let today = new Date();
let todayStr = isoDate(today);
let view = { year: today.getFullYear(), month: today.getMonth() };
let followToday = true;
let tasks = [];

const tasksByDate = dateStr => tasks.filter(t => t.due === dateStr);

function taskLine(t) {
 const el = document.createElement('a');
 el.className = 'cal-task cal-task-' + t.status.toLowerCase().replace(/\s+/g, '-');
 el.href = 'todo.html';
 el.textContent = t.title;
 el.title = [t.status, t.owner, t.priority + ' priority'].join(' · ');
 return el;
}

function renderToday() {
 $('today-heading').textContent = 'Today — ' + today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
 const overdue = tasks.filter(t => t.due && t.due < todayStr && t.status !== 'Done');
 const due = tasksByDate(todayStr);

 const overdueBox = $('overdue-list');
 overdueBox.replaceChildren();
 if (overdue.length) {
  const h = document.createElement('h3'); h.textContent = 'Overdue (' + overdue.length + ')'; overdueBox.append(h);
  for (const t of overdue) { const p = document.createElement('p'); p.className = 'cal-overdue-item'; p.append(taskLine(t), document.createTextNode(' — was due ' + t.due)); overdueBox.append(p); }
 }

 const dueBox = $('today-list');
 dueBox.replaceChildren();
 const h = document.createElement('h3'); h.textContent = due.length ? 'Due today (' + due.length + ')' : 'Nothing due today'; dueBox.append(h);
 if (due.length) for (const t of due) { const p = document.createElement('p'); p.append(taskLine(t)); dueBox.append(p); }
 else { const p = document.createElement('p'); p.className = 'text-muted'; p.textContent = 'No tasks in the shared to-do list are due today.'; dueBox.append(p); }
}

function renderMonth() {
 $('cal-month-label').textContent = monthNames[view.month] + ' ' + view.year;
 const grid = $('calendar-grid');
 grid.replaceChildren();
 for (const d of dowNames) { const cell = document.createElement('div'); cell.className = 'cal-dow'; cell.textContent = d; grid.append(cell); }

 const startOffset = new Date(view.year, view.month, 1).getDay();
 const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
 const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

 for (let i = 0; i < totalCells; i++) {
  const dateObj = new Date(view.year, view.month, i - startOffset + 1);
  const other = dateObj.getMonth() !== view.month;
  const dateStr = isoDate(dateObj);
  const cell = document.createElement('div');
  cell.className = 'cal-cell' + (other ? ' cal-cell-other' : '') + (dateStr === todayStr ? ' cal-cell-today' : '');
  const num = document.createElement('div'); num.className = 'cal-daynum'; num.textContent = dateObj.getDate();
  cell.append(num);
  const dayTasks = tasksByDate(dateStr);
  for (const t of dayTasks.slice(0, 4)) cell.append(taskLine(t));
  if (dayTasks.length > 4) { const more = document.createElement('div'); more.className = 'cal-more'; more.textContent = '+' + (dayTasks.length - 4) + ' more'; cell.append(more); }
  grid.append(cell);
 }
}

$('cal-prev').onclick = () => { followToday = false; view.month--; if (view.month < 0) { view.month = 11; view.year--; } renderMonth(); };
$('cal-next').onclick = () => { followToday = false; view.month++; if (view.month > 11) { view.month = 0; view.year++; } renderMonth(); };
$('cal-today').onclick = () => { followToday = true; view = { year: today.getFullYear(), month: today.getMonth() }; renderMonth(); };

function checkForNewDay() {
 const now = new Date();
 const nowStr = isoDate(now);
 if (nowStr === todayStr) return;
 today = now;
 todayStr = nowStr;
 if (followToday) view = { year: today.getFullYear(), month: today.getMonth() };
 renderToday();
 renderMonth();
}
setInterval(checkForNewDay, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForNewDay(); });

(async () => {
 try {
  const response = await fetch('data/tasks.json', { cache: 'no-store' });
  if (!response.ok) throw Error('Could not load the shared to-do list.');
  const data = await response.json();
  tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const scheduled = tasks.filter(t => t.due).length;
  $('cal-notice').textContent = scheduled + ' task(s) with a due date · ' + (tasks.length - scheduled) + ' without one (set a due date on the To-do page to see it here).';
 } catch (e) {
  $('cal-notice').textContent = e.message + ' If you are viewing this file directly (file://), run it through a local server instead.';
 }
 renderToday();
 renderMonth();
})();
})();
