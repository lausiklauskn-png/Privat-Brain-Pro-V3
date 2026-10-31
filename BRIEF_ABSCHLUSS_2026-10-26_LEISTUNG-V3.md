# Abschluss 2026-10-26: V3 im Browser schneller, Geschenk kurz

## Erledigt und übernommen (Klaus' Wort)

| Was | Wo | Stand |
|---|---|---|
| V3-Webfassung schneller: Skripte `defer` in gleicher Reihenfolge, kleines Logo, Bedeutungs-Modell später, ein Stylesheet, Schriften vorab, JavaScript verkleinert, Vorab-Zeile für den Hilfetext der Bildsuche | V3 PR #28, `tools/native/pages-speed.mjs` (nur Pages) | auf main `d39eb88`, Pages-Lauf 40392618401 grün, online |
| Bedienbarkeit für alle V3-Fassungen: „Mail – Postfach“ als Name und Tooltip, Sprach-Knopf „DE“ nicht mehr blass und „DE – …“ im Namen | `native/native-toolbar.js`, `assets/v3-ui.js`/`.css`, `v3-prerender.mjs` | mit PR #28 |
| Geschenk für Jens als Kurzfassung (882 → 242 Wörter): je App ein Satz und drei Knöpfe, ein Tipp-Block, Filme, keine Emojis | Artifact Fassung 26, Pro PR #95 `docs/geschenk/geschenk-jens.html` | auf Pro main `295bab2` |
| Anker | V3 `CLAUDE.md` (oben), Pro `CLAUDE.md` (Geschenk-Regel) | auf main |

## Zahlen (Prüfrechner, Lighthouse 12, Handy, je 3 Läufe)

| | vorher | nachher |
|---|---|---|
| Leistung | 44 · 52 · 56 | 98 · 98 · 98 |
| Erster Inhalt | 7,4 s | 1,5 s |
| Größtes Element | 9,1 s | 2,1 s |
| Bedienbarkeit | 91 | 95 |
| Gute Praxis | 96 | 100 |

Google (Family Projekt) maß vorher 61. Die neue Google-Zahl kommt mit der nächsten Nachtmessung; Klaus schickt sie.
In 2 von 6 Läufen einer früheren Reihe kippte Lighthouse auf ~75 (zählte die echte statt der Vorab-Zeile).

## Offen

- **Tippflächen** (Lighthouse rot): ✕ am Siegel-Widget 16 px über dem Siegel-Knopf; Lampe breiter verschiebt das
  Siegel. Braucht eine gemeinsame Lösung mit `native-seal-place.js`.
- **Hilfetext der Bildsuche** sauber lösen statt Vorab-Zeile: `pb-bildbeschreibung.js` (byte-gleich mit Pro) so
  ändern, dass es eine vorgefertigte Zeile übernimmt. Nur gemeinsam mit Pro.
- `pb-arrange.js` misst beim Start mehrfach (erzwungene Umbrüche ~93 ms), ebenfalls byte-gleich mit Pro.
- Nicht am Tablet gemessen. Die Apps (Android/Windows) haben die Beschleunigung nicht, nur die zwei Knopf-Korrekturen;
  kein App-Release ausgelöst.

## Klaus' Regeln aus dieser Sitzung

- **„Was ist neu“ und Geschenk: kurz.** Nur was, wofür, wie installieren, ein paar Tipps. Verbesserungen, Messwerte,
  Prüfrechner gehören nicht in Texte für Nutzer – „wie in der Werbung“.
- **Nächste Sitzungen:** dieselbe Verbesserung für **Private Brain** (PWA) und **Private Brain Pro**, jeweils getrennt,
  wenn das Budget wieder da ist. Brief: [BRIEF_NACHFOLGE_2026-10-27_LEISTUNG-PB-PRO.md](BRIEF_NACHFOLGE_2026-10-27_LEISTUNG-PB-PRO.md).

Forschung: [Kimhub forschung/messungen/privat-brain-v3-2026-10-26-leistung.md](https://github.com/lausiklauskn-png/Kimhub/blob/main/forschung/messungen/privat-brain-v3-2026-10-26-leistung.md) ·
Messung und Umsetzung: [docs/LEISTUNG-PAGES-2026-10-26.md](docs/LEISTUNG-PAGES-2026-10-26.md).
