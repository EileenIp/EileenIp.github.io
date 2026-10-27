/* Home page: keeps the hero numbers and the availability week in step with
   the data files, so nothing here needs editing by hand.
   - data/projects.json -> project, industry and tool counts
   - data/tasks.json    -> a weekday is busy when an unfinished task is due that day
   The HTML already holds sensible fallback text if either file can't load. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  var SLOTS = ['9:00–12:00', '1:00–5:00'];

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  // — Hero numbers —
  fetchJson('data/projects.json').then(function (data) {
    var projects = Array.isArray(data) ? data : (data.projects || []);
    if (!projects.length) return;
    var industries = new Set(projects.map(function (p) { return String(p.industry || '').toLowerCase(); }).filter(Boolean));
    var tools = new Set();
    projects.forEach(function (p) { (p.tools || []).forEach(function (t) { tools.add(String(t).toLowerCase()); }); });
    if ($('stat-projects')) $('stat-projects').textContent = projects.length;
    if ($('stat-industries')) $('stat-industries').textContent = industries.size;
    if ($('stat-tools')) $('stat-tools').textContent = tools.size;
    if ($('all-projects-count')) $('all-projects-count').textContent = 'All ' + projects.length + ' projects';
  }).catch(function () { /* keep the fallback numbers in the HTML */ });

  // — Availability: this week, Monday to Friday —
  function renderWeek(tasks) {
    var host = $('week');
    if (!host) return;
    var now = new Date();
    var today = iso(now);
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    var busyDays = new Set(tasks.filter(function (t) { return t.due && t.status !== 'Done'; }).map(function (t) { return t.due; }));

    host.replaceChildren();
    DAYS.forEach(function (name, i) {
      var d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      var ds = iso(d);
      var busy = busyDays.has(ds);
      var card = document.createElement('div');
      card.className = 'h-day' + (ds === today ? ' is-today' : '');
      var h = document.createElement('h3');
      h.textContent = name + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (ds === today ? ' · Today' : '');
      card.appendChild(h);
      SLOTS.forEach(function (time) {
        var slot = document.createElement('div');
        slot.className = 'h-slot ' + (busy ? 'is-busy' : 'is-free');
        if (busy) {
          slot.textContent = 'Busy · ' + time;
        } else {
          var b = document.createElement('b');
          b.textContent = 'Free';
          slot.appendChild(b);
          slot.appendChild(document.createTextNode(' · ' + time));
        }
        card.appendChild(slot);
      });
      host.appendChild(card);
    });
  }

  fetchJson('data/tasks.json').then(function (data) {
    renderWeek(Array.isArray(data.tasks) ? data.tasks : []);
  }).catch(function () { renderWeek([]); });
})();
