"""End-to-end smoke test: real browser -> real Worker -> real D1.

This exists because the unit suite cannot catch the bug that actually shipped.
Beacons declared `application/json`, which forced a CORS preflight that
`sendBeacon`'s credentials mode made unsatisfiable. Every curl-based test
passed, because curl does no CORS at all, and nothing inside workerd can see
that failure mode either -- it lives in the browser's CORS layer.

Measured while writing this test, and worth knowing because the first
description of the bug was wrong: the preflight *succeeded*, the POST was
sent, the Worker inserted the row, and only the response was rejected. The
browser logged ERR_FAILED and a CORS error while the data landed anyway. So
the bug's cost was a console full of errors and a client with no idea whether
anything worked -- not the guaranteed data loss originally claimed.

That is precisely why this test asserts three separate things rather than one:
that the row lands, that no CORS error appears, and that no /collect request
fails at the network layer. Checking only the row would have called the broken
version healthy.

    cd analytics/worker && npm run smoke

Needs Python's playwright with Chromium installed:

    pip install playwright && playwright install chromium

Nothing here mutates the repo. The collector URL is injected by intercepting
the request for js/analytics-config.js, so the committed config keeps pointing
at production and a crashed run cannot leave the site pointing at localhost.
"""

import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

WORKER_DIR = Path(__file__).resolve().parent / "worker"
SITE_DIR = Path(__file__).resolve().parent.parent
WORKER_PORT = 8787
SITE_PORT = 8765
WORKER_URL = f"http://127.0.0.1:{WORKER_PORT}"
SITE_URL = f"http://localhost:{SITE_PORT}"

# Origin the Worker must accept: it allows localhost origins only when it is
# itself running locally, which is exactly the configuration under test.
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def run(args, **kw):
    # errors="replace": wrangler prints box-drawing characters that Windows'
    # default cp1252 decoder throws on, which crashes the reader thread rather
    # than the command.
    return subprocess.run(args, cwd=WORKER_DIR, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **kw)


def d1(sql, json_out=False):
    """Query the local D1 that `wrangler dev` is using."""
    args = [NPX, "wrangler", "d1", "execute", "eileenip-analytics", "--local",
            "--command", sql]
    if json_out:
        args.append("--json")
    proc = run(args)
    if json_out:
        match = re.search(r"\[[\s\S]*\]", proc.stdout)
        if not match:
            raise RuntimeError(f"no JSON in wrangler output:\n{proc.stdout}\n{proc.stderr}")
        return json.loads(match.group(0))[0]["results"]
    return proc.stdout


