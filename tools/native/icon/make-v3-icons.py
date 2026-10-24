"""V3-Symbole (Klaus 2026-10-24): das „V3“ wird zum Herz des Logos statt zu einem Aufkleber.
- icon-v3-*.png: das Logo mit großem „V3“ direkt über der dicken Kugel, im Licht ihres Kerns (hell-golden,
  dunkel-violetter Rand).
- icon-v3-windows-*.png/.ico: die dicke Kugel wird durch vier Fenster in violett-schwarzem Glanz ersetzt, jedes etwas
  anders getönt; die Verbindungen der äußeren Kugeln laufen in die Fenster; darüber dasselbe große „V3“.
Alles liegt mittig, also auch in runden, iOS- und Samsung-Formen vollständig sichtbar.
Aufruf: python3 tools/native/icon/make-v3-icons.py"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import os
root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
S = 512
C = (272, 250)                    # Mitte der dicken Kugel (gemessen an icon-512.png)
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
if not os.path.exists(FONT): FONT = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
base = Image.open(os.path.join(root, 'icon-512.png')).convert('RGBA')

def glow(mask, color, radius, strength=1.0):
    g = Image.new('RGBA', (S, S), color + (0,))
    a = mask.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, int(v * strength)))
    g.putalpha(a); return g

def vgrad(w, h, top, bottom):
    g = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(g)
    for y in range(h):
        t = y / max(1, h - 1); d.line((0, y, w, y), fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    return g

def v3_text(img, cx, cy, height, outline=6):
    """Großes „V3“ im Licht der dicken Kugel: hell-goldener Kern, dunkel-violetter Rand, weicher Schein."""
    font = ImageFont.truetype(FONT, height)
    d = ImageDraw.Draw(Image.new('L', (S, S)))
    l, t, r, b = d.textbbox((0, 0), 'V3', font=font)
    x, y = int(cx - (r - l) / 2 - l), int(cy - (b - t) / 2 - t)
    m = Image.new('L', (S, S)); ImageDraw.Draw(m).text((x, y), 'V3', font=font, fill=255)
    out = img.copy()
    out = Image.alpha_composite(out, glow(m, (255, 175, 70), 9, 0.9))       # weicher goldener Schein (nah am Text)
    edge = m.filter(ImageFilter.MaxFilter(outline * 2 + 1))
    rim = Image.new('RGBA', (S, S), (34, 16, 70, 255)); rim.putalpha(edge)
    out = Image.alpha_composite(out, rim)                                   # dunkel-violetter Rand
    body = vgrad(S, S, (255, 248, 220), (255, 160, 50)); body.putalpha(m)
    out = Image.alpha_composite(out, body)                                  # hell-goldener Körper
    hi = Image.new('L', (S, S)); ImageDraw.Draw(hi).rectangle((0, y, S, y + int((b - t) * 0.38)), fill=90)
    hi = ImageChops.multiply(hi.filter(ImageFilter.GaussianBlur(3)), m.filter(ImageFilter.MinFilter(3)))
    shine = Image.new('RGBA', (S, S), (255, 255, 255, 255)); shine.putalpha(hi)
    return Image.alpha_composite(out, shine)                                # Glanz oben

def save(img, name, ico=False):
    img.save(os.path.join(root, name + '-512.png'), optimize=True)
    img.resize((192, 192), Image.LANCZOS).save(os.path.join(root, name + '-192.png'), optimize=True)
    if ico: img.save(os.path.join(root, name + '.ico'), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])

# 1) V3: großes „V3“ direkt über der dicken Kugel.
save(v3_text(base, C[0], C[1] + 2, 112), 'icon-v3')

# 2) V3 Windows: dicke Kugel durch vier Fenster ersetzen.
win = base.copy()
cover = Image.new('L', (S, S)); ImageDraw.Draw(cover).ellipse((C[0] - 96, C[1] - 96, C[0] + 96, C[1] + 96), fill=255)
cream = Image.new('RGBA', (S, S), (250, 243, 236, 255)); cream.putalpha(cover.filter(ImageFilter.GaussianBlur(10)))
win = Image.alpha_composite(win, cream)                                     # Kugel weg, warmer Hintergrund bleibt
size, gap = 186, 14
x0, y0 = C[0] - size // 2, C[1] - size // 2
half = (size - gap) // 2
tones = [((66, 34, 132), (8, 4, 22)), ((52, 26, 112), (6, 3, 18)), ((44, 22, 98), (5, 2, 14)), ((60, 30, 124), (7, 4, 20))]   # violett-schwarz, jedes etwas anders
frame = Image.new('L', (S, S)); fd = ImageDraw.Draw(frame)
for i, (cx, cy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
    l, t = x0 + cx * (half + gap), y0 + cy * (half + gap)
    fd.rounded_rectangle((l, t, l + half, t + half), radius=14, fill=255)
win = Image.alpha_composite(win, glow(frame, (140, 80, 255), 10, 0.9))      # violetter Schein wie an den Kugeln
for i, (cx, cy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
    l, t = x0 + cx * (half + gap), y0 + cy * (half + gap)
    m = Image.new('L', (S, S)); ImageDraw.Draw(m).rounded_rectangle((l, t, l + half, t + half), radius=14, fill=255)
    rim = Image.new('RGBA', (S, S), (180, 150, 255, 255)); rim.putalpha(m)
    win = Image.alpha_composite(win, rim)
    inner = Image.new('L', (S, S)); ImageDraw.Draw(inner).rounded_rectangle((l + 3, t + 3, l + half - 3, t + half - 3), radius=12, fill=255)
    body = vgrad(S, S, tones[i][0], tones[i][1]); body.putalpha(inner)
    win = Image.alpha_composite(win, body)
    hi = Image.new('L', (S, S)); ImageDraw.Draw(hi).ellipse((l - 10 + i * 3, t - half * 0.55, l + half * 0.9, t + half * 0.42 + i * 2), fill=70)
    hi = ImageChops.multiply(hi.filter(ImageFilter.GaussianBlur(8)), inner)
    shine = Image.new('RGBA', (S, S), (255, 255, 255, 255)); shine.putalpha(hi)
    win = Image.alpha_composite(win, shine)                                 # jedes Fenster mit eigenem Glanzlicht
save(v3_text(win, C[0], C[1] + 2, 84, outline=5), 'icon-v3-windows', ico=True)
print('icon-v3-512/192.png, icon-v3-windows-512/192.png, icon-v3-windows.ico')
