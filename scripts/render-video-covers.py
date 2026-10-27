#!/usr/bin/env python3
"""
Render the AI video template covers (video/previews/<id>.jpg).

    python3 scripts/render-video-covers.py

The upstream video templates (ai-shortfilm-prompts) ship no stills, so each
genre gets a drawn 16:9 "film still": a scene motif in its own colors, film
grain, letterbox and a play badge. Everything is drawn here with Pillow (no
fonts, emoji or third-party images), so the covers carry this repository's
license. The chooser crops them to 4:3, so motifs stay near the center.
After rendering, video/catalog.json gets `cover: true` for every template with
a cover file. Needs Pillow (python3 -m pip install pillow).
"""
import json
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'video' / 'previews'
CATALOG = ROOT / 'video' / 'catalog.json'
W, H = 1280, 720          # drawn size; saved at half size for smooth edges
SAVE = (640, 360)
QUALITY = 80
FREEFORM_ID = 'freeform'


def rgb(hex_color):
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical(top, bottom, size=(W, H)):
    """Top-to-bottom gradient."""
    strip = Image.new('RGB', (1, 256))
    for y in range(256):
        strip.putpixel((0, y), mix(top, bottom, y / 255))
    return strip.resize(size, Image.BILINEAR)


def radial(size, center, radius, color, alpha=255):
    """A soft round glow on a transparent layer."""
    layer = Image.new('RGBA', size, color + (0,))
    mask = Image.radial_gradient('L').resize((radius * 2, radius * 2), Image.BILINEAR)
    # radial_gradient reaches 181 at the edge midpoints (255 only in the corners): fade out by then.
    mask = mask.point(lambda v: round(max(0.0, 1 - v / 181) ** 1.6 * alpha))
    layer.paste(Image.new('RGBA', mask.size, color + (255,)), (center[0] - radius, center[1] - radius), mask)
    return layer


def glow(base, center, radius, color, alpha=200):
    base.alpha_composite(radial(base.size, center, radius, color, alpha))


def blurred(draw_fn, radius, size=(W, H)):
    """Draw on a transparent layer, then blur it (light, haze, bokeh)."""
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    return layer.filter(ImageFilter.GaussianBlur(radius))


def bokeh(img, rng, colors, count=26, sizes=(30, 110), area=(0, 0, W, H), blur=6):
    def draw(d):
        for _ in range(count):
            r = rng.randint(*sizes)
            x = rng.randint(area[0], area[2])
            y = rng.randint(area[1], area[3])
            d.ellipse((x - r, y - r, x + r, y + r), fill=rng.choice(colors) + (rng.randint(40, 110),))
    img.alpha_composite(blurred(draw, blur))


def silhouette(d, points, color):
    d.polygon(points, fill=color)


