"""Download a logo per company into images/logos/, once.

Logos are cached in the repo rather than hot-linked at render time: a
hot-linked logo breaks when the provider changes, and it leaks every
visitor's request to a third party on a page that is already public.

Source is Google's favicon service, which resolves a domain to that site's
own icon. It is a favicon, so it is a mark rather than a full wordmark --
which is what the layout wants anyway.
"""
import json, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "logos"
SRC = "https://www.google.com/s2/favicons?domain={}&sz=128"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    reg = json.loads((ROOT / "data" / "companies.json").read_text(encoding="utf8"))["companies"]
    domains = sorted({c["domain"] for c in reg.values() if c["domain"]})

    got = skipped = failed = 0
    for domain in domains:
        dest = OUT / f"{domain}.png"
        if dest.exists():
            skipped += 1
            continue
        try:
            req = urllib.request.Request(SRC.format(domain), headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
            # The service answers a miss with a small generic globe; keep it
            # rather than special-casing, but report the size so obvious
            # placeholders are visible in the run output.
            dest.write_bytes(data)
            got += 1
            print(f"  {domain:42s} {len(data):6d} B")
        except Exception as exc:
            failed += 1
            print(f"  {domain:42s} FAILED: {exc}")
        time.sleep(0.2)

    print(f"\n{got} downloaded, {skipped} already cached, {failed} failed")


if __name__ == "__main__":
    main()
