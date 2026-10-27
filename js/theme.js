/* Site theme: picks the theme before the page paints, remembers the
   visitor's choice, and adds the Theme dropdown to the nav.
   Load it in <head> (not deferred) so there's no flash of the wrong theme.
   A page can say where the dropdown goes with <div data-theme-switcher></div>;
   otherwise it's added to the end of the first .nav on the page. */
(function () {
  'use strict';

  var THEMES = [
    { id: 'love', label: 'Hi♪ Love Elf♥', icon: 'heart', color: '#FFFDFD' },
    { id: 'pink', label: 'Miss Pink Elf♪', icon: 'note', color: '#FFF5F8' },
    { id: 'ego', label: 'Herrscher of Human: Ego', icon: 'crystal', color: '#FDF9F7' }
  ];
  var DEFAULT_THEME = 'pink';
  var STORAGE_KEY = 'eileenip-theme';

  var ICONS = {
    heart: '<svg class="theme-icon theme-icon-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 4.2 13.4a5 5 0 0 1 7.1-7.1l.7.7.7-.7a5 5 0 0 1 7.1 7.1Z" fill="currentColor"/></svg>',
    note: '<svg class="theme-icon theme-icon-note" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/></svg>',
    crystal: '<svg class="theme-icon theme-icon-crystal" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 18 9 12 22.5 6 9Z" fill="currentColor"/><path d="M6 9h12" stroke="#FFFFFF" stroke-width="1.2"/></svg>'
  };
  var CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var TICK = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>';

  function find(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }

  // ?theme=love|pink|ego wins (handy for sharing a look), then the saved choice.
  function initialTheme() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('theme');
      if (find(fromUrl)) return fromUrl;
    } catch (e) { /* old browser: ignore */ }
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (find(saved)) return saved;
    } catch (e) { /* storage blocked: fall back to the default */ }
    return DEFAULT_THEME;
  }

  function applyTheme(id) {
    var theme = find(id) || find(DEFAULT_THEME);
    document.documentElement.setAttribute('data-theme', theme.id);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.color);
    return theme.id;
  }

  var current = applyTheme(initialTheme());

  function setTheme(id) {
    current = applyTheme(id);
    try { window.localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* not saved, still applied */ }
    syncSwitchers();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: current } }));
  }

  var switchers = [];

  function syncSwitchers() {
    var theme = find(current);
    switchers.forEach(function (s) {
      s.icon.innerHTML = ICONS[theme.icon];
      s.button.setAttribute('aria-label', 'Theme: ' + theme.label);
      s.items.forEach(function (item) {
        item.setAttribute('aria-checked', item.getAttribute('data-theme-id') === current ? 'true' : 'false');
      });
    });
  }

  function buildSwitcher(host) {
    var wrap = document.createElement('div');
    wrap.className = 'theme-switcher';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-switcher-btn';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    var icon = document.createElement('span');
    icon.style.display = 'inline-flex';
    var label = document.createElement('span');
    label.className = 'label';
    label.textContent = 'Theme';
    button.appendChild(icon);
    button.appendChild(label);
    button.insertAdjacentHTML('beforeend', CHEVRON);

    var menu = document.createElement('div');
    menu.className = 'theme-switcher-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Choose a theme');
    menu.hidden = true;
    var heading = document.createElement('p');
    heading.className = 'menu-label';
    heading.setAttribute('aria-hidden', 'true');
    heading.textContent = 'Theme';
    heading.style.margin = '0';
    menu.appendChild(heading);

    var items = THEMES.map(function (theme) {
      var item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('data-theme-id', theme.id);
      item.innerHTML = ICONS[theme.icon] + '<span></span>' + TICK;
      item.querySelector('span').textContent = theme.label;
      item.addEventListener('click', function () {
        setTheme(theme.id);
        close(true);
      });
      menu.appendChild(item);
      return item;
    });

    function open() {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      var checked = menu.querySelector('[aria-checked="true"]') || items[0];
      checked.focus();
    }
    function close(returnFocus) {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (returnFocus) button.focus();
    }

    button.addEventListener('click', function () {
      if (menu.hidden) open(); else close(false);
    });
    menu.addEventListener('keydown', function (e) {
      var i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Tab') { close(false); }
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !wrap.contains(e.target)) close(false);
    });

    wrap.appendChild(button);
    wrap.appendChild(menu);
    host.appendChild(wrap);
    switchers.push({ button: button, icon: icon, items: items });
  }

  function init() {
    var hosts = document.querySelectorAll('[data-theme-switcher]');
    if (hosts.length) {
      Array.prototype.forEach.call(hosts, buildSwitcher);
    } else {
      var nav = document.querySelector('.nav');
      if (!nav) return;
      // Added as its own item at the end of the nav, outside the collapsible
      // link list, so it stays reachable on phones (theme.css orders it).
      var host = document.createElement('div');
      host.style.display = 'contents';
      nav.appendChild(host);
      buildSwitcher(host);
    }
    syncSwitchers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SiteTheme = {
    themes: THEMES.map(function (t) { return { id: t.id, label: t.label }; }),
    get: function () { return current; },
    set: setTheme
  };
})();