def mountains(d, rng, base_y, height, color, step=90):
    pts = [(0, H)]
    x = -step
    while x <= W + step:
        pts.append((x, base_y - rng.randint(height // 3, height)))
        x += rng.randint(step // 2, step)
    pts.append((W, H))
    d.polygon(pts, fill=color)


# ───────────────────────── scenes ─────────────────────────
# Each takes (rng, spec) and returns an RGBA image of size (W, H).

def scene_family(rng, s):
    img = vertical(rgb('2A1D16'), rgb('120C0A')).convert('RGBA')
    glow(img, (W // 2 + 180, 210), 520, rgb('F2B866'), 170)
    bokeh(img, rng, [rgb('F6C77A'), rgb('E59A4C')], 22, (24, 70), (0, 0, W, H // 2), 8)
    d = ImageDraw.Draw(img)
    # Table edge, a steaming bowl and a handwritten recipe card.
    d.rectangle((0, 470, W, H), fill=rgb('3B2416'))
    d.rectangle((0, 462, W, 476), fill=rgb('5A3721'))
    cx = W // 2 - 140
    d.ellipse((cx - 170, 360, cx + 170, 420), fill=rgb('F3EBDD'))
    d.chord((cx - 170, 250, cx + 170, 520), 0, 180, fill=rgb('EADFCB'))
    d.ellipse((cx - 150, 368, cx + 150, 410), fill=rgb('C4762E'))
    steam = blurred(lambda dd: [dd.arc((cx - 60 + i * 40, 200 - i * 10, cx + 10 + i * 40, 360), 200, 340, fill=(255, 245, 230, 120), width=10) for i in range(3)], 6)
    img.alpha_composite(steam)
    card = Image.new('RGBA', (300, 210), rgb('F7EEDC') + (255,))
    cd = ImageDraw.Draw(card)
    for i in range(6):
        y = 40 + i * 28
        cd.line((24, y, 24 + rng.randint(170, 250), y + rng.randint(-3, 3)), fill=rgb('6B4A33'), width=4)
    card = card.rotate(-8, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(card, (W // 2 + 60, 380))
    return img


def scene_cctv(rng, s):
    img = vertical(rgb('1C2420'), rgb('0B100D')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # A corridor in perspective, one door left ajar, a shape at the far end.
    vx, vy = W // 2 + 40, H // 2 - 10
    for x0 in (-200, W + 200):
        d.line((x0, H, vx, vy), fill=rgb('3E4C44'), width=6)
        d.line((x0, -100, vx, vy), fill=rgb('2E3933'), width=6)
    d.rectangle((vx - 70, vy - 90, vx + 70, vy + 60), fill=rgb('060807'))
    d.polygon([(vx - 30, vy + 60), (vx - 18, vy - 50), (vx + 4, vy - 70), (vx + 20, vy - 46), (vx + 26, vy + 60)], fill=rgb('000000'))
    d.polygon([(250, 640), (330, 420), (330, 330), (250, 200)], fill=rgb('5B6B61'))
    glow(img, (vx, vy - 20), 140, rgb('7FA08C'), 70)
    # Scanlines, noise and the camera overlay.
    lines = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)
    for y in range(0, H, 6):
        ld.line((0, y, W, y), fill=(0, 0, 0, 70), width=2)
    img.alpha_composite(lines)
    noise = Image.effect_noise((W // 2, H // 2), 60).resize((W, H)).convert('RGBA')
    noise.putalpha(46)
    img.alpha_composite(noise)
    img = Image.blend(img, Image.merge('RGBA', (*img.convert('L').convert('RGB').split(), img.getchannel('A'))), 0.35)
    d = ImageDraw.Draw(img)
    d.ellipse((150, 120, 182, 152), fill=rgb('E03131'))
    for x, w in ((200, 26), (232, 26), (264, 26)):
        d.rectangle((x, 124, x + w - 6, 148), fill=rgb('E9ECEF'))
    for i in range(8):
        d.rectangle((W - 420 + i * 34, 124, W - 400 + i * 34, 148), fill=rgb('E9ECEF') if i not in (2, 5) else (0, 0, 0, 0))
    for corner in ((130, 100, 1), (W - 130, 100, -1)):
        x, y, k = corner
        d.line((x, y, x + 60 * k, y), fill=rgb('E9ECEF'), width=5)
        d.line((x, y, x, y + 60), fill=rgb('E9ECEF'), width=5)
    return img


def scene_micro_drama(rng, s):
    img = vertical(rgb('3A0D1C'), rgb('12040A')).convert('RGBA')
    glow(img, (W // 2 - 120, H // 2), 360, rgb('FF4D6D'), 140)
    glow(img, (W // 2 + 160, H // 2), 300, rgb('4DABF7'), 110)
    d = ImageDraw.Draw(img)
    # A phone frame with two facing profiles: shot / reverse shot.
    px, py, pw, ph = W // 2 - 150, 70, 300, 580
    d.rounded_rectangle((px, py, px + pw, py + ph), 36, fill=rgb('0C0C12'), outline=rgb('E9ECEF'), width=8)
    d.rounded_rectangle((px + 18, py + 30, px + pw - 18, py + ph - 30), 22, fill=rgb('5C1427'))
    inner = Image.new('RGBA', (pw - 36, ph - 60), (0, 0, 0, 0))
    idd = ImageDraw.Draw(inner)
    idd.rectangle((0, 0, inner.width, inner.height), fill=rgb('7A1B35'))
    idd.ellipse((-60, 140, 110, 330), fill=rgb('1A0A10'))
    idd.rectangle((-60, 300, 120, 520), fill=rgb('1A0A10'))
    idd.ellipse((150, 160, 320, 350), fill=rgb('0E1A26'))
    idd.rectangle((140, 320, 330, 520), fill=rgb('0E1A26'))
    img.paste(inner, (px + 18, py + 30), Image.new('L', inner.size, 255))
    d.rounded_rectangle((px + pw // 2 - 40, py + 12, px + pw // 2 + 40, py + 22), 5, fill=rgb('2B2B33'))
    return img


def scene_trailer(rng, s):
    img = vertical(rgb('0E1626'), rgb('03050A')).convert('RGBA')
    d = ImageDraw.Draw(img)
    mountains(d, rng, 560, 200, rgb('0A1020'))
    # Anamorphic flare across the frame.
    flare = blurred(lambda dd: dd.rectangle((0, H // 2 - 6, W, H // 2 + 6), fill=(110, 170, 255, 210)), 10)
    img.alpha_composite(flare)
    glow(img, (W // 2 + 60, H // 2), 230, rgb('8EC5FF'), 210)
    glow(img, (W // 2 + 60, H // 2), 70, rgb('FFFFFF'), 255)
    for i, r in enumerate((40, 70, 110)):
        x = W // 2 - 220 - i * 150
        d.ellipse((x - r // 3, H // 2 - r // 3, x + r // 3, H // 2 + r // 3), outline=(150, 190, 255, 90), width=3)
    return img


def scene_car(rng, s):
    img = vertical(rgb('1B2433'), rgb('080B12')).convert('RGBA')
    glow(img, (W // 2, 330), 520, rgb('FF922B'), 110)
    d = ImageDraw.Draw(img)
    # Wet road in perspective with light streaks, a low car silhouette.
    d.polygon([(0, H), (W, H), (W // 2 + 60, 380), (W // 2 - 60, 380)], fill=rgb('11161F'))
    streaks = blurred(lambda dd: [dd.line((rng.randint(-200, W), rng.randint(420, 700), W // 2, 390), fill=c + (190,), width=rng.randint(3, 8))
                                  for c in (rgb('FFD43B'), rgb('FF6B6B'), rgb('74C0FC')) for _ in range(5)], 3)
    img.alpha_composite(streaks)
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, 520
    d.polygon([(cx - 330, cy + 40), (cx - 300, cy - 10), (cx - 150, cy - 40), (cx - 70, cy - 110), (cx + 120, cy - 112), (cx + 230, cy - 40),
               (cx + 330, cy - 20), (cx + 345, cy + 40)], fill=rgb('05070B'))
    d.line((cx - 70, cy - 108, cx + 120, cy - 110), fill=rgb('8D99AE'), width=4)
    d.line((cx - 300, cy - 8, cx + 330, cy - 18), fill=rgb('ADB5BD'), width=3)
    for wx in (cx - 200, cx + 210):
        d.ellipse((wx - 62, cy - 10, wx + 62, cy + 114), fill=rgb('0B0D12'), outline=rgb('495057'), width=6)
    glow(img, (cx + 330, cy - 10), 60, rgb('FFF3BF'), 255)
    return img


def scene_product(rng, s):
    img = vertical(rgb('F1F3F5'), rgb('CED4DA')).convert('RGBA')
    glow(img, (W // 2, 260), 420, rgb('FFFFFF'), 255)
    d = ImageDraw.Draw(img)
    # A bottle on a plinth under a key light, with a crisp reflection.
    cx = W // 2
    d.ellipse((cx - 260, 540, cx + 260, 620), fill=rgb('ADB5BD'))
    d.rectangle((cx - 260, 580, cx + 260, H), fill=rgb('ADB5BD'))
    d.ellipse((cx - 260, 520, cx + 260, 600), fill=rgb('DEE2E6'))
    d.rounded_rectangle((cx - 80, 230, cx + 80, 560), 40, fill=rgb('212529'))
    d.rounded_rectangle((cx - 34, 160, cx + 34, 250), 12, fill=rgb('343A40'))
    d.rounded_rectangle((cx - 44, 140, cx + 44, 180), 10, fill=rgb('C9A227'))
    d.rounded_rectangle((cx - 60, 340, cx + 60, 440), 8, fill=rgb('C9A227'))
    shine = blurred(lambda dd: dd.rounded_rectangle((cx - 58, 250, cx - 36, 540), 10, fill=(255, 255, 255, 150)), 4)
    img.alpha_composite(shine)
    rays = blurred(lambda dd: dd.polygon([(cx - 40, -20), (cx + 40, -20), (cx + 300, 620), (cx - 300, 620)], fill=(255, 255, 255, 70)), 30)
    img.alpha_composite(rays)
    return img


def pet(d, cx, cy, scale, color, ear=True):
    """A simple cat silhouette head + body."""
    s = scale
    d.ellipse((cx - 110 * s, cy - 10 * s, cx + 110 * s, cy + 170 * s), fill=color)
    d.ellipse((cx - 80 * s, cy - 120 * s, cx + 80 * s, cy + 20 * s), fill=color)
    if ear:
        d.polygon([(cx - 76 * s, cy - 70 * s), (cx - 70 * s, cy - 160 * s), (cx - 20 * s, cy - 110 * s)], fill=color)
        d.polygon([(cx + 76 * s, cy - 70 * s), (cx + 70 * s, cy - 160 * s), (cx + 20 * s, cy - 110 * s)], fill=color)


def scene_animal_vlog(rng, s):
    img = vertical(rgb('FFE8CC'), rgb('FFC078')).convert('RGBA')
    bokeh(img, rng, [rgb('FFFFFF'), rgb('FFD8A8')], 18, (30, 80), (0, 0, W, H), 10)
    d = ImageDraw.Draw(img)
    # Selfie framing: a corgi-orange cat filling the frame, REC chip and a speech bubble.
    pet(d, W // 2 - 60, 360, 1.6, rgb('E8590C'))
    d.ellipse((W // 2 - 140, 250, W // 2 - 100, 290), fill=rgb('212529'))
    d.ellipse((W // 2 - 20, 250, W // 2 + 20, 290), fill=rgb('212529'))
    d.polygon([(W // 2 - 72, 310), (W // 2 - 48, 310), (W // 2 - 60, 324)], fill=rgb('FFC9C9'))
    d.rounded_rectangle((W // 2 + 150, 150, W // 2 + 430, 270), 40, fill=rgb('FFFFFF'))
    d.polygon([(W // 2 + 180, 250), (W // 2 + 130, 310), (W // 2 + 230, 262)], fill=rgb('FFFFFF'))
    for i in range(3):
        d.ellipse((W // 2 + 220 + i * 60, 196, W // 2 + 244 + i * 60, 220), fill=rgb('F08C00'))
    d.rounded_rectangle((150, 110, 290, 160), 25, fill=rgb('E03131'))
    d.ellipse((168, 124, 190, 146), fill=rgb('FFFFFF'))
    return img


def scene_grandma_cat(rng, s):
    img = vertical(rgb('F8E7C9'), rgb('D9B98C')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # A window of afternoon light, an armchair and the cat curled in it.
    d.rectangle((W // 2 + 80, 90, W // 2 + 420, 430), fill=rgb('FFF4DE'))
    d.line((W // 2 + 250, 90, W // 2 + 250, 430), fill=rgb('B08968'), width=12)
    d.line((W // 2 + 80, 260, W // 2 + 420, 260), fill=rgb('B08968'), width=12)
    beam = blurred(lambda dd: dd.polygon([(W // 2 + 80, 90), (W // 2 + 420, 90), (W // 2 + 120, H), (W // 2 - 380, H)], fill=(255, 240, 200, 110)), 24)
    img.alpha_composite(beam)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((W // 2 - 380, 300, W // 2 + 10, 640), 60, fill=rgb('8C4A2F'))
    d.rounded_rectangle((W // 2 - 340, 440, W // 2 - 30, 600), 40, fill=rgb('A65D3D'))
    d.ellipse((W // 2 - 300, 400, W // 2 - 60, 500), fill=rgb('6C757D'))
    d.ellipse((W // 2 - 120, 380, W // 2 - 40, 450), fill=rgb('6C757D'))
    d.polygon([(W // 2 - 110, 392), (W // 2 - 104, 350), (W // 2 - 82, 384)], fill=rgb('6C757D'))
    d.arc((W // 2 - 300, 420, W // 2 - 140, 520), 120, 250, fill=rgb('495057'), width=12)
    # Knitting yarn on the floor.
    d.ellipse((W // 2 + 120, 560, W // 2 + 200, 640), fill=rgb('C2255C'))
    d.line((W // 2 + 160, 600, W // 2 - 20, 650), fill=rgb('C2255C'), width=4)
    return img


def scene_pet_lifetime(rng, s):
    img = vertical(rgb('FFE3E3'), rgb('FFD8A8')).convert('RGBA')
    glow(img, (W // 2, H // 2), 520, rgb('FFFFFF'), 160)
    d = ImageDraw.Draw(img)
    # Three frames of the same dog: puppy, grown, old — a life on a film strip.
    d.rectangle((0, 190, W, 530), fill=rgb('2B2B2B'))
    for x in range(10, W, 44):
        d.rounded_rectangle((x, 202, x + 24, 218), 4, fill=rgb('F8F9FA'))
        d.rounded_rectangle((x, 502, x + 24, 518), 4, fill=rgb('F8F9FA'))
    for i, (bg, sc, col) in enumerate(((rgb('FFF3BF'), 0.55, rgb('E8590C')), (rgb('D3F9D8'), 0.8, rgb('D9480F')), (rgb('E7F5FF'), 0.8, rgb('ADB5BD')))):
        x0 = 70 + i * 390
        d.rectangle((x0, 236, x0 + 360, 484), fill=bg)
        cx, cy = x0 + 180, 340
        d.ellipse((cx - 110 * sc, cy, cx + 110 * sc, cy + 150 * sc), fill=col)
        d.ellipse((cx - 70 * sc, cy - 110 * sc, cx + 70 * sc, cy + 20 * sc), fill=col)
        d.ellipse((cx - 100 * sc, cy - 90 * sc, cx - 50 * sc, cy + 10 * sc), fill=mix(col, (0, 0, 0), 0.25))
        d.ellipse((cx + 50 * sc, cy - 90 * sc, cx + 100 * sc, cy + 10 * sc), fill=mix(col, (0, 0, 0), 0.25))
    d.polygon([(W // 2 - 20, 600), (W // 2, 580), (W // 2 + 20, 600), (W // 2, 640)], fill=rgb('E03131'))
    d.ellipse((W // 2 - 22, 576, W // 2 + 2, 602), fill=rgb('E03131'))
    d.ellipse((W // 2 - 2, 576, W // 2 + 22, 602), fill=rgb('E03131'))
    return img


def scene_food(rng, s):
    img = vertical(rgb('2B1408'), rgb('0F0703')).convert('RGBA')
    glow(img, (W // 2, 330), 420, rgb('FF922B'), 150)
    d = ImageDraw.Draw(img)
    # Macro on a sizzling bowl of noodles with chopsticks and steam.
    cx, cy = W // 2, 430
    d.ellipse((cx - 330, cy - 60, cx + 330, cy + 60), fill=rgb('1A1A1A'))
    d.chord((cx - 330, cy - 240, cx + 330, cy + 240), 0, 180, fill=rgb('1A1A1A'))
    d.ellipse((cx - 300, cy - 50, cx + 300, cy + 50), fill=rgb('C2410C'))
    for _ in range(22):
        x = rng.randint(cx - 260, cx + 200)
        d.arc((x, cy - 50, x + 90, cy + 40), 180, 360, fill=rgb('FFE066'), width=8)
    d.ellipse((cx + 60, cy - 40, cx + 160, cy + 10), fill=rgb('FFF3BF'))
    d.ellipse((cx + 90, cy - 30, cx + 130, cy), fill=rgb('FAB005'))
    d.line((cx - 40, cy - 30, cx + 360, cy - 300), fill=rgb('8D5A3B'), width=16)
    d.line((cx - 10, cy - 20, cx + 400, cy - 270), fill=rgb('8D5A3B'), width=16)
    steam = blurred(lambda dd: [dd.arc((cx - 200 + i * 110, 60, cx - 100 + i * 110, 380), 200, 340, fill=(255, 240, 220, 120), width=14) for i in range(4)], 10)
    img.alpha_composite(steam)
    bokeh(img, rng, [rgb('FFB86B')], 10, (20, 50), (0, 0, W, 300), 6)
    return img


def scene_drone(rng, s):
    img = vertical(rgb('74C0FC'), rgb('E7F5FF')).convert('RGBA')
    glow(img, (W // 2, 330), 200, rgb('FFFFFF'), 220)
    d = ImageDraw.Draw(img)
    mountains(d, rng, 470, 160, rgb('8CA9C4'))
    mountains(d, rng, 560, 140, rgb('4C6E8F'))
    d.rectangle((0, 600, W, H), fill=rgb('2B4C6B'))
    # Flying through a rock arch: dark frame edges with the vista beyond.
    frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rectangle((0, 0, W, H), fill=rgb('1B2A33') + (255,))
    fd.ellipse((W // 2 - 380, 80, W // 2 + 380, 820), fill=(0, 0, 0, 0))
    img.alpha_composite(frame.filter(ImageFilter.GaussianBlur(3)))
    d = ImageDraw.Draw(img)
    # Motion streaks toward the center.
    for _ in range(26):
        a = rng.uniform(0, math.tau)
        r0, r1 = rng.randint(420, 520), rng.randint(560, 760)
        d.line((W // 2 + math.cos(a) * r0, H // 2 + math.sin(a) * r0 * 0.6, W // 2 + math.cos(a) * r1, H // 2 + math.sin(a) * r1 * 0.6), fill=(255, 255, 255, 60), width=3)
    return img


def scene_timelapse(rng, s):
    img = vertical(rgb('1C1B4D'), rgb('FF8787')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # Star trails in the upper sky, sun setting into the ridge.
    for i in range(14):
        r = 120 + i * 46
        d.arc((W // 2 + 200 - r, -260 - r, W // 2 + 200 + r, -260 + r), 30, 150, fill=(255, 255, 255, 50 + i * 6), width=2)
    glow(img, (W // 2 - 120, 500), 260, rgb('FFD43B'), 230)
    d.ellipse((W // 2 - 190, 430, W // 2 - 50, 570), fill=rgb('FFF3BF'))
    mountains(d, rng, 560, 150, rgb('3B1E4A'), 120)
    mountains(d, rng, 640, 90, rgb('1A0E25'), 80)
    return img


def scene_travel(rng, s):
    img = vertical(rgb('A5D8FF'), rgb('FFF0F6')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # A coastal town: sea, white houses, a backpack strap in the foreground.
    d.rectangle((0, 420, W, H), fill=rgb('1C7ED6'))
    for i in range(6):
        d.line((0, 450 + i * 40, W, 450 + i * 40), fill=(255, 255, 255, 50), width=3)
    for i in range(9):
        x = 120 + i * 120 + rng.randint(-10, 10)
        h = rng.randint(90, 170)
        d.rectangle((x, 420 - h, x + 100, 430), fill=rgb('F8F9FA'))
        if i % 3 == 0:
            d.pieslice((x + 10, 420 - h - 50, x + 90, 420 - h + 30), 180, 360, fill=rgb('1971C2'))
        for wy in range(420 - h + 20, 410, 40):
            d.rectangle((x + 20, wy, x + 40, wy + 22), fill=rgb('74C0FC'))
            d.rectangle((x + 60, wy, x + 80, wy + 22), fill=rgb('74C0FC'))
    glow(img, (W - 220, 120), 120, rgb('FFFFFF'), 230)
    d.polygon([(W - 160, H), (W - 60, 360), (W + 40, 360), (W + 40, H)], fill=rgb('5C3D2E'))
    d.polygon([(W - 120, H), (W - 40, 380), (W - 10, 380), (W - 80, H)], fill=rgb('8B5E3C'))
    return img


def scene_dance(rng, s):
    img = vertical(rgb('2B1238'), rgb('0A0410')).convert('RGBA')
    rays = blurred(lambda dd: [dd.polygon([(x, -20), (x + 60, -20), (W // 2 + 140, 640), (W // 2 - 140, 640)], fill=c + (80,))
                               for x, c in ((W // 2 - 420, rgb('F06595')), (W // 2 + 360, rgb('845EF7')), (W // 2 - 30, rgb('FFFFFF')))], 18)
    img.alpha_composite(rays)
    glow(img, (W // 2, 640), 340, rgb('F06595'), 140)
    d = ImageDraw.Draw(img)
    # A dancer mid-leap.
    cx, cy = W // 2, 360
    col = rgb('0A0410')
    d.ellipse((cx - 30, cy - 170, cx + 30, cy - 110), fill=col)
    d.line((cx, cy - 110, cx + 10, cy + 20), fill=col, width=40)
    d.line((cx, cy - 90, cx - 170, cy - 200), fill=col, width=22)
    d.line((cx, cy - 90, cx + 180, cy - 150), fill=col, width=22)
    d.line((cx + 10, cy + 10, cx - 200, cy + 80), fill=col, width=28)
    d.line((cx + 10, cy + 10, cx + 150, cy + 150), fill=col, width=28)
    d.line((cx + 150, cy + 150, cx + 260, cy + 120), fill=col, width=24)
    d.ellipse((cx - 330, 600, cx + 330, 680), fill=(240, 101, 149, 70))
    return img


def scene_music(rng, s):
    img = vertical(rgb('1A0B2E'), rgb('050208')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # Equalizer bars pulsing behind a singer with a mic, stage lights above.
    bars = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bars)
    for i in range(30):
        x = 30 + i * 41
        h = int(120 + 220 * abs(math.sin(i * 0.55)) + rng.randint(0, 60))
        bd.rounded_rectangle((x, 620 - h, x + 26, 620), 8, fill=mix(rgb('F06595'), rgb('4DABF7'), i / 29) + (200,))
    img.alpha_composite(bars.filter(ImageFilter.GaussianBlur(2)))
    for x in (260, W // 2, W - 260):
        glow(img, (x, 40), 160, rgb('FFF0F6'), 160)
    d = ImageDraw.Draw(img)
    cx = W // 2
    col = rgb('050208')
    d.ellipse((cx - 70, 200, cx + 70, 350), fill=col)
    d.rounded_rectangle((cx - 170, 330, cx + 170, H), 80, fill=col)
    d.line((cx + 40, 330, cx + 110, 250), fill=rgb('ADB5BD'), width=12)
    d.ellipse((cx + 92, 222, cx + 136, 266), fill=rgb('DEE2E6'))
    return img


def scene_fashion(rng, s):
    img = vertical(rgb('F8F0EC'), rgb('E9D5CC')).convert('RGBA')
    glow(img, (W // 2 - 200, 200), 400, rgb('FFFFFF'), 220)
    # Billowing fabric in deep crimson across a seamless backdrop.
    fabric = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fabric)
    for i in range(7):
        pts = []
        for x in range(-40, W + 60, 20):
            y = 260 + i * 34 + 90 * math.sin(x / 190 + i * 0.5) + 40 * math.sin(x / 70 + i)
            pts.append((x, y))
        pts += [(W + 60, H), (-40, H)]
        fd.polygon(pts, fill=mix(rgb('A61E4D'), rgb('5C0A27'), i / 6) + (110,))
    img.alpha_composite(fabric.filter(ImageFilter.GaussianBlur(4)))
    d = ImageDraw.Draw(img)
    # Model silhouette in profile.
    cx = W // 2 + 180
    col = rgb('2B0A17')
    d.ellipse((cx - 40, 110, cx + 40, 200), fill=col)
    d.polygon([(cx - 30, 190), (cx + 30, 190), (cx + 80, 420), (cx + 140, H), (cx - 140, H), (cx - 60, 420)], fill=col)
    return img


def scene_transformation(rng, s):
    img = vertical(rgb('0B1220'), rgb('020409')).convert('RGBA')
    # Energy burst: concentric rings and radial rays from a figure's core.
    cx, cy = W // 2, H // 2 + 20
    rays = blurred(lambda dd: [dd.polygon([(cx, cy), (cx + math.cos(a) * 900, cy + math.sin(a) * 900), (cx + math.cos(a + 0.05) * 900, cy + math.sin(a + 0.05) * 900)],
                                          fill=(34, 211, 238, 110)) for a in [i * math.tau / 36 for i in range(36)]], 4)
    img.alpha_composite(rays)
    d = ImageDraw.Draw(img)
    for r in (120, 200, 290):
        d.ellipse((cx - r, cy - r * 0.35, cx + r, cy + r * 0.35), outline=(103, 232, 249, 180), width=5)
    glow(img, (cx, cy), 220, rgb('67E8F9'), 220)
    d = ImageDraw.Draw(img)
    col = rgb('061018')
    d.ellipse((cx - 34, cy - 210, cx + 34, cy - 140), fill=col)
    d.polygon([(cx - 70, cy - 140), (cx + 70, cy - 140), (cx + 50, cy + 30), (cx - 50, cy + 30)], fill=col)
    d.line((cx - 30, cy + 20, cx - 70, cy + 200), fill=col, width=36)
    d.line((cx + 30, cy + 20, cx + 70, cy + 200), fill=col, width=36)
    d.line((cx - 60, cy - 130, cx - 170, cy - 40), fill=col, width=26)
    d.line((cx + 60, cy - 130, cx + 170, cy - 220), fill=col, width=26)
    return img


def scene_anime_real(rng, s):
    img = Image.new('RGBA', (W, H), rgb('FFFFFF') + (255,))
    left = vertical(rgb('FFDEEB'), rgb('D0BFFF'), (W // 2, H)).convert('RGBA')
    right = vertical(rgb('495057'), rgb('212529'), (W // 2, H)).convert('RGBA')
    glow(right, (W // 4, H // 3), 260, rgb('FFD8A8'), 120)
    # Halftone dots on the drawn half.
    ld = ImageDraw.Draw(left)
    for y in range(0, H, 22):
        for x in range(0, W // 2, 22):
            r = 2 + 4 * (x / (W // 2))
            ld.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 120))
    img.paste(left, (0, 0))
    img.paste(right, (W // 2, 0))
    d = ImageDraw.Draw(img)
    cx = W // 2
    # One face across the split: cel-shaded left, soft-lit right.
    d.ellipse((cx - 170, 140, cx + 170, 520), fill=rgb('FFE3D3'))
    d.pieslice((cx - 190, 90, cx + 190, 420), 180, 360, fill=rgb('5F3DC4'))
    d.polygon([(cx - 190, 260), (cx - 120, 160), (cx - 150, 480)], fill=rgb('5F3DC4'))
    real = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(real)
    rd.ellipse((cx - 170, 140, cx + 170, 520), fill=rgb('D8A48F') + (255,))
    rd.pieslice((cx - 190, 90, cx + 190, 420), 180, 360, fill=rgb('2B1D16') + (255,))
    rd.polygon([(cx + 190, 260), (cx + 120, 160), (cx + 150, 480)], fill=rgb('2B1D16') + (255,))
    rd.ellipse((cx + 50, 280, cx + 110, 330), fill=rgb('3B2A20') + (255,))
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).rectangle((cx, 0, W, H), fill=255)
    img.paste(real.filter(ImageFilter.GaussianBlur(3)), (0, 0), ImageChops.multiply(mask, real.getchannel('A')))
    d = ImageDraw.Draw(img)
    d.ellipse((cx - 130, 260, cx - 40, 350), fill=rgb('FFFFFF'))
    d.ellipse((cx - 110, 270, cx - 50, 345), fill=rgb('7048E8'))
    d.ellipse((cx - 96, 280, cx - 80, 296), fill=rgb('FFFFFF'))
    d.line((cx, 0, cx, H), fill=rgb('FFFFFF'), width=6)
    return img


def scene_cyberpunk(rng, s):
    img = vertical(rgb('1A0B3B'), rgb('05030F')).convert('RGBA')
    glow(img, (W // 2, 520), 520, rgb('F72585'), 90)
    d = ImageDraw.Draw(img)
    # Skyline with lit windows and neon signs, rain over everything.
    x = -20
    while x < W:
        w = rng.randint(70, 150)
        h = rng.randint(220, 560)
        d.rectangle((x, H - h, x + w, H), fill=rgb('0D0820'))
        for wy in range(H - h + 20, H - 20, 26):
            for wx in range(x + 10, x + w - 14, 22):
                if rng.random() < 0.35:
                    d.rectangle((wx, wy, wx + 10, wy + 12), fill=rng.choice([rgb('22D3EE'), rgb('F72585'), rgb('FFD43B')]) + (190,))
        x += w + rng.randint(4, 20)
    signs = blurred(lambda dd: [dd.rounded_rectangle((sx, sy, sx + sw, sy + 26), 12, fill=c + (230,))
                                for sx, sy, sw, c in ((180, 300, 160, rgb('F72585')), (W - 380, 240, 200, rgb('22D3EE')), (W // 2 - 60, 380, 120, rgb('FFD43B')))], 6)
    img.alpha_composite(signs)
    rain = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rain)
    for _ in range(260):
        rx, ry = rng.randint(-100, W), rng.randint(-50, H)
        rd.line((rx, ry, rx + 10, ry + 36), fill=(180, 220, 255, 90), width=2)
    img.alpha_composite(rain)
    d = ImageDraw.Draw(img)
    d.rectangle((0, H - 60, W, H), fill=rgb('0A0618'))
    refl = blurred(lambda dd: [dd.rectangle((sx, H - 58, sx + sw, H), fill=c + (90,)) for sx, sw, c in ((180, 160, rgb('F72585')), (W - 380, 200, rgb('22D3EE')))], 8)
    img.alpha_composite(refl)
    return img


def scene_space(rng, s):
    img = vertical(rgb('050814'), rgb('0B1220')).convert('RGBA')
    d = ImageDraw.Draw(img)
    for _ in range(320):
        x, y, r = rng.randint(0, W), rng.randint(0, H), rng.choice((1, 1, 1, 2, 2, 3))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, rng.randint(90, 255)))
    # A large planet with an atmosphere rim, a station in silhouette.
    glow(img, (W // 2 + 260, H + 180), 620, rgb('22D3EE'), 120)
    d = ImageDraw.Draw(img)
    d.ellipse((W // 2 - 300, H - 200, W // 2 + 820, H + 820), fill=rgb('0E2A3B'))
    d.arc((W // 2 - 300, H - 200, W // 2 + 820, H + 820), 190, 300, fill=rgb('67E8F9'), width=6)
    sx, sy = W // 2 - 230, 250
    col = rgb('ADB5BD')
    d.rectangle((sx - 160, sy - 12, sx + 160, sy + 12), fill=col)
    d.rectangle((sx - 40, sy - 50, sx + 40, sy + 50), fill=rgb('868E96'))
    for px in (sx - 260, sx + 170):
        d.rectangle((px, sy - 70, px + 90, sy + 70), fill=rgb('1C7ED6'))
        for gy in range(sy - 60, sy + 70, 24):
            d.line((px, gy, px + 90, gy), fill=rgb('0B1220'), width=3)
    glow(img, (sx + 40, sy), 40, rgb('FFFFFF'), 200)
    return img


def scene_sports(rng, s):
    img = vertical(rgb('0B1220'), rgb('1E293B')).convert('RGBA')
    glow(img, (W // 2, 160), 360, rgb('FFFFFF'), 120)
    d = ImageDraw.Draw(img)
    # Basketball frozen at the rim, sweat droplets suspended, speed lines.
    for i in range(18):
        y = 120 + i * 30
        d.line((0, y, rng.randint(200, 520), y), fill=(148, 163, 184, 70), width=3)
    d.rectangle((W // 2 + 160, 120, W // 2 + 420, 300), outline=rgb('F8F9FA'), width=8)
    d.rectangle((W // 2 + 240, 210, W // 2 + 340, 280), outline=rgb('F8F9FA'), width=6)
    d.ellipse((W // 2 + 180, 290, W // 2 + 400, 330), outline=rgb('FF6B00'), width=10)
    for i in range(7):
        x = W // 2 + 190 + i * 30
        d.line((x, 318, x + 12, 420), fill=(248, 249, 250, 180), width=3)
    bx, by, r = W // 2 - 60, 250, 120
    d.ellipse((bx - r, by - r, bx + r, by + r), fill=rgb('F76707'))
    d.arc((bx - r, by - r, bx + r, by + r), 0, 360, fill=rgb('5C2B00'), width=6)
    d.line((bx - r, by, bx + r, by), fill=rgb('5C2B00'), width=6)
    d.line((bx, by - r, bx, by + r), fill=rgb('5C2B00'), width=6)
    d.arc((bx - r * 1.6, by - r, bx + r * 0.4, by + r), -50, 50, fill=rgb('5C2B00'), width=6)
    d.arc((bx - r * 0.4, by - r, bx + r * 1.6, by + r), 130, 230, fill=rgb('5C2B00'), width=6)
    for _ in range(26):
        x, y = rng.randint(bx - 300, bx + 300), rng.randint(by + 80, H - 40)
        d.ellipse((x, y, x + 10, y + 14), fill=(186, 230, 253, 200))
    return img


def scene_claymation(rng, s):
    img = vertical(rgb('EBFBEE'), rgb('B2F2BB')).convert('RGBA')
    d = ImageDraw.Draw(img)
    # Soft clay hills, a round house and a lumpy little character.
    for i, col in enumerate((rgb('8CE99A'), rgb('51CF66'), rgb('37B24D'))):
        y = 420 + i * 70
        d.ellipse((-200 + i * 300, y, 700 + i * 300, y + 500), fill=col)
    d.rounded_rectangle((W // 2 + 160, 300, W // 2 + 360, 470), 40, fill=rgb('FFD8A8'))
    d.pieslice((W // 2 + 140, 200, W // 2 + 380, 400), 180, 360, fill=rgb('E8590C'))
    d.rounded_rectangle((W // 2 + 230, 380, W // 2 + 290, 470), 26, fill=rgb('8D5A3B'))
    cx, cy = W // 2 - 140, 430
    d.ellipse((cx - 110, cy - 90, cx + 110, cy + 130), fill=rgb('FFA94D'))
    d.ellipse((cx - 50, cy - 30, cx - 10, cy + 10), fill=rgb('FFFFFF'))
    d.ellipse((cx + 10, cy - 30, cx + 50, cy + 10), fill=rgb('FFFFFF'))
    d.ellipse((cx - 38, cy - 18, cx - 18, cy + 4), fill=rgb('212529'))
    d.ellipse((cx + 22, cy - 18, cx + 42, cy + 4), fill=rgb('212529'))
    d.arc((cx - 40, cy + 20, cx + 40, cy + 70), 20, 160, fill=rgb('862E9C'), width=8)
    # Fingerprint-like texture: faint concentric arcs.
    tex = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tex)
    for r in range(20, 200, 14):
        td.arc((cx - r, cy - r, cx + r, cy + r), 200, 300, fill=(255, 255, 255, 40), width=3)
    img.alpha_composite(tex)
    glow(img, (W - 200, 120), 120, rgb('FFFFFF'), 200)
    return img


SCENES = {
    'family-recipe-farewell': scene_family,
    'found-footage-horror': scene_cctv,
    'micro-drama': scene_micro_drama,
    'movie-trailer': scene_trailer,
    'car-commercial': scene_car,
    'product-commercial': scene_product,
    'animal-vlog': scene_animal_vlog,
    'elderly-cat-companion': scene_grandma_cat,
    'pet-lifetime-narrative': scene_pet_lifetime,
    'food-asmr': scene_food,
    'drone-fpv': scene_drone,
    'nature-timelapse': scene_timelapse,
    'travel-vlog': scene_travel,
    'dance': scene_dance,
    'music-video': scene_music,
    'fashion-film': scene_fashion,
    '15s-transformation': scene_transformation,
    'anime-to-real': scene_anime_real,
    'cyberpunk-city': scene_cyberpunk,
    'sci-fi-space': scene_space,
    'sports-slowmo': scene_sports,
    'claymation': scene_claymation,
}


def finish(img, rng):
    """Grain, vignette, letterbox and the play badge shared by every cover."""
    img = img.convert('RGBA')
    grain = Image.effect_noise((W, H), 28).convert('RGBA')
    grain.putalpha(18)
    img.alpha_composite(grain)
    vignette = Image.radial_gradient('L').resize((W, H), Image.BILINEAR).point(lambda v: max(0, v - 120) * 1.1)
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    shade.putalpha(vignette.point(lambda v: min(150, v)))
    img.alpha_composite(shade)
    d = ImageDraw.Draw(img)
    bar = 34
    d.rectangle((0, 0, W, bar), fill=(0, 0, 0, 255))
    d.rectangle((0, H - bar, W, H), fill=(0, 0, 0, 255))
    badge = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    cx, cy, r = W - 230, H - 120, 46
    bd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(0, 0, 0, 110), outline=(255, 255, 255, 220), width=5)
    bd.polygon([(cx - 14, cy - 22), (cx - 14, cy + 22), (cx + 24, cy)], fill=(255, 255, 255, 235))
    img.alpha_composite(badge)
    return img.convert('RGB').resize(SAVE, Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    # The built-in "free form" entry stays a palette card, as in the image chooser.
    templates = [t for t in catalog['templates'] if t['id'] != FREEFORM_ID]
    missing = [t['id'] for t in templates if t['id'] not in SCENES]
    if missing:
        sys.exit(f'没有封面画法：{", ".join(missing)}')
    for template in templates:
        tid = template['id']
        rng = random.Random(tid)
        image = finish(SCENES[tid](rng, template), rng)
        image.save(OUT / f'{tid}.jpg', 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        template['cover'] = True
        template['aspect'] = '16:9'
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(templates)} 张封面 → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
