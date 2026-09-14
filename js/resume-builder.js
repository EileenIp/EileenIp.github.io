/**
 * The resume picker on resume.html.
 *
 * A recruiter who lands here is cold -- Eileen has not sent them anything, so
 * the tailoring has to happen at download time and they have to choose it.
 * Three controls: the role they are hiring for, optionally their industry, and
 * whether the YouTube channel belongs on it.
 *
 * Two rules this file exists to keep:
 *
 *   1. SELECTION VARIES, CLAIMS NEVER DO. The picker chooses which projects
 *      appear and reorders the skills line. It does not rewrite a bullet, and
 *      the per-role skills lists are asserted at build time to be the same set
 *      as the CV's, only resequenced. There is one summary or none, shared by
 *      every variant.
 *   2. THE DEFAULT IS ONE CLICK. The page arrives with a working selection and
 *      a live Download button. Nobody has to configure anything to get a CV.
 */
(function () {
  "use strict";

  var PROJECT_COUNT = 3;
  var data = null;
  var jsPdfLoading = null;

  var state = {
    role: "data-analyst",
    industry: "",
    // Defaults on. It is real, dated experience with a real number on it, and
    // without it the Experience section is a single entry. The toggle is for
    // the recruiter who would rather see a tighter technical CV -- it is not
    // hiding anything by default.
    youtube: true,
  };

  /**
   * Which projects a role/industry pair gets, best first.
   *
   * Industry-matching projects come first within the role's own preference
   * order, then the rest of that order, then anything else tagged for the role
   * by recency. So an industry filter re-ranks; it never empties the page.
   */
  function pickProjects(role, industry, count) {
    var roleDef = data.roles.filter(function (r) { return r.id === role; })[0];
    var byId = {};
    data.projects.forEach(function (p) { byId[p.id] = p; });

    var tagged = data.projects.filter(function (p) {
      return p.roles.indexOf(role) !== -1;
    });
    var matches = function (p) {
      return industry && p.industries.indexOf(industry) !== -1;
    };
    var featured = roleDef.featured.map(function (id) { return byId[id]; })
                                   .filter(Boolean);
    var rest = tagged.filter(function (p) { return featured.indexOf(p) === -1; })
                     .sort(function (a, b) { return b.year - a.year; });

    var ordered = []
      .concat(featured.filter(matches))
      .concat(rest.filter(matches))
      .concat(featured.filter(function (p) { return !matches(p); }))
      .concat(rest.filter(function (p) { return !matches(p); }));

    var seen = {};
    return ordered.filter(function (p) {
      if (seen[p.id]) return false;
      seen[p.id] = true;
      return true;
    }).slice(0, count);
  }

  function selection() {
    var roleDef = data.roles.filter(function (r) { return r.id === state.role; })[0];
    return {
      roleId: state.role,
      roleLabel: roleDef.label,
      industryLabel: state.industry || null,
      languages: roleDef.languages,
      tools: roleDef.tools,
      projects: pickProjects(state.role, state.industry, PROJECT_COUNT),
      experience: data.experience.filter(function (e) {
        return !e.optional || state.youtube;
      }),
    };
  }

  // ---- rendering -----------------------------------------------------------

  function el(id) { return document.getElementById(id); }

  function renderPreview() {
    var sel = selection();
    // What fits is what gets previewed. If a project cannot make the page, the
    // visitor is told here rather than finding out by counting the PDF.
    var fitted = window.ResumePDF.fit(data, sel);
    var list = el("preview-projects");
    list.innerHTML = "";
    fitted.projects.forEach(function (p) {
      var li = document.createElement("li");
      var title = document.createElement("span");
      title.className = "rb-preview-title";
      title.textContent = p.title;
      var meta = document.createElement("span");
      meta.className = "rb-preview-meta";
      meta.textContent = p.tools.join(", ") + " · " + p.date;
      li.appendChild(title);
      li.appendChild(meta);
      list.appendChild(li);
    });

    el("preview-experience").textContent = sel.experience.map(function (e) {
      return e.role + " — " + e.organisation;
    }).join(" · ");
    el("preview-skills").textContent = "Languages: " + sel.languages.join(", ");

    // One A4 page is the standing format, so a page that is full says so.
    var note = el("rb-fit");
    if (fitted.dropped.length) {
      note.textContent = "One page fits " + fitted.projects.length +
        " of these projects. " + fitted.dropped.length +
        " more matched your selection — they're on the projects page.";
      note.hidden = false;
    } else {
      note.hidden = true;
    }

    var btn = el("download");
    btn.dataset.trackMeta = JSON.stringify({
      role: sel.roleId,
      industry: state.industry || null,
      youtube: state.youtube,
    });
  }

  function renderControls() {
    var roles = el("role-options");
    roles.innerHTML = "";
    data.roles.forEach(function (r) {
      var id = "role-" + r.id;
      var label = document.createElement("label");
      label.className = "rb-choice";
      label.innerHTML =
        '<input type="radio" name="role" id="' + id + '" value="' + r.id + '"' +
        (r.id === state.role ? " checked" : "") + '>' +
        '<span>' + r.label + '</span>';
      label.querySelector("input").addEventListener("change", function () {
        state.role = r.id;
        renderPreview();
      });
      roles.appendChild(label);
    });

    var industry = el("industry");
    industry.innerHTML = '<option value="">Any industry</option>';
    data.industries.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      industry.appendChild(opt);
    });
    industry.addEventListener("change", function () {
      state.industry = industry.value;
      renderPreview();
    });

    var yt = el("include-youtube");
    yt.checked = state.youtube;
    yt.addEventListener("change", function () {
      state.youtube = yt.checked;
      renderPreview();
    });
  }

  // ---- download ------------------------------------------------------------

  /**
   * jsPDF measures the preview as well as drawing the PDF, so it has to be
   * here before the first render -- it is loaded with the page (deferred, so
   * it never blocks paint) rather than on the first click. 360KB on the one
   * page whose whole job is producing a PDF is the right trade against
   * previewing a page count that turns out to be wrong.
   */
  function whenJsPdfReady() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    if (jsPdfLoading) return jsPdfLoading;
    jsPdfLoading = new Promise(function (resolve, reject) {
      var tag = document.getElementById("jspdf");
      if (!tag) return reject(new Error("PDF library script tag is missing"));
      tag.addEventListener("load", function () { resolve(); });
      tag.addEventListener("error", function () {
        reject(new Error("could not load the PDF library"));
      });
    });
    return jsPdfLoading;
  }

  function status(message, isError) {
    var node = el("rb-status");
    node.textContent = message || "";
    node.classList.toggle("rb-status-error", !!isError);
  }

  function download() {
    var btn = el("download");
    btn.disabled = true;
    status("Building your PDF…");
    Promise.resolve().then(function () {
      var built = window.ResumePDF.build(data, selection());
      built.doc.save(built.filename);
      status("Downloaded " + built.filename);
    }).catch(function (err) {
      status("Sorry — the PDF could not be generated here. " +
             "Email eileenip01@gmail.com and Eileen will send one. (" +
             err.message + ")", true);
    }).then(function () {
      btn.disabled = false;
    });
  }

  // ---- boot ----------------------------------------------------------------

  function applyQuery() {
    var params = new URLSearchParams(location.search);
    var role = params.get("role");
    if (role && data.roles.some(function (r) { return r.id === role; })) {
      state.role = role;
    }
    var industry = params.get("industry");
    if (industry && data.industries.indexOf(industry) !== -1) {
      state.industry = industry;
    }
  }

  fetch("data/resume.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      return whenJsPdfReady().then(function () {
        applyQuery();
        renderControls();
        el("industry").value = state.industry;
        renderPreview();
        el("rb-panel").hidden = false;
        el("rb-loading").hidden = true;
        el("download").addEventListener("click", download);
      });
    })
    .catch(function (err) {
      el("rb-loading").textContent =
        "The resume builder could not load (" + err.message + "). " +
        "Email eileenip01@gmail.com and Eileen will send a CV directly.";
    });
})();
