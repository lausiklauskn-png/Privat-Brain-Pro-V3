# Forschung 2026-10-26: Lighthouse-Leistung der Webfassung

Messwerte, Ursachen und Lehren aus der Sitzung, die V3 im Browser schneller gemacht hat (PR #28). Umsetzung und
Zahlen: [LEISTUNG-PAGES-2026-10-26.md](LEISTUNG-PAGES-2026-10-26.md). Vorlage für Private Brain und Pro:
[Nachfolgebrief](../BRIEF_NACHFOLGE_2026-10-27_LEISTUNG-PB-PRO.md).

## Wie gemessen wird

- **Family Projekt / PWA Toolpoint** messen jede gelistete Seite einmal pro Nacht mit Google Lighthouse 13.5
  (Handy, simuliertes langsames Mobilfunknetz). Eine Nacht = ein Lauf; die Zahl schwankt.
- **Hier nachgemessen** mit Lighthouse 12 (npm, Scratchpad) gegen die selbst gebaute Webfassung, bedient von einem
  kleinen Node-Server mit gzip und `cache-control: max-age=600` unter `/Privat-Brain-Pro-V3/` (wie GitHub Pages).
  github.io ist aus dem Behälter gesperrt; deshalb immer lokal bauen und messen.
- **Schwankung**: derselbe Stand ergab 44 · 52 · 56. Nie einen Einzellauf vergleichen, immer drei pro Stand.
- Der Prüfrechner kam auf 47, Google auf 61. Vergleichen nur innerhalb einer Umgebung.

## Was die Zahl gedrückt hat (V3 vorher)

| Befund | Lighthouse-Stelle | Wirkung |
|---|---|---|
| 50 Skripte im Seitenkörper ohne `defer`, Kette 9,3 s | „Verkettung kritischer Anfragen“, „Rendering blockiert“ | Hauptursache: Erster Inhalt 7,4 s |
| Logo `icon-512.png` (327 KB) für 49 px | „Bilder richtig dimensionieren“ | ¼ aller Bytes |
| Bedeutungs-Modell startet sofort (`initEmbedding()`), Bibliothek 195 KB von jsDelivr + `config.json` | Treemap, Kette | Daten und Rechenzeit bei jedem Besuch; zwei Konsolenfehler (Gute Praxis 96) |
| JavaScript unverkleinert (2,45 MB roh) | „JavaScript komprimieren“ | ~1,2 s |
| 10 Stylesheets im Kopf | „Rendering blockiert“ | viele kleine Anfragen |
| Hilfetext der Bildsuche ist das größte Element und entsteht erst im letzten Skript | „LCP-Aufschlüsselung“: 9,3 s Render-Verzögerung | LCP hängt am letzten Skript |
| Knopf „DE“ blass (`opacity:.6`), Kontrast 2,3 | Bedienbarkeit | −Punkte |
| Postfach-Knopf: sichtbar „Mail“, vorgelesen „Postfach“; „DE“ fehlt im Namen | „Sichtbares Wort im Namen“ | −Punkte |
| Internet-Lampe 18 px, ✕ am Siegel 16 px und über dem Siegel-Knopf | Tippflächen | bleibt offen |

Nicht bewertet (nur Hinweise): Cache-Zeit 10 min (setzt GitHub Pages), 1.628 Elemente im DOM (die fertige Oberfläche
steht im HTML), erzwungene Umbrüche in `pb-arrange.js` (~93 ms) und Modul 17, Springen 0,026.

## Lehren

1. **`defer` muss die alte Reihenfolge exakt halten.** Skripte, die vorher schon `defer` oder `type="module"` trugen
   (im Kopf: `pb-arrange`, `pb-bildbeschreibung`, `pb-3d`, `pb-zielordner`, `installieren`), liefen zuletzt. Bleiben sie
   im Kopf, laufen sie nach dem Umbau zuerst – der Anordnungs-Knopf fehlte (171 Elemente weniger). Lösung: diese Skripte
   ans Ende des Seitenkörpers verschieben. Gefunden durch einen Element-Vergleich vorher/nachher je Tag+Klasse.
2. **Eingebettete Skripte können kein `defer`.** Sie kommen als Dateien nach `web-inline/` (CSP `script-src 'self'`
   erlaubt das), sonst laufen sie vor den verzögerten Dateien, von denen sie abhängen.
3. **Inline-Skripte vor dem ersten `<script src>` im Körper bleiben eingebettet** (z. B. die Kopfleisten-Umstellung),
   sonst springt die Seite.
4. **Das größte Element entscheidet.** Mit `defer` allein blieb LCP 6 s, weil der Hilfetext der Bildsuche erst vom
   letzten Skript angelegt wird. `pb-bildbeschreibung.js` ist byte-gleich mit Pro und steigt aus, wenn es
   `#pb-bild-filter` schon vorfindet – vorab ins HTML legen geht nur mit anderen Kennungen. Lösung: eine optisch
   gleiche Vorab-Zeile `#pb-bild-row-vorab` (`inert`, `aria-hidden`, Regeln aus `help-layout.css` mit
   `#pb-bild-row-vorab` statt `html.pb-help-ready`), die ein `MutationObserver` im selben Schritt entfernt, in dem die
   echte Zeile erscheint. Ergebnis LCP 2,1 s. In echtem Chrome 6/6 die Vorab-Zeile; in Lighthouse 2 von 6 Läufen
   trotzdem die echte (Hochrechnung), dann ~75.
5. **Lighthouse rechnet aus einem schnellen echten Lauf hoch.** Was im schnellen Lauf vor dem ersten Bild passiert,
   zählt in der Hochrechnung voll. Darum bringt `defer` so viel.
6. **Breitere Lampe verschiebt das Siegel.** `native-seal-place.js` rechnet mit festen Abständen; Lampe 18 → 24 px
   machte `test-mycel` rot. Zurückgenommen. Tippflächen bleiben bis zu einer gemeinsamen Lösung fürs Siegel-✕ rot.
7. **Tooltip und Name müssen gleich sein.** `test-compact-network` verlangt `aria-label === title`; beim Ändern des
   Namens beides setzen.
8. **Proben können Bilder neu zeichnen.** `test-themes` schreibt `docs/design/themen-2026-10-24/*.png` neu; vor dem
   Commit `git status` lesen, sonst landen sie mit im PR.
9. **Codex-Prüfung** lief auf beiden PRs ins Kontingent-Limit, keine Befunde. Kein Grund zum Warten.
10. **Windows-Abnahme kann flackern** (Absturz-und-Erholung, 90 s Wartezeit); derselbe Stand war beim nächsten Lauf grün.

## Werkzeuge (nicht im Repo, schnell nachgebaut)

- Server: Node `http` + `zlib.gzipSync`, Basis `/Privat-Brain-Pro-V3/`, `cache-control: max-age=600`.
- Lighthouse: `npm i lighthouse@12` im Scratchpad, `CHROME_PATH=/opt/pw-browsers/chromium-*/chrome-linux*/chrome`,
  `--chrome-flags="--headless=new --no-sandbox"`, Ausgabe JSON; Auswertung der Audits per kleinem Node-Skript.
- Playwright: die vorinstallierte Fassung nutzen (`require('playwright')` ohne eigenes `npm i`), sonst passt der
  Browser nicht.
- LCP im echten Chrome: `PerformanceObserver({type:'largest-contentful-paint'})` per `addInitScript`.
- `npm run build:web` scheitert im Behälter am Film-Download; `index.html` ist dann schon geschrieben. Rest von Hand:
  `tool-icons/`, `semantic-model.json`, `caption-model.json` kopieren, `filme/` löschen, dann `prepare-pages.mjs`.
