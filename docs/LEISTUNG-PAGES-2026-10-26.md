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

## Zweiter Schritt: größtes Element und Bedienbarkeit

- **Hilfetext der Bildsuche** (das größte Element) kam mit dem letzten Skript. `pb-bildbeschreibung.js` (byte-gleich mit
  Pro) bleibt unverändert; `pages-speed.mjs` setzt eine Vorab-Zeile mit gleichem Aussehen ins HTML (`inert`,
  `aria-hidden`, Regeln aus `help-layout.css` übernommen). Sobald die echte Zeile da ist, verschwindet sie im selben
  Schritt; bei anderer Sprache oder zugeklappter Hilfe gar nicht erst gezeigt. Gemessen: gleiche Lage und Größe
  (y 228, 400 × 143), danach genau eine Zeile; in Chrome war in 6 von 6 Läufen die Vorab-Zeile das größte Element.
- **Postfach-Knopf**: vorgelesener Name und Tooltip „Mail – Postfach“ (das sichtbare Wort steht im Namen),
  `native-toolbar.js`, für alle V3-Fassungen.
- **Sprach-Knopf „DE“**: nicht mehr blass (Kontrast 2,3 → über 4,5), „noch nicht gewählt“ als gepunktete Linie; Name
  beginnt mit „DE – …“ (`v3-ui.js`/`.css`, `v3-prerender.mjs`).

Gemessen danach (drei Läufe): **Leistung 98 · 98 · 98**, Bedienbarkeit **95**, Gute Praxis 100, Auffindbarkeit 100;
erster Inhalt 1,5 s, größtes Element 2,1 s. In einer früheren Sechser-Reihe kippten 2 Läufe auf 74/75: Lighthouse zählte
dort die echte Zeile; im echten Chrome nicht nachgestellt.

## Grenzen

- Tippflächen bleiben bei Lighthouse rot: das ✕ am Siegel-Widget (16 px, überdeckt den Siegel-Knopf). Die Internet-Lampe
  breiter zu machen verschiebt das Siegel (`test-mycel` rot) und wurde zurückgenommen.
- Cache-Zeit 10 min setzt GitHub Pages fest.
- Google misst auf eigenem Rechner; die Zahl dort wird abweichen. Nicht am Tablet gemessen.
