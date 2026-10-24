"""V3-Symbol für die Windows-Fassung (Klaus 2026-10-24): dasselbe Logo, oben rechts (wie das V3-Schild) vier geteilte
blaue Quadrate (stilisiert, kein Markenlogo, kein Wort „Windows“), darin „V3“ in Weiß.
Schreibt icon-v3-windows-512.png, icon-v3-windows-192.png und icon-v3-windows.ico.
Aufruf: python3 tools/native/icon/make-v3-windows-icon.py"""
from PIL import Image, ImageDraw, ImageFont
import os
root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
base = Image.open(os.path.join(root, 'icon-512.png')).convert('RGBA')
S = 512
size, gap = 124, 6                       # ganze Fläche der vier Quadrate und der Spalt dazwischen
x0, y0 = int(S * 0.90) - size, int(S * 0.10)   # oben rechts über den kleinen Kugeln, noch in der sicheren Zone
y1 = y0 + size
half = (size - gap) // 2
layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
d.rounded_rectangle((x0 - 8 + 5, y0 - 8 + 8, x0 + size + 8 + 5, y1 + 8 + 8), radius=18, fill=(0, 0, 0, 60))   # Schatten
d.rounded_rectangle((x0 - 8, y0 - 8, x0 + size + 8, y1 + 8), radius=18, fill=(255, 255, 255, 255))             # heller Rand
blues = [(32, 120, 230), (20, 104, 214), (20, 104, 214), (10, 88, 196)]
for i, (cx, cy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
    l, t = x0 + cx * (half + gap), y0 + cy * (half + gap)
    d.rounded_rectangle((l, t, l + half, t + half), radius=8, fill=blues[i] + (255,))
font = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 70)
text = 'V3'
l, t, r, b = d.textbbox((0, 0), text, font=font)
tx, ty = x0 + (size - (r - l)) // 2 - l, y0 + (size - (b - t)) // 2 - t
d.text((tx + 3, ty + 4), text, font=font, fill=(0, 30, 80, 110))    # leichter Schatten, damit es auf dem Spalt lesbar bleibt
d.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))
out = Image.alpha_composite(base, layer)
out.save(os.path.join(root, 'icon-v3-windows-512.png'), optimize=True)
out.resize((192, 192), Image.LANCZOS).save(os.path.join(root, 'icon-v3-windows-192.png'), optimize=True)
out.save(os.path.join(root, 'icon-v3-windows.ico'), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print('icon-v3-windows-512.png, icon-v3-windows-192.png, icon-v3-windows.ico')
