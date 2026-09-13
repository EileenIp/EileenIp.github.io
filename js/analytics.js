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

    // sendBeacon survives the page being closed mid-request, which is exactly
    // when an outbound-link click is recorded.
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        return;
      } catch (err) {
        /* fall through to fetch */
      }
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    var el = event.target.closest("[data-track]");
    if (!el) return;
    var meta = null;
    if (el.dataset.trackMeta) {
      try {
        meta = JSON.parse(el.dataset.trackMeta);
      } catch (err) {
        meta = null;
      }
    }
    send(el.dataset.track, meta);
  });
})();
