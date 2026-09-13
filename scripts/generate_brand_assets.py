"""Generate the favicon and the 1200x630 social-share card.

Both are committed assets; this script exists so they can be regenerated
after a palette or tagline change rather than hand-edited. Colours are the
CSS custom properties from css/style.css, copied here because a static site
has no build step that could read them.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BG = (22, 24, 38)
SURFACE = (35, 37, 50)
TEXT = (233, 233, 237)
ACCENT = (145, 132, 217)
MUTED = (147, 151, 171)

# Segoe UI stands in for Inter, which isn't installed system-wide on
# Windows. Same humanist sans proportions; the card is a raster, so the
# substitution never reaches a browser.
FONTS = Path("C:/Windows/Fonts")


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def rounded_pill(draw, box, radius, outline, width=2):
    draw.rounded_rectangle(box, radius=radius, outline=outline, width=width)


def build_og_card(path):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Accent wash in the top-left, mirroring the site's hero band. Drawn as
    # a coarse vertical ramp rather than a real gradient: at this size the
    # banding is invisible and it keeps the dependency list at Pillow.
    for y in range(260):
        t = 1 - (y / 260)
        d.line(
            [(0, y), (W, y)],
            fill=(
                int(BG[0] + (SURFACE[0] - BG[0]) * t),
                int(BG[1] + (SURFACE[1] - BG[1]) * t),
                int(BG[2] + (SURFACE[2] - BG[2]) * t),
            ),
        )
    d.rectangle([0, 0, W, 6], fill=ACCENT)

    x = 80
    d.text((x, 96), "DATA ANALYST  ·  DATA SCIENTIST  ·  DATA ENGINEER",
           font=font("segoeuisl.ttf", 22), fill=ACCENT)
    d.text((x, 150), "Eileen Ip", font=font("segoeuib.ttf", 104), fill=TEXT)
    d.text((x, 286),
           "I turn audience and customer data into decisions —",
           font=font("segoeui.ttf", 34), fill=TEXT)
    d.text((x, 332),
           "dashboards, models, and clear write-ups.",
           font=font("segoeui.ttf", 34), fill=TEXT)

    tags = ["Gaming", "Media & Entertainment", "Social Media", "Marketing", "Customer Experience"]
    f = font("segoeui.ttf", 22)
    tx = x
    for tag in tags:
        w = d.textlength(tag, font=f)
        rounded_pill(d, [tx, 424, tx + w + 40, 472], 24, MUTED)
        d.text((tx + 20, 436), tag, font=f, fill=MUTED)
        tx += w + 40 + 12

    d.line([(x, 536), (W - x, 536)], fill=(63, 66, 77), width=1)
    d.text((x, 558), "eileenip.github.io", font=font("segoeui.ttf", 26), fill=TEXT)
    right = "Brisbane, AU"
    d.text((W - x - d.textlength(right, font=font("segoeui.ttf", 26)), 558),
           right, font=font("segoeui.ttf", 26), fill=MUTED)

    img.save(path, optimize=True)
    return path


def build_icon(path, size, scale=8):
    """Monogram tile. Rendered oversized and downsampled for clean edges."""
    S = size * scale
    img = Image.new("RGB", (S, S), ACCENT)
    d = ImageDraw.Draw(img)
    f = font("segoeuib.ttf", int(S * 0.62))
    box = d.textbbox((0, 0), "E", font=f)
    d.text(((S - (box[2] - box[0])) / 2 - box[0],
            (S - (box[3] - box[1])) / 2 - box[1]), "E", font=f, fill=BG)
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    return path


if __name__ == "__main__":
    (ROOT / "images").mkdir(exist_ok=True)
    print(build_og_card(ROOT / "images" / "og-card.png"))
    print(build_icon(ROOT / "apple-touch-icon.png", 180))
    ico = ROOT / "favicon.ico"
    Image.open(build_icon(ROOT / "images" / "_icon512.png", 512)).save(
        ico, sizes=[(16, 16), (32, 32), (48, 48)])
    (ROOT / "images" / "_icon512.png").unlink()
    print(ico)
