/**
 * Dashboard for the self-hosted analytics. Reads GET /stats on the Worker
 * and draws it; holds no data of its own.
 *
 * The stats key is kept in localStorage rather than asked for on every load.
 * That is a deliberate trade: the key only reads aggregate counts for one
 * site, and a dashboard that demands a password every visit is a dashboard
 * nobody opens.
 */
(function () {
  // Set in js/analytics-config.js, loaded before this file.
  var ENDPOINT = window.ANALYTICS_ENDPOINT || "";

  var SERIES = [
    // Validated as a categorical pair against this site's dark surface
    // (#161826): lightness band, chroma floor, CVD separation, normal-vision
    // separation and contrast all pass. Do not substitute by eye.
    { key: "views", label: "Page views", color: "#9184d9" },
    { key: "visitors", label: "Unique visitors", color: "#35a68b" },
  ];
  var RANGES = [7, 30, 90, 365];
  var STORE_KEY = "eileenip-stats-token";

  var state = { days: 30, data: null };

  var $ = function (id) { return document.getElementById(id); };

  function token() {
    try { return localStorage.getItem(STORE_KEY) || ""; } catch (e) { return ""; }
  }

  function setToken(value) {
    try {
      if (value) localStorage.setItem(STORE_KEY, value);
      else localStorage.removeItem(STORE_KEY);
    } catch (e) { /* private mode: the session still works, it just won't stick */ }
  }

  // — Fetching —

  async function load() {
    if (!ENDPOINT) {
      $("an-status").textContent =
        "No endpoint configured yet — set window.ANALYTICS_ENDPOINT in "
        + "js/analytics-config.js once the Worker is deployed.";
      return;
    }
    $("an-status").textContent = "Loading…";
    var res;
    try {
      res = await fetch(ENDPOINT.replace(/\/$/, "") + "/stats?days=" + state.days, {
        headers: { Authorization: "Bearer " + token() },
      });
    } catch (err) {
      $("an-status").textContent = "Couldn't reach the collector.";
      return;
    }
    if (res.status === 401) {
      setToken("");
      showGate("That key was rejected.");
      return;
    }
    if (!res.ok) {
      $("an-status").textContent = "Collector returned HTTP " + res.status + ".";
      return;
    }
    state.data = await res.json();
    $("an-status").textContent =
      "Last " + state.data.days + " days, from " + state.data.since + ".";
    render();
  }

  // — Rendering —

  function tile(value, label, hint) {
    var el = document.createElement("div");
    el.className = "an-tile";
    var v = document.createElement("div");
    v.className = "an-tile-value";
    v.textContent = value;
    var l = document.createElement("div");
    l.className = "an-tile-label";
    l.textContent = label;
    el.append(v, l);
    if (hint) {
      var h = document.createElement("div");
      h.className = "an-tile-hint";
      h.textContent = hint;
      el.append(h);
    }
    return el;
  }

  function renderTiles(data) {
    var wrap = $("an-tiles");
    wrap.replaceChildren();
    var downloads = (data.events || []).find(function (e) { return e.kind === "download"; });
    wrap.append(
      tile(data.totals.views.toLocaleString(), "Page views"),
      tile(data.totals.visitors.toLocaleString(), "Unique visitors", "Counted per day, not across days"),
      tile(downloads ? downloads.count.toLocaleString() : "0", "Resume downloads")
    );
  }

  function table(el, columns, rows, emptyText) {
    el.replaceChildren();
    if (!rows.length) {
      var p = document.createElement("caption");
      p.className = "an-empty";
      p.textContent = emptyText;
      el.append(p);
      return;
    }
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    columns.forEach(function (col) {
      var th = document.createElement("th");
      th.textContent = col.label;
      if (col.numeric) th.className = "num";
      hr.append(th);
    });
    thead.append(hr);
    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      columns.forEach(function (col) {
        var td = document.createElement("td");
        var value = row[col.key];
        td.textContent = value === null || value === undefined ? "—"
          : (col.numeric ? Number(value).toLocaleString() : String(value));
        if (col.numeric) td.className = "num";
        tr.append(td);
      });
      tbody.append(tr);
    });
    el.append(thead, tbody);
  }

  // — Chart —

  // Two series, one unit (counts), one axis. A second y-scale would let the
  // two lines cross wherever the scales happened to put them, which says
  // nothing true about the data.
  function renderChart(daily) {
    var svg = $("an-chart");
    svg.replaceChildren();
    var legend = $("an-legend");
    legend.replaceChildren();

    SERIES.forEach(function (s) {
      var item = document.createElement("span");
      item.className = "an-legend-item";
      var swatch = document.createElement("span");
      swatch.className = "an-swatch";
      swatch.style.background = s.color;
      var label = document.createElement("span");
      label.textContent = s.label;
      item.append(swatch, label);
      legend.append(item);
    });

    if (!daily.length) {
      svg.setAttribute("viewBox", "0 0 720 240");
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", "360");
      t.setAttribute("y", "120");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("class", "an-chart-empty");
      t.textContent = "No traffic recorded yet.";
      svg.append(t);
      return;
    }

    var W = 720, H = 260, padL = 44, padR = 12, padT = 16, padB = 30;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var max = Math.max(1, ...daily.map(function (d) {
      return Math.max(d.views, d.visitors);
    }));
    // Round the axis top to something a person would pick.
    var step = Math.pow(10, Math.floor(Math.log10(max)));
    var top = Math.ceil(max / step) * step;
    if (top === max) top = max + step;

    var x = function (i) {
      return padL + (daily.length === 1 ? innerW / 2 : (i / (daily.length - 1)) * innerW);
    };
    var y = function (v) { return padT + innerH - (v / top) * innerH; };

    var ns = "http://www.w3.org/2000/svg";
    var el = function (name, attrs) {
      var node = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      return node;
    };

    // Recessive gridlines: four bands is enough to read a level from.
    for (var g = 0; g <= 4; g++) {
      var gv = (top / 4) * g;
      svg.append(el("line", {
        x1: padL, x2: W - padR, y1: y(gv), y2: y(gv), class: "an-grid",
      }));
      var gridLabel = el("text", {
        x: padL - 8, y: y(gv) + 4, "text-anchor": "end", class: "an-axis",
      });
      gridLabel.textContent = Math.round(gv).toLocaleString();
      svg.append(gridLabel);
    }

    // Date ticks: first, middle, last only — a label per day is unreadable
    // at 90 and meaningless at 365.
    [0, Math.floor(daily.length / 2), daily.length - 1]
      .filter(function (v, i, arr) { return arr.indexOf(v) === i; })
      .forEach(function (i) {
        var label = el("text", {
          x: x(i), y: H - 8,
          "text-anchor": i === 0 ? "start" : (i === daily.length - 1 ? "end" : "middle"),
          class: "an-axis",
        });
        label.textContent = daily[i].day.slice(5);
        svg.append(label);
      });

    SERIES.forEach(function (s) {
      var d = daily.map(function (row, i) {
        return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(row[s.key]).toFixed(1);
      }).join(" ");
      svg.append(el("path", { d: d, fill: "none", stroke: s.color, "stroke-width": 2,
                              "stroke-linejoin": "round", "stroke-linecap": "round" }));
      // Single-point ranges have no line to see, so mark the point.
      if (daily.length === 1) {
        svg.append(el("circle", { cx: x(0), cy: y(daily[0][s.key]), r: 4, fill: s.color }));
      }
    });

    // Hover layer: one crosshair, one tooltip, hit targets spanning the full
    // column height so the pointer never has to find a 2px line.
    var tip = $("an-tip");
    var crosshair = el("line", { class: "an-crosshair", y1: padT, y2: padT + innerH, x1: 0, x2: 0 });
    crosshair.style.display = "none";
    svg.append(crosshair);

    var dots = SERIES.map(function (s) {
      var dot = el("circle", { r: 4, fill: s.color, stroke: "var(--color-bg)", "stroke-width": 2 });
      dot.style.display = "none";
      svg.append(dot);
      return dot;
    });

    var band = innerW / Math.max(1, daily.length - 1);
    daily.forEach(function (row, i) {
      var hit = el("rect", {
        x: x(i) - band / 2, y: padT, width: Math.max(band, 8), height: innerH,
        fill: "transparent",
      });
      hit.addEventListener("mouseenter", function () {
        crosshair.setAttribute("x1", x(i));
        crosshair.setAttribute("x2", x(i));
        crosshair.style.display = "";
        SERIES.forEach(function (s, si) {
          dots[si].setAttribute("cx", x(i));
          dots[si].setAttribute("cy", y(row[s.key]));
          dots[si].style.display = "";
        });
        tip.hidden = false;
        tip.innerHTML = "";
        var head = document.createElement("div");
        head.className = "an-tip-head";
        head.textContent = row.day;
        tip.append(head);
        SERIES.forEach(function (s) {
          var line = document.createElement("div");
          line.className = "an-tip-row";
          var sw = document.createElement("span");
          sw.className = "an-swatch";
          sw.style.background = s.color;
          var name = document.createElement("span");
          name.textContent = s.label;
          var val = document.createElement("strong");
          val.textContent = Number(row[s.key]).toLocaleString();
          line.append(sw, name, val);
          tip.append(line);
        });
        var pct = x(i) / W;
        tip.style.left = (pct * 100) + "%";
        tip.style.transform = "translate(" + (pct > 0.6 ? "-100%" : "0") + ", 0)";
      });
      svg.append(hit);
    });

    svg.addEventListener("mouseleave", function () {
      crosshair.style.display = "none";
      dots.forEach(function (d) { d.style.display = "none"; });
      tip.hidden = true;
    });
  }

  function render() {
    var data = state.data;
    renderTiles(data);
    renderChart(data.daily);

    table($("an-daily-table"),
      [{ key: "day", label: "Day" },
       { key: "views", label: "Views", numeric: true },
       { key: "visitors", label: "Visitors", numeric: true }],
      data.daily, "No traffic recorded yet.");

    table($("an-paths"),
      [{ key: "path", label: "Path" },
       { key: "views", label: "Views", numeric: true },
       { key: "visitors", label: "Visitors", numeric: true }],
      data.paths, "No page views yet.");

    table($("an-referrers"),
      [{ key: "host", label: "Source" },
       { key: "views", label: "Views", numeric: true }],
      data.referrers, "No external referrers yet — every visit was direct.");

    table($("an-countries"),
      [{ key: "country", label: "Country" },
       { key: "visitors", label: "Visitors", numeric: true }],
      data.countries, "No country data yet.");

    table($("an-events"),
      [{ key: "kind", label: "Event" },
       { key: "count", label: "Count", numeric: true },
       { key: "visitors", label: "Visitors", numeric: true }],
      data.events, "No events beyond page views yet.");

    var note = $("an-roles-note");
    if (data.roles && data.roles.length) {
      note.hidden = false;
      note.textContent = "Role picked on the resume builder:";
      table($("an-roles"),
        [{ key: "role", label: "Role" }, { key: "count", label: "Picks", numeric: true }],
        data.roles, "");
    } else {
      note.hidden = true;
      $("an-roles").replaceChildren();
    }
  }

  // — Gate and controls —

  function showGate(message) {
    $("an-gate").hidden = false;
    $("an-main").hidden = true;
    var err = $("an-gate-error");
    err.hidden = !message;
    err.textContent = message || "";
  }

  function showMain() {
    $("an-gate").hidden = true;
    $("an-main").hidden = false;
  }

  function renderRanges() {
    var wrap = $("an-ranges");
    wrap.replaceChildren();
    RANGES.forEach(function (days) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag filter-pill" + (days === state.days ? " selected" : "");
      btn.textContent = days + "d";
      btn.addEventListener("click", function () {
        state.days = days;
        renderRanges();
        load();
      });
      wrap.append(btn);
    });
  }

  $("an-gate-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var value = $("an-token").value.trim();
    if (!value) return;
    setToken(value);
    $("an-token").value = "";
    showMain();
    load();
  });

  $("an-signout").addEventListener("click", function () {
    setToken("");
    showGate("");
  });

  if (token()) {
    showMain();
    renderRanges();
    load();
  } else {
    showGate("");
  }
})();
