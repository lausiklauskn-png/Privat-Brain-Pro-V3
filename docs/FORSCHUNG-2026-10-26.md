# Forschung 2026-10-26 (Sitzung 1 des Designumbaus)

Die Unterlagen liegen gemeinsam im Pro-Repo, weil jeder Punkt in Pro und V3 gleich umgesetzt wird:
[Sammlung und Sitzungsplan](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/docs/design/aenderungen-2026-10-26/SAMMLUNG.md) ·
[Abschluss Sitzung 1](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-01.md) ·
[Forschung Sitzung 1](https://github.com/lausiklauskn-png/Privat-Brain-Pro/blob/main/docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-01.md).

V3-eigene Punkte aus Sitzung 1:

- Zählerzeile: `tools/native/v3-prerender.mjs` (zwei `swap`) + `assets/v3-ui.css`.
- Doppelte kurz: neu `assets/v3-dupes.js` (V3 hat kein `window.PBIcons`, darum eigenes Papierkorb-Symbol).
- Zustand/Speicher: `assets/v3-state.js` (gleicher Inhalt wie Pros `native/native-state.js`).
- Beide Dateien stehen in `index.html` hinter `v3-ui.js` und im Vorrat `sw.js` (`private-brain-v94`).
- Probe `tools/native/test-design-26.mjs` (12 Prüfungen) in `test:native-web`.
- ⚠ `tools/e2e-workspace.mjs` bricht in dieser Umgebung auch ohne diese Änderungen ab (mit `git stash` geprüft).
- Die Werkzeugliste von V3 ist älter als die von Pro: kein gesperrter „Workflow PDF Pro“, kein BookLedgerPro, kein
  App-Start. Angleichen ist für Sitzung 6 geplant.
