'use strict';
(() => {
const $ = id => document.getElementById(id);
const form = $('task-form'), key = 'eileen-todo-draft-v1';
let data = {version:1,tasks:[]}, handle = null, baseline = '', editing = null, dirty = false;
const owners = ['Unassigned','Eileen','Codex','Claude'], statuses = ['To do','In progress','Blocked','Review','Done'];

const goals = [
 {id:'internship',title:'Secure an internship',description:'Applications, interviews and an offer.'},
 {id:'bsan',title:'Complete BSAN4201',description:'Individual assignment · Due 12 October 2026'},
 {id:'website',title:'Improve my website',description:'Polish completed work and prepare recruiter outreach.'},
 {id:'projects',title:'Build portfolio projects',description:'Five project ideas to develop alongside priority work.'},
 {id:'course',title:'Complete my internship course',description:'Placement and course completion.'},
 {id:'other',title:'Other tasks',description:'Tasks to organise.'}
];
function goalFor(t) {
 if (goals.some(g => g.id === t.goal)) return t.goal;
 const id = t.id.replace('plan-20260908-','');
 if (/^(tiktok-|adn-|applications-|internship-)/.test(id)) return 'internship';
 if (id.startsWith('bsan-')) return 'bsan';
 if (/^(website-|recruiters$)/.test(id)) return 'website';
 if (id.startsWith('project-')) return 'projects';
 if (id.startsWith('course-')) return 'course';
 return 'other';
}
for (const g of goals) { const option = document.createElement('option'); option.value = g.id; option.textContent = g.title; form.elements.namedItem('goal').append(option); }
form.elements.namedItem('goal').value = 'other';

function validate(value) {
 if (!value || value.version !== 1 || !Array.isArray(value.tasks)) throw Error('Expected a version 1 task file.');
 const ids = new Set();
 for (const t of value.tasks) {
  if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || typeof t.title !== 'string' || !t.title.trim() || !owners.includes(t.owner) || !statuses.includes(t.status) || !['Normal','High','Low'].includes(t.priority) || ['due','details','handoff','updatedAt'].some(k => typeof t[k] !== 'string')) throw Error('Invalid task fields or duplicate task IDs.');
  ids.add(t.id);
 }
 if (value.activity !== undefined && (!Array.isArray(value.activity) || value.activity.some(e => !e || ["id","taskId","title","actor","at","action","notes"].some(k => typeof e[k] !== "string")))) throw Error("Invalid activity history.");
 return value;
}

function recordActivity(action, before, after, notes = '') {
 const task = after || before;
 (data.activity ||= []).push({id:crypto.randomUUID(),taskId:task.id,title:task.title,actor:$('actor').value,at:new Date().toISOString(),action,notes,before:before ? structuredClone(before) : null,after:after ? structuredClone(after) : null});
}
function renderHistory(container, taskId) {
 container.replaceChildren();
 const entries = (data.activity || []).filter(e => !taskId || e.taskId === taskId).slice().reverse();
 if (!entries.length) { const p = document.createElement('p'); p.textContent = 'No recorded changes yet. Earlier work has not been reconstructed.'; container.append(p); }
 for (const e of entries) {
  const item = document.createElement('article'); item.className = 'activity-entry';
  const heading = document.createElement('p'); heading.textContent = e.title + ' · ' + e.action;
  const meta = document.createElement('p'); meta.className = 'todo-meta'; const date = new Date(e.at); meta.textContent = e.actor + ' · ' + (Number.isNaN(date.getTime()) ? e.at : date.toLocaleString());
  item.append(heading,meta);
  if (e.before && e.after) for (const field of ['title','goal','owner','status','priority','due','details','handoff']) {
   const previous = e.before[field] || '', next = e.after[field] || '';
   if (previous !== next) { const p = document.createElement('p'); p.textContent = field + ': ' + (previous || '(empty)') + ' → ' + (next || '(empty)'); item.append(p); }
  }
  if(e.notes) { const p=document.createElement('p');p.textContent=e.notes;item.append(p); }
  if(e.action === 'Deleted' && e.before) { const p=document.createElement('p');p.textContent='Last status: '+e.before.status+' · Owner: '+e.before.owner+'\n'+e.before.details+'\n'+e.before.handoff;item.append(p); }
  container.append(item);
 }
}

function notice(text) { $('notice').textContent = text; }
function cache() { dirty = true; try { localStorage.setItem(key, JSON.stringify(data)); notice('Draft saved in this browser. Save the shared file to share changes.'); } catch { notice('Browser storage unavailable. Save the shared file or download JSON before leaving.'); } }
function clearDraft() { dirty = false; try { localStorage.removeItem(key); } catch {} }
function reset() { editing = null; form.reset(); form.elements.namedItem('goal').value = 'other'; $('editor-title').textContent = 'Add a task'; $('cancel').hidden = true; }
function render() {
 const query = $('search').value.toLowerCase(), owner = $('owner-filter').value, status = $('status-filter').value;
 const visible = data.tasks.filter(t => (!owner || t.owner === owner) && (!status || t.status === status) && [t.title,t.details,t.handoff].join(' ').toLowerCase().includes(query));
 $('summary').textContent = visible.length + ' of ' + data.tasks.length + ' tasks · ' + data.tasks.filter(t => t.status === 'Done').length + ' complete';
 const expanded = new Set(Array.from($('tasks').querySelectorAll('details[open]')).map(el => el.dataset.goal));
 renderHistory($('activity-list'));
 $('tasks').replaceChildren();
 const groups = new Map();
 for (const g of goals) {
  const all = data.tasks.filter(t => goalFor(t) === g.id);
  const matched = visible.filter(t => goalFor(t) === g.id);
  if (!matched.length) continue;
  const group = document.createElement('details'); group.className = 'goal-group'; group.dataset.goal = g.id;
  group.open = expanded.has(g.id) || Boolean(query || owner || status);
  const heading = document.createElement('summary');
  const name = document.createElement('span'); name.className = 'goal-title'; name.textContent = g.title;
  const description = document.createElement('span'); description.className = 'goal-description'; description.textContent = g.description;
  const done = all.filter(t => t.status === 'Done').length;
  const count = document.createElement('span'); count.className = 'goal-count'; count.textContent = done + ' of ' + all.length + ' tasks complete' + ((query || owner || status) ? ' · ' + matched.length + ' matching' : '');
  const progress = document.createElement('progress'); progress.max = all.length; progress.value = done; progress.setAttribute('aria-label',g.title + ' progress');
  heading.append(name,description,count,progress); group.append(heading);
  const list = document.createElement('div'); list.className = 'goal-tasks'; group.append(list); groups.set(g.id,list); $('tasks').append(group);
 }

 if (!visible.length) { const p = document.createElement('p'); p.textContent = data.tasks.length ? 'No tasks match these filters.' : 'Your next step starts here. Open Add a task to begin.'; $('tasks').append(p); }
 for (const t of visible) {
  const card = document.createElement('article'); card.className = 'todo-card';
  const title = document.createElement('h3'); title.textContent = t.title;
  const meta = document.createElement('p'); meta.className = 'todo-meta'; meta.textContent = [t.status,t.owner,t.priority + ' priority',t.due ? 'Due ' + t.due : ''].filter(Boolean).join(' · ');
  card.append(title,meta);
  for (const [label,text] of [['Details',t.details],['Handoff',t.handoff]]) if (text) { const p = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = label + ': '; p.append(strong,document.createTextNode(text)); card.append(p); }
  const actions = document.createElement('div'); actions.className = 'todo-toolbar';
  const edit = document.createElement('button'); edit.className = 'btn btn-secondary'; edit.textContent = 'Edit task'; edit.onclick = () => { form.elements.namedItem('updateNotes').value = ''; editing = t.id; $('task-editor').open = true; form.elements.namedItem('goal').value = goalFor(t); for (const field of ['title','owner','status','priority','due','details','handoff']) form.elements.namedItem(field).value = t[field]; $('editor-title').textContent = 'Edit task'; $('cancel').hidden = false; form.elements.namedItem('title').focus(); };
  const remove = document.createElement('button'); remove.className = 'btn btn-secondary'; remove.textContent = 'Delete'; remove.onclick = () => { if (!confirm('Delete this task: ' + t.title + '?')) return; recordActivity('Deleted',t,null,'Task removed from the active list; its previous state is retained here.'); data.tasks = data.tasks.filter(x => x.id !== t.id); if (editing === t.id) reset(); cache(); render(); };
  const history=document.createElement('details');const label=document.createElement('summary');label.textContent='Task history';const entries=document.createElement('div');renderHistory(entries,t.id);history.append(label,entries);card.append(history); actions.append(edit,remove); card.append(actions); groups.get(goalFor(t)).append(card);
 }
}
form.onsubmit = event => {
 event.preventDefault(); const fields = Object.fromEntries(new FormData(form));
 const notes = fields.updateNotes.trim(); delete fields.updateNotes;
 fields.title = fields.title.trim(); if (!fields.title) return;
 const before = data.tasks.find(t => t.id === editing);
 const task = {...before,...fields,id:editing || crypto.randomUUID(),updatedAt:new Date().toISOString()};
 const changed = !before || Object.keys(fields).some(k => fields[k] !== (before[k] || (k === 'goal' ? goalFor(before) : '')));
 if (!changed && !notes) { notice('No changes to save.'); return; }
 recordActivity(before ? 'Updated' : 'Created',before,task,notes);
 if (editing) data.tasks = data.tasks.map(t => t.id === editing ? task : t); else data.tasks.push(task);
 cache(); reset(); render();
};
$('cancel').onclick = reset;
for (const id of ['search','owner-filter','status-filter']) $(id).addEventListener('input',render);
const discard = () => !dirty || confirm('Replace your browser draft with the shared file? Download it first if you need a copy.');
$('connect').onclick = async () => { if (!window.showOpenFilePicker) { notice('File connection is unavailable in this browser. Use Import JSON and Download JSON.'); return; } if (!discard()) return; try { const [next] = await showOpenFilePicker({multiple:false,types:[{description:'Task JSON',accept:{'application/json':['.json']}}]}); const text = await (await next.getFile()).text(); const parsed = validate(JSON.parse(text)); handle = next; baseline = text; data = parsed; clearDraft(); reset(); render(); $('save').disabled = false; notice('Connected to ' + handle.name + '. Changes remain drafts until you save the shared file.'); } catch(e) { if(e.name !== 'AbortError') notice('Could not connect: ' + e.message); } };
$('save').onclick = async () => { if (!handle) return; try { const latest = await (await handle.getFile()).text(); if (latest !== baseline) throw Error('The shared file changed. Download your draft, then reload and reconcile the changes before saving.'); const text = JSON.stringify(data,null,2) + '\n'; const stream = await handle.createWritable(); await stream.write(text); await stream.close(); baseline = text; clearDraft(); notice('Saved to the shared file. Codex and Claude can now read these tasks.'); } catch(e) { notice('Not saved: ' + e.message); } };
async function readShared() { if (handle) return (await handle.getFile()).text(); const response = await fetch('data/tasks.json',{cache:'no-store'}); if (!response.ok) throw Error('Shared tasks could not be loaded.'); return response.text(); }
$('reload').onclick = async () => { if (!discard()) return; try { const text = await readShared(); data = validate(JSON.parse(text)); baseline = text; clearDraft(); reset(); render(); notice('Shared tasks reloaded.'); } catch(e) { notice(e.message); } };
$('download').onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2) + '\n'],{type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'tasks.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); notice('Downloaded tasks.json. Replace data/tasks.json in the project folder to share it.'); };
$('import').onchange = async event => { const file = event.target.files[0]; if (!file) return; try { const parsed = validate(JSON.parse(await file.text())); if (!discard()) return; data = parsed; cache(); reset(); render(); } catch(e) { notice('Import failed: ' + e.message); } finally { event.target.value = ''; } };
window.addEventListener('beforeunload',event => { if(dirty) { event.preventDefault(); event.returnValue = ''; } });
(async () => { try { const draft = localStorage.getItem(key); if (draft) { data = validate(JSON.parse(draft)); dirty = true; notice('Restored browser draft. Save or download it to share with your assistants.'); render(); return; } } catch { notice('Could not restore browser draft.'); } try { baseline = await readShared(); data = validate(JSON.parse(baseline)); notice('Shared tasks loaded. Edits are browser drafts until saved to the shared file.'); } catch(e) { notice(e.message + ' Connect or import tasks.json, or add tasks here.'); } render(); })();
})();