def wait_for(url, timeout=90):
    """Poll until something answers, whatever it answers."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=3)
            return True
        except urllib.error.HTTPError:
            return True  # a 404 still means it is listening
        except Exception:
            time.sleep(1)
    return False


def kill(proc):
    if proc.poll() is not None:
        return
    if sys.platform == "win32":
        # npx spawns a child; terminate() would orphan the actual server.
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                       capture_output=True)
    else:
        proc.terminate()
    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        proc.kill()


class Checks:
    def __init__(self):
        self.failures = []
        self.passes = 0

    def that(self, label, condition, detail=""):
        if condition:
            self.passes += 1
            print(f"  PASS  {label}")
        else:
            self.failures.append(label)
            print(f"  FAIL  {label}" + (f"\n        {detail}" if detail else ""))


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright is not installed. Run:\n"
              "  pip install playwright && playwright install chromium")
        return 2

    print("setting up local D1 schema")
    run([NPX, "wrangler", "d1", "execute", "eileenip-analytics", "--local",
         "--file=./schema.sql"])
    d1("DELETE FROM events")

    worker = site = None
    checks = Checks()
    try:
        print(f"starting wrangler dev on :{WORKER_PORT}")
        worker = subprocess.Popen(
            [NPX, "wrangler", "dev", "--port", str(WORKER_PORT)],
            cwd=WORKER_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if not wait_for(WORKER_URL):
            print("wrangler dev never came up")
            return 1

        print(f"serving the site on :{SITE_PORT}")
        site = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(SITE_PORT),
             "--directory", str(SITE_DIR)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if not wait_for(f"{SITE_URL}/index.html"):
            print("static server never came up")
            return 1

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            console_errors = []
            page.on("console", lambda m: m.type == "error" and console_errors.append(m.text))
            failed_requests = []
            page.on("requestfailed",
                    lambda r: failed_requests.append(f"{r.url} {r.failure}"))

            # Point the page at the local Worker without touching the repo.
            page.route(
                "**/js/analytics-config.js",
                lambda route: route.fulfill(
                    status=200,
                    content_type="application/javascript",
                    body=f'window.ANALYTICS_ENDPOINT = "{WORKER_URL}";',
                ),
            )

            print("\n-- pageview --")
            page.goto(f"{SITE_URL}/index.html", wait_until="load")
            page.wait_for_timeout(1500)

            rows = d1("SELECT kind, path FROM events", json_out=True)
            checks.that("a pageview reaches the collector from a real browser",
                        any(r["kind"] == "pageview" and r["path"] == "/index.html"
                            for r in rows),
                        f"rows: {rows}")

            # The direct guard for the bug this file exists for.
            cors = [e for e in console_errors if "CORS" in e or "Access-Control" in e]
            checks.that("no CORS error in the console", not cors, "\n        ".join(cors))
            beacon_failures = [f for f in failed_requests if "/collect" in f]
            checks.that("no /collect request failed at the network layer",
                        not beacon_failures, "\n        ".join(beacon_failures))

            print("\n-- outbound, internal and anchor clicks --")
            d1("DELETE FROM events")
            # Cancel navigation only. preventDefault does not stop propagation,
            # so the delegated listener in analytics.js still runs.
            page.evaluate("document.addEventListener('click', e => e.preventDefault(), true)")
            clicked = page.evaluate("""() => {
                const links = [...document.querySelectorAll('a[href]')];
                const pick = f => links.find(f);
                const targets = {
                  github:   pick(a => a.href.includes('github.com/EileenIp')),
                  mailto:   pick(a => a.href.startsWith('mailto:')),
                  internal: pick(a => a.getAttribute('href') === 'projects.html'),
                  anchor:   pick(a => (a.getAttribute('href') || '').startsWith('#')),
                };
                const found = {};
                for (const [name, el] of Object.entries(targets)) {
                  found[name] = !!el;
                  if (el) el.click();
                }
                return found;
            }""")
            page.wait_for_timeout(1500)

            rows = d1("SELECT kind, path, meta FROM events", json_out=True)
            outbound = [r for r in rows if r["kind"] == "outbound"]
            tos = [json.loads(r["meta"])["to"] for r in outbound if r["meta"]]

            checks.that("the test found the links it needs on the page",
                        all(clicked.values()), f"found: {clicked}")
            checks.that("an external link records an outbound event with host and path",
                        any(t.startswith("github.com/EileenIp") for t in tos),
                        f"recorded: {tos}")
            checks.that("a mailto link records the scheme alone",
                        "mailto" in tos, f"recorded: {tos}")
            checks.that("an internal link and an #anchor record nothing",
                        len(outbound) == 2, f"outbound rows: {tos}")

            print("\n-- resume download --")
            d1("DELETE FROM events")
            page.goto(f"{SITE_URL}/resume.html", wait_until="load")
            page.wait_for_timeout(1500)
            try:
                page.evaluate(
                    "document.addEventListener('click', e => e.preventDefault(), true)")
                has_button = page.evaluate(
                    "!!document.querySelector('[data-track=\\'download\\']')")
                if has_button:
                    page.click("[data-track='download']", timeout=5000)
                    page.wait_for_timeout(1500)
                rows = d1("SELECT kind, meta FROM events WHERE kind = 'download'",
                          json_out=True)
                checks.that("the resume download records a download event",
                            has_button and len(rows) >= 1, f"rows: {rows}")
                if rows and rows[0]["meta"]:
                    meta = json.loads(rows[0]["meta"])
                    checks.that("the download event carries the role the visitor picked",
                                "role" in meta or "roleLabel" in meta, f"meta: {meta}")
            except Exception as exc:
                checks.that("the resume download records a download event", False,
                            f"{type(exc).__name__}: {exc}")

            browser.close()

        print(f"\n{checks.passes} passed, {len(checks.failures)} failed")
        for failure in checks.failures:
            print(f"  failed: {failure}")
        return 1 if checks.failures else 0

    finally:
        print("\ncleaning up")
        d1("DELETE FROM events")
        for proc in (site, worker):
            if proc:
                kill(proc)


if __name__ == "__main__":
    sys.exit(main())
