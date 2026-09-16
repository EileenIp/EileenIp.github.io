/**
 * Site-side half of the analytics. Sends a pageview on load and exposes
 * window.track() for anything worth counting beyond that.
 *
 * Reads nothing about the visitor. No cookie, no localStorage, no id of any
 * kind is written by this file -- the collector derives a daily visitor hash
 * server-side and never stores what it derived it from. That is the whole
 * reason the site needs no consent banner, so keep it that way: if a future
 * change here starts storing an id, the banner question comes back with it.
 *
 * Endpoint comes from js/analytics-config.js, which must be loaded first;
 * a data-endpoint attribute on this script tag overrides it for local tests.
 */
(function () {
  var script = document.currentScript;
  // js/analytics-config.js is the single source; a data-endpoint attribute
  // overrides it, which is only useful when testing against a local Worker.
  var endpoint = (script && script.dataset.endpoint) || window.ANALYTICS_ENDPOINT || "";

  // Honouring Do Not Track costs a handful of visits and is the consistent
  // position for a tracker that already refuses to store an identifier.
  var dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1" ||
            navigator.msDoNotTrack === "1";

  // A file:// preview or an un-configured page should be inert rather than
  // firing failed requests on every load.
  var enabled = !!endpoint && !dnt && location.protocol.indexOf("http") === 0;

  function send(kind, meta) {
    if (!enabled) return;
    var payload = JSON.stringify({
      kind: kind,
      path: location.pathname,
      ref: document.referrer || null,
      meta: meta || null,
    });
    var url = endpoint.replace(/\/$/, "") + "/collect";

    // text/plain, not application/json, and this is load-bearing rather than
    // sloppy. application/json is not a CORS-safelisted content type, so it
    // forces a preflight -- and sendBeacon sends with credentials mode
    // "include", whose preflight then demands
    // Access-Control-Allow-Credentials: true. The first version of this file
    // used application/json and every beacon was silently blocked by CORS in
    // the browser while curl tests passed, because curl does no CORS at all.
    //
    // text/plain is safelisted, so there is no preflight, no credentials
    // question, and one request instead of two. The collector reads the body
    // with request.text() and parses it itself, so the declared type never
    // mattered on the server side.
    var TYPE = "text/plain;charset=UTF-8";

    // sendBeacon survives the page being closed mid-request, which is exactly
    // when an outbound-link click is recorded.
    if (navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(url, new Blob([payload], { type: TYPE }))) return;
        // A false return means the browser refused to queue it (payload over
        // its limit, say), so fall through rather than lose the event.
      } catch (err) {
        /* fall through to fetch */
      }
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": TYPE },
      body: payload,
      keepalive: true,
      mode: "cors",
    }).catch(function () {
      // Analytics failing must never be visible to a visitor.
    });
  }

  window.track = send;

  send("pageview");

  // Resume downloads are the number this exists to answer, so they are wired
  // here rather than left to each page to remember. Any link or button opting
  // in with data-track="download" is counted, with its data-track-meta JSON
  // merged in (the resume builder uses this to record the role picked).
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    var el = event.target.closest("[data-track]");

    // An explicit data-track wins, so a tagged link never fires twice.
    if (el) {
      var meta = null;
      if (el.dataset.trackMeta) {
        try {
          meta = JSON.parse(el.dataset.trackMeta);
        } catch (err) {
          meta = null;
        }
      }
      send(el.dataset.track, meta);
      return;
    }

    // Outbound clicks, detected rather than hand-tagged: the case-study links
    // are built at runtime from data/projects.json, so tagging markup would
    // miss exactly the links worth measuring -- whether anyone actually opens
    // the repos and dashboards.
    if (!link) return;
    var to = outboundTarget(link.getAttribute("href"));
    if (to) send("outbound", { to: to });
  });

  // Returns what to record for a destination, or null when the link is
  // internal. Records host + path with the query string dropped: this is
  // Eileen's own link being identified, not anything about the visitor, and
  // the path is the whole point -- "github.com" would not say which repo.
  function outboundTarget(href) {
    if (!href || href.charAt(0) === "#") return null;
    var url;
    try {
      url = new URL(href, location.href);
    } catch (err) {
      return null;
    }
    // mailto:/tel: have no host; the scheme alone is the useful signal.
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return url.protocol.replace(":", "");
    }
    if (url.host === location.host) return null;
    return (url.host + url.pathname).replace(/\/$/, "").slice(0, 160);
  }
})();
