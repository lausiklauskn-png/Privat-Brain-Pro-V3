"""V3-Symbol (Klaus 2026-10-24: „Auch das Icon hat nicht den Text mit V3“).
Nimmt icon-512.png und setzt oben rechts ein Schild „V3“ darauf, innerhalb der sicheren
Zone für maskierbare Symbole (mittlere 80 %). Schreibt icon-v3-512.png und icon-v3-192.png.
Aufruf: python3 tools/native/icon/make-v3-icon.py"""
from PIL import Image, ImageDraw, ImageFont
import os
root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
base = Image.open(os.path.join(root, 'icon-512.png')).convert('RGBA')
S = 512
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 84)
text = 'V3'
d = ImageDraw.Draw(base)
l, t, r, b = d.textbbox((0, 0), text, font=font)
tw, th = r - l, b - t
pw, ph = tw + 46, th + 30
# Klaus 2026-10-24: oben rechts, über den kleinen Kugeln (nicht über der Hauptkugel), noch in der sicheren Zone.
x0 = int(S * 0.90) - pw
y0 = int(S * 0.10)
y1 = y0 + ph
layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ld = ImageDraw.Draw(layer)
ld.rounded_rectangle((x0 + 4, y0 + 8, x0 + pw + 4, y1 + 8), radius=ph // 2, fill=(0, 0, 0, 70))   # weicher Schatten
ld.rounded_rectangle((x0, y0, x0 + pw, y1), radius=ph // 2, fill=(43, 98, 196, 255), outline=(255, 255, 255, 255), width=6)
ld.text((x0 + (pw - tw) // 2 - l, y0 + (ph - th) // 2 - t), text, font=font, fill=(255, 255, 255, 255))
out = Image.alpha_composite(base, layer)
out.save(os.path.join(root, 'icon-v3-512.png'), optimize=True)
out.resize((192, 192), Image.LANCZOS).save(os.path.join(root, 'icon-v3-192.png'), optimize=True)
print('icon-v3-512.png, icon-v3-192.png')
