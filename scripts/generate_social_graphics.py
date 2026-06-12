#!/usr/bin/env python3
"""Generate the rotation of 6 'New article' graphics for EAII LinkedIn posts.

EAII dark brand: void background, dark-to-emerald gradient field, one distinct
geometric motif per variant (the BBE graphic vocabulary), DM Sans type.
Outputs social/new-article-1.png ... new-article-6.png (1200x1200).

Requires the DM Sans variable TTF; pass its path as argv[1].
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W = H = 1200
VOID = (7, 11, 9)
FOREST = (6, 95, 70)
EMERALD = (5, 150, 105)
SAGE = (167, 216, 196)
CREAM = (250, 248, 244)

OUT = Path(__file__).resolve().parent.parent / "social"
OUT.mkdir(exist_ok=True)


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([40, weight])
    except Exception:
        pass
    return f


def gradient_base():
    """Void canvas with the constant diagonal dark->green energy in the top right."""
    img = Image.new("RGB", (W, H), VOID)
    grad = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        for_strength = max(0, 1 - ((W - 0) ** 2) ** 0.5 / 1)  # unused, kept simple below
    # radial-ish gradient mask centred top-right
    for y in range(0, H, 2):
        for x in range(0, W, 2):
            d = math.hypot(x - W * 1.05, y + H * 0.05 - 0) / (W * 1.15)
            v = max(0.0, 1.0 - d) ** 2.2
            grad.putpixel((x, y), int(v * 255))
    grad = grad.resize((W, H)).filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(3))
    green = Image.new("RGB", (W, H), FOREST)
    img = Image.composite(green, img, grad)
    glow = Image.new("L", (W, H), 0)
    gdd = ImageDraw.Draw(glow)
    for y in range(0, H, 2):
        for x in range(0, W, 2):
            d = math.hypot(x - W * 1.02, y - H * 0.02) / (W * 0.62)
            v = max(0.0, 1.0 - d) ** 2.6
            glow.putpixel((x, y), int(v * 255))
    glow = glow.resize((W, H)).filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(3))
    brighter = Image.new("RGB", (W, H), EMERALD)
    return Image.composite(brighter, img, glow)


def alpha_draw(img):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return layer, ImageDraw.Draw(layer)


def motif(img, n):
    """One distinct geometric graphic per variant, top-right territory."""
    layer, d = alpha_draw(img)
    cx, cy = 880, 330
    white = lambda a: (255, 255, 255, a)
    sage = lambda a: (*SAGE, a)
    if n == 1:  # open ring + node
        d.ellipse([cx - 200, cy - 200, cx + 200, cy + 200], outline=white(46), width=46)
        d.ellipse([cx + 120, cy - 165, cx + 170, cy - 115], fill=sage(235))
    elif n == 2:  # concentric thin circles
        for r in (90, 140, 190, 240):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=white(42), width=4)
        d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=sage(235))
    elif n == 3:  # dot grid
        for ry in range(5):
            for rx in range(6):
                x, y = cx - 240 + rx * 92, cy - 190 + ry * 92
                hot = (rx + ry) % 4 == 1
                r = 11
                d.ellipse([x - r, y - r, x + r, y + r], fill=sage(225) if hot else white(44))
    elif n == 4:  # diagonal pill bars
        bar = Image.new("RGBA", (70, 480), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bar)
        for i in range(4):
            b = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            bdd = ImageDraw.Draw(b)
            x = cx - 230 + i * 130
            col = (*EMERALD, 210) if i == 2 else white(40)
            bdd.rounded_rectangle([x, cy - 240, x + 62, cy + 240], radius=31, fill=col)
            b = b.rotate(18, center=(cx, cy))
            layer.alpha_composite(b)
    elif n == 5:  # ascending nodes (the roadmap path)
        pts = [(cx - 250, cy + 180), (cx - 90, cy + 10), (cx + 30, cy + 90), (cx + 230, cy - 160)]
        d.line(pts, fill=white(70), width=12, joint="curve")
        for p in pts[:-1]:
            d.ellipse([p[0] - 18, p[1] - 18, p[0] + 18, p[1] + 18], fill=white(95))
        p = pts[-1]
        d.ellipse([p[0] - 24, p[1] - 24, p[0] + 24, p[1] + 24], fill=sage(245))
    elif n == 6:  # open arc + node
        d.arc([cx - 210, cy - 210, cx + 210, cy + 210], start=300, end=210, fill=white(52), width=40)
        d.ellipse([cx - 26, cy - 236, cx + 26, cy - 184], fill=sage(235))
    img.alpha_composite(layer) if img.mode == "RGBA" else img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def build(n, ttf):
    img = gradient_base()
    img = motif(img, n)
    d = ImageDraw.Draw(img)

    kick = font(ttf, 34, 700)
    big = font(ttf, 130, 700)
    sub = font(ttf, 44, 500)
    foot = font(ttf, 30, 500)

    d.rectangle([96, 580, 196, 588], fill=EMERALD)
    d.text((96, 510), "E X E C U T I V E   A I   I N S T I T U T E", font=kick, fill=EMERALD)
    d.text((90, 640), "New article", font=big, fill=CREAM)
    d.text((90, 790), "on Insights", font=big, fill=(52, 211, 153))
    d.text((96, 960), "Leadership thinking for the AI era.", font=sub, fill=(*SAGE,))
    d.text((96, 1090), "executiveaiinstitute.com/insights", font=foot, fill=(250, 248, 244))

    p = OUT / f"new-article-{n}.png"
    img.save(p)
    return p


if __name__ == "__main__":
    ttf = sys.argv[1] if len(sys.argv) > 1 else "/tmp/eaii/fonts/DMSans.ttf"
    for n in range(1, 7):
        print(build(n, ttf))
