# Nachfolge: Private Brain und Private Brain Pro im Browser schneller machen

**Auftrag (Klaus 2026-10-26):** Dieselben Verbesserungen wie bei V3 (PR #28) für **Private Brain** (die PWA) und
**Private Brain Pro** (Webfassung auf Pages). **Zwei getrennte Sitzungen**, je ein Repo. V3 ist erledigt, nicht anfassen.
Ziel: bessere Lighthouse-Werte auf Family Projekt und PWA Toolpoint (dort Leistung, Bedienbarkeit, Gute Praxis,
Auffindbarkeit; nächtliche Messung, Lighthouse 13.5, Handy).

Pflichtlektüre zuerst: [Forschung](https://github.com/lausiklauskn-png/Kimhub/blob/main/forschung/messungen/privat-brain-v3-2026-10-26-leistung.md) (Lehren 1–8!),
[Umsetzung und Zahlen V3](docs/LEISTUNG-PAGES-2026-10-26.md), die Vorlage
[`tools/native/pages-speed.mjs`](tools/native/pages-speed.mjs).

## Ablauf je Repo

1. **Repo holen und Stand messen.** Private Brain: Repo `lausiklauskn-png/Privat-Brain` (in der Sitzung mit
   `add_repo` hinzufügen; aus dieser Sitzung nicht eingesehen, vermutlich reine PWA mit Pages direkt aus dem Repo). Pro: `lausiklauskn-png/Privat-Brain-Pro`,
   Webfassung über `tools/native/prepare-pages.mjs` + `prerender-shell.mjs`, Probe `test-pages.mjs` und
   `test-pages-browser.mjs`, eigener Service Worker mit geprüften Dateigenerationen.
2. **Klaus' Google-Werte** von Family Projekt erfragen (Bildschirmfoto der Bewertung), dann selbst bauen und
   messen: lokaler Server wie Pages (gzip, `max-age=600`, richtiger Unterpfad), Lighthouse 12, **je drei Läufe**.
3. **Ursachen in den Audits lesen** – erwartet sind dieselben wie bei V3: Skriptkette im Seitenkörper, 512-px-Logo im
   Kopf (`<img src="icon-512.png" … width="46">` steht auch in Pro), Bedeutungs-Modell beim Start, unverkleinertes
   JavaScript, viele Stylesheets, das größte Element erst durch ein spätes Skript.
4. **Umsetzen nur im Pages-Bau** (Apps und Quelldateien unverändert, Drift-Guard bleibt grün), Reihenfolge nach Wirkung:
   1. Skripte im Körper `defer`, eingebettete nach `web-inline/`, schon verzögerte/Module ans Ende (Lehre 1–3)
   2. Bedeutungs-Modell: mit Katalog nach `load`, mit leerem Katalog bei der ersten Bedienung
   3. größtes Element früh sichtbar (bei Pro wohl derselbe Bildsuche-Hilfetext → Vorab-Zeile wie V3)
   4. kleines Logo (96 px, ~13 KB)
   5. Stylesheets zu einer Datei (vorher auf relative `url()` prüfen), Schriften `preload`
   6. terser (devDependency), Urheberrechts-Kommentare behalten
   7. Bedienbarkeit: Kontrast, „sichtbares Wort im Namen“ (`aria-label === title` bei Werkzeugknöpfen beachten)
5. **Gleichheit prüfen:** Element-Vergleich vorher/nachher nach dem Laden (je Tag + erste Klasse), keine JS-Fehler,
   Modell-Anfragen erst nach Bedienung, LCP-Einträge im echten Chrome, Repo-Proben (`test-pages`, Drift-Guard,
   `test:native-web` bzw. `npm test` bei Private Brain).
6. **PR als Entwurf, nichts veröffentlichen ohne Klaus' Wort.** Zusammenführen veröffentlicht über Pages.

## Unterschiede, auf die zu achten ist

- **Pro** ist Codex' Repo; Klaus hat diese Arbeit dort ausdrücklich freigegeben. Pros Service Worker prüft
  Dateigenerationen mit Fingerabdrücken: wer im Pages-Bau Dateien verändert oder hinzufügt (`web.css`, `web-inline/`,
  verkleinerte Skripte), muss das **vor** dem Erzeugen der Generation tun, sonst passt der Fingerabdruck nicht.
  Die Reihenfolge in Pros `prepare-pages.mjs` zuerst lesen.
- **Private Brain**: zuerst prüfen, ob es einen Pages-Bauschritt gibt. Wird `index.html` direkt ausgeliefert, braucht es entweder einen
  kleinen Pages-Workflow mit Bauschritt oder die Änderungen direkt in den Quellen – mit Klaus klären, bevor gebaut
  wird. DB-Suffix `privatbrain` und die byte-1:1-Module nie ändern; Cache-Nummer in `sw.js` gegen `origin/main` erhöhen.
- Byte-gleiche Dateien (Pro `native/` ↔ V3 `assets/`): `pb-bildbeschreibung`, `pb-arrange`, `pb-3d`, `pb-zielordner`,
  `native-help`, `help-layout.css`, `native-protect` – nur gemeinsam ändern. Die saubere Lösung für den Hilfetext
  (Skript übernimmt eine vorgefertigte Zeile) wäre so eine gemeinsame Änderung.

## Für Nutzer kurz halten

Klaus: Texte für Nutzer (Geschenk, „Was ist neu“) nur kurz – was, wofür, wie installieren, ein paar Tipps.
Leistungsverbesserungen gehören in die Unterlagen, nicht in solche Texte.
