"""Build the 16:10 card image for each project in data/projects.json.

Rule: every card is either a screenshot of the project's own dashboard or a
typographic tile. Nothing here invents a chart -- a card that merely looks
like a dashboard is a claim about work that doesn't exist, and it is the
first thing an interviewer would ask about.

Sources, in order of preference:
  1. a deployed dashboard URL        -> screenshot at card size
  2. a dashboard built in the local repo -> same, over file://
  3. an image the project already ships -> downloaded and cached here
  4. nothing                         -> typographic tile, no fake chart

Re-runnable: pass --only <id> to rebuild one card.
"""
import argparse, json, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "projects"
REPOS = ROOT.parent / "portfolio-projects"
W, H = 1280, 800  # 16:10, matches .project-thumb

BG, SURFACE, TEXT, ACCENT, MUTED = (22, 24, 38), (35, 37, 50), (233, 233, 237), (145, 132, 217), (147, 151, 171)
FONTS = Path("C:/Windows/Fonts")

SOURCES = {
    "ad-creative-performance-pipeline": {
        "shot": "https://eileenip.github.io/ad-creative-pipeline/dashboard/"},
    "launch-sentiment-helldivers-2024": {
        "shot": "https://eileenip.github.io/launch-sentiment/dashboard/"},
    "subscriber-churn-retention-2026": {
        "shot": (REPOS / "subscriber-churn-ltv" / "docs" / "index.html").as_uri()},
    # Self-contained: the dashboard embeds its data, so file:// renders fully.
    "steam-f2p-vs-paid-engagement-2026": {
        "shot": (REPOS / "steam-pricing-engagement" / "dashboard" / "index.html").as_uri()},
    "creator-content-decision-dashboard-2026": {
        "fetch": "https://raw.githubusercontent.com/EileenIp/"
                 "creator-content-decision-dashboard/main/dashboard.png"},
    # Power BI desktop project: the card already holds a real report page.
    "advertising-revenue-sales-efficiency-2026": {"keep": True},
    # Notebook-only, no dashboard and no figure exported to a public URL.
    "ecommerce-behavior-conversion-2019": {"tile": True},
    "streaming-engagement-dashboard": {"tile": True},
    "support-ticket-sentiment-tracker": {"tile": True},
    # Local-only app: the card is a crop of the modal's interface screenshot,
    # taken from a copy running the built-in fictional example with no saved
    # answers loaded. Re-take it the same way, never from the real install.
    "converseassist-2026": {"keep": True},
}


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def tile(project, dest):
    """Typographic card: title, type, stack. Honest about having no visual."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = 1 - (y / H)
        d.line([(0, y), (W, y)], fill=tuple(
            int(BG[i] + (SURFACE[i] - BG[i]) * t * 0.9) for i in range(3)))
    d.rectangle([0, 0, W, 8], fill=ACCENT)

    pad = 84
    y = 150
    kicker = (project.get("projectType") or "Project").upper()
    d.text((pad, y), kicker, font=font("segoeuisl.ttf", 28), fill=ACCENT)
    y += 64

    f_title = font("segoeuib.ttf", 66)
    for line in wrap(d, project.get("title", "Untitled"), f_title, W - pad * 2)[:3]:
        d.text((pad, y), line, font=f_title, fill=TEXT)
        y += 80

    tools = project.get("tools") or []
    if tools:
        y = H - 190
        f = font("segoeui.ttf", 26)
        tx = pad
        for tool in tools[:6]:
            w = d.textlength(tool, font=f)
            if tx + w + 48 > W - pad:
                break
            d.rounded_rectangle([tx, y, tx + w + 44, y + 54], 27, outline=MUTED, width=2)
            d.text((tx + 22, y + 12), tool, font=f, fill=MUTED)
            tx += w + 44 + 14

    d.line([(pad, H - 96), (W - pad, H - 96)], fill=(63, 66, 77), width=1)
    industry = project.get("industry") or ""
    d.text((pad, H - 72), industry, font=font("segoeui.ttf", 26), fill=MUTED)
    img.save(dest, optimize=True)


def shoot(url, dest):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.goto(url, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(2500)  # let chart animations settle
        page.screenshot(path=str(dest))
        browser.close()


def fetch(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        dest.write_bytes(r.read())
    img = Image.open(dest).convert("RGB")
    # Cover-crop to 16:10 so the grid doesn't crop it unpredictably.
    scale = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, 0
    img.crop((left, top, left + W, top + H)).save(dest, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads((ROOT / "data" / "projects.json").read_text(encoding="utf8"))
    projects = data["projects"] if isinstance(data, dict) else data

    for project in projects:
        pid = project.get("id")
        if args.only and pid != args.only:
            continue
        spec = SOURCES.get(pid)
        if not spec or spec.get("keep"):
            print(f"  {pid:44s} kept as-is")
            continue

        dest = OUT / f"{pid}-card.png"
        try:
            if "shot" in spec:
                shoot(spec["shot"], dest)
                how = "screenshot"
            elif "fetch" in spec:
                fetch(spec["fetch"], dest)
                how = "downloaded"
            else:
                tile(project, dest)
                how = "tile"
            project["image"] = f"images/projects/{pid}-card.png"
            print(f"  {pid:44s} {how}")
        except Exception as exc:
            print(f"  {pid:44s} FAILED ({exc}) -- falling back to tile")
            tile(project, dest)
            project["image"] = f"images/projects/{pid}-card.png"

    if not args.only:
        (ROOT / "data" / "projects.json").write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
        print("data/projects.json image paths updated")


if __name__ == "__main__":
    main()
