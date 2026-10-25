"""Android-Symbol für Private Brain V3 Pro (Klaus 2026-10-24): dasselbe Logo wie die V3-Webfassung (großes leuchtendes
„V3“ über der dicken Kugel, icon-v3-512.png aus make-v3-icons.py) wird das App-Symbol, der Startbildschirm-Kreis und
das adaptive Symbol (Vordergrund mit 13 % Rand, Hintergrund #a3a6ad wie die Logo-Kante).
Android nimmt ein einziges Bild aus drawable-nodpi für alle Dichten (mipmap-anydpi*/ic_launcher*.xml zeigen darauf).
Prüft, dass das „V3“ ganz im sicheren Kreis des adaptiven Symbols liegt (66 dp von 108 dp), auch bei runden Masken.
Aufruf: python3 tools/native/icon/export-v3-android-icon.py   (Prüfen ohne Schreiben: --check)"""
import math, os, shutil, sys
from PIL import Image, ImageChops
root = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
source = os.path.join(root, 'icon-v3-pro-512.png')   # native App: mit „Pro“ unter dem V3 (Klaus 2026-10-25)
target = os.path.join(root, 'android/app/src/main/res/drawable-nodpi/private_brain_icon.png')
base = os.path.join(root, 'icon-512.png')                  # dasselbe Logo ohne „V3“: daraus die Lage der Schrift

v3 = Image.open(source).convert('RGBA')
assert v3.size == (512, 512), 'icon-v3-512.png muss 512 × 512 sein'
diff = ImageChops.difference(v3, Image.open(base).convert('RGBA')).convert('L').point(lambda v: 255 if v > 24 else 0)
box = diff.getbbox()
assert box, 'kein „V3“ im Symbol gefunden'
# Adaptive icon: 108 dp layer, foreground inset 13 % on every side → the 512 px picture spans 108 × 0.74 dp.
px_per_dp = 512 / (108 * 0.74)
safe = 33 * px_per_dp                                      # radius of the 66 dp safe circle, in picture pixels
corners = [(x, y) for x in (box[0], box[2]) for y in (box[1], box[3])]
far = max(math.hypot(x - 256, y - 256) for x, y in corners)
assert far < safe, f'„V3“ ragt aus dem sicheren Kreis ({far:.0f} px ≥ {safe:.0f} px)'
print(f'V3 im sicheren Kreis: weitester Punkt {far:.0f} px von der Mitte, Grenze {safe:.0f} px; Schrift {box}')
if '--check' in sys.argv:
    same = open(source, 'rb').read() == open(target, 'rb').read()
    print('Android-Symbol ist das V3-Logo.' if same else 'Android-Symbol weicht vom V3-Logo ab.')
    sys.exit(0 if same else 1)
shutil.copyfile(source, target)
print('V3-Logo als Android-Symbol übernommen:', os.path.relpath(target, root))
