# Schnellerer Start der Webfassung (2026-10-26)

Anlass: Family Projekt misst die V3-Webfassung nachts mit Lighthouse, Leistung **61** (Handy, langsames Mobilfunknetz).
Klaus hat die Einzelwerte geschickt: 9,3 s „Verzögerung beim Rendering“, eine Kette aus 50 nacheinander geladenen
Skripten, 327 KB Logo für 49 px, die Bibliothek des Bedeutungs-Modells (195 KB) beim Start.

## Was geändert ist (nur Browserfassung)

`tools/native/pages-speed.mjs`, aufgerufen am Ende von `prepare-pages.mjs`. Apps (Android, Windows) und alle Quelldateien
bleiben unverändert; geschützte Module werden nur in der ausgelieferten Kopie verkleinert (Drift-Guard prüft die Quellen).

1. Logo `icon-kopf-96.png` (13 KB) statt `icon-512.png` (335 KB).
2. Bedeutungs-Modell: mit Katalog nach dem Laden der Seite, mit leerem Katalog erst bei der ersten Bedienung.
3. Zehn Stylesheets als eine Datei `web.css`, die drei Schriften vorab (`preload`).
4. Skripte im Seitenkörper laden gleichzeitig und laufen nach dem Zeichnen (`defer`), Reihenfolge exakt wie vorher:
   eingebettete Skripte liegen dafür in `web-inline/`, die schon vorher verzögerten Skripte stehen am Ende.
5. JavaScript mit terser verkleinert (2.451 → 1.379 KB unkomprimiert), Urheberrechts-Kommentare bleiben.

## Gemessen (Lighthouse 12, Handy, je drei Läufe, Prüfrechner, nicht Google)

| | vorher | nachher |
|---|---|---|
| Leistung | 44 · 52 · 56 | 76 · 77 · 78 |
| Erster Inhalt | 7,4 s | 1,5 s |
| Größtes Element | 9,1 s | 6,0 s |
| Blockierzeit | 170–530 ms | 60–120 ms |
| Springen | 0,033–0,039 | 0,003 |
| Gute Praxis | 96 | 100 |

Seite nach dem Laden elementgleich mit vorher (gezählt je Element), keine Fehler; `test-pages` 12 grün, Drift-Guard 22 gleich.

## Grenzen

- Das größte Element bleibt der Hilfetext der Bildsuche: `pb-bildbeschreibung.js` legt ihn an und muss zuletzt laufen.
  Ihn vorab ins HTML zu legen verlangt eine Änderung dieser mit Pro byte-gleichen Datei, also nur gemeinsam mit Pro.
- Bedienbarkeit (91: Kontrast „Sprech-Sprache“, kleine Tippflächen) ist nicht angefasst.
- Cache-Zeit 10 min setzt GitHub Pages fest.
- Google misst auf eigenem Rechner; die Zahl dort wird abweichen. Nicht am Tablet gemessen.
