# Brief für die nächste Sitzung: Werbefilm und Handbuchvideo im neuen Design (Private Brain Pro)

**Auftrag (Klaus 2026-10-25):** Werbefilm und Handbuchvideo neu aufnehmen, im neuen Design. **Nur mit Private Brain Pro**
(Codex' neu gestaltete Fassung, ab Android v1.0.0-preview.34), **nicht mit V3**. Begründung von Klaus: In Pro laufen die
E-Mails schon, dort ist alles eingerichtet. Danach kommen die neuen Filme ins Geschenk für Jens.

## Wo gearbeitet wird

- Repo **`lausiklauskn-png/Privat-Brain-Pro`**. Das ist Codex' Repo. Dort **keinen App-Code ändern**. Nur die
  Film- und Handbuch-Werkzeuge unter `docs/film/` und `docs/handbuchvideo/` benutzen und anpassen, so wie in den
  Film-Sitzungen vom 2026-10-23 (PR #73). Eigener Zweig, eigene PR, nur Doku und Werkzeuge.
- Vorher `git fetch` und von frischem `origin/main` abzweigen: Codex hat am 2026-10-24 viel umgebaut (PR #76–#80).

## Was sich seit den Filmen vom 2026-10-23 in Pro geändert hat (aus Codex' PRs, vor dem Aufnehmen selbst ansehen)

- **#76:** vier Farbthemen, kompakte Hauptnavigation, Mail-Aktionen mit Text, Senden oben, Cc/Bcc einklappbar.
- **#77:** automatische lokale Übersetzung unter der Mail, Diktatsprache an der Suche, DeX/Tablet einspaltig.
- **#78:** Liniensymbole statt Emojis, verstellbare Bereiche in Explorer und Postfach, drehende Punkte bei langsamen Aktionen.
- **#79:** lokale Texterkennung für Bilder und Scans (Tesseract, DE/EN/RU/PL).
- **#80:** Suche mit Schalter „Bedeutung“ und Lupe (keine Namenssuche mehr als eigener Knopf), Sprachkürzel in der
  Suchleiste, ein Sortiermenü, Erklärungen hinter Linien-i, Bereinigung echter Doppel.

Das heißt für die Filme:
- `aufnahme.mjs` (Film und Handbuch) braucht vermutlich neue Selektoren. Alle Klickpfade gegen den neuen Stand prüfen.
- Handbuch-Kapitel neu schneiden:
  - „Suchen (Bedeutung, Name, 🎤)“ wird zu „Suchen (Bedeutung, Sprache am Mikrofon)“.
  - Neu dazu: Farbthemen, Übersetzen unter der Mail, Texterkennung im Bild, Spalten ziehen.
- Werbefilm: Puzzle-Aufbau, Musik-Mix und Schluss bleiben. Nur die Seitenbilder kommen neu aus der neuen Oberfläche,
  inklusive Siegel: ★ in der Kugel, kein Wort „SIEGEL“.

## Wie (unverändert gültig)

- Anleitung: `docs/film/README.md` (Werbefilm 1:45, 1920×1080, quer + hochkant) und `docs/handbuchvideo/README.md`
  (Handbuch etwa 3:15 quer in zwei Musikfassungen, hochkant mit Corporate Uplifting; Bühne `buehne.html`, Comic-Hand).
- **Nur erfundene Daten** (`beispiel/`, `beispiel-hoch/`, Konten `@example.invalid`). Nie echte Mails oder Adressen von Klaus.
- **Musik:** Die Dateien kommen nie ins Repo. Sie stammen von der FP-Videoseite bzw. von Pixabay (Klaus wählt selbst aus).
- **Ausgabe:** yuv420p, H.264 High. Nur Full HD auf der FP-Videoseite (Family-Projekt.de-Video). Die bisherigen IDs
  ersetzen: `private-brain-pro-film`, `-film-hoch`, `-handbuch`, `-handbuch-uplifting`, `-handbuch-hoch-uplifting`.
- Keine Worte wie „in Heimarbeit gebaut“.

## Danach: Geschenk für Jens

Artifact `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7` (erst mit der Artifact-Aktion „read“ lesen, dann an dieselbe
Adresse veröffentlichen).
- **Stand 2026-10-25:** Android Pro .34, Windows nach Codex' neuer Windows-Fassung (prüfen: neuester `windows-*`-Release in
  Pro), Workflow PDF Pro 1.0.3 (diese Sitzung hatte keinen Zugriff aufs Workflow-PDF-Pro-Repo; Klaus fragen oder
  `add_repo`).
- Die Filme auf der Seite auf die neuen Fassungen umstellen. Danach Klaus den Link zum Teilen geben.

## Grenzen ehrlich nennen

Die Filme zeigen die App im Browser mit nachgestellten Android-Teilen. Auf dem Tablet wurde damit nichts gemessen.
