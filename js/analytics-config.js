/**
 * The one place the collector URL is written.
 *
 * Both js/analytics.js (which sends) and js/analytics-dashboard.js (which
 * reads) pick it up from here, so deploying the Worker means editing one
 * line rather than seven pages. Empty means analytics are off: the snippet
 * goes inert rather than firing failed requests, which is the right state
 * for a local preview or a fork.
 */
window.ANALYTICS_ENDPOINT = "";
