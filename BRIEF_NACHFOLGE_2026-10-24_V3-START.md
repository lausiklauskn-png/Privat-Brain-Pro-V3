# Nachfolgebrief: Start der V3-Sitzung (geschrieben 2026-10-24)

**Für die nächste Sitzung in `lausiklauskn-png/Privat-Brain-Pro-V3`.** Hier baut Claude allein. Pro ist Codex' Repo,
dort nicht am Code bauen. Vorgeschichte, Codex-Abgleich und Gesamtplan:
[BRIEF_NACHFOLGE_2026-10-24_THEMEN-KONTAKTE-V3.md](BRIEF_NACHFOLGE_2026-10-24_THEMEN-KONTAKTE-V3.md).

## Klaus' Entscheidungen (2026-10-24, wörtlich)

> „Standard Klar, Kontaktfotos a und b, V3 eigene App. Genau dafür bitte einen neuen Brief machen für eine neue Sitzung.
> Wir starten in der neuen Sitzung.“

1. **Standard-Thema: Klar.** Wer noch nichts gewählt hat, sieht Klar. „Bisher“ bleibt in der Auswahl.
2. **Kontaktfotos: Wege a und b.**
   - a) das Foto aus dem **Android-Adressbuch** (wenn dort eins steht),
   - b) **Foto von Hand zuordnen**: ein Bild an Private Brain Pro V3 teilen → „Als Kontaktfoto für …“.
   - Nicht gewählt: c) Adressbuch zum Bearbeiten öffnen. WhatsApp-Status- und Profilbilder bleiben ausgeschlossen
     (für andere Apps nicht zugänglich; Klaus weiß das).
3. **V3 wird eine eigene App**, die neben Private Brain Pro installiert werden kann.

## Stand zu Beginn

- V3 PR #1 (Zweig der Vorsitzung) enthält: Kopie von Pro main `30c11ea` ohne `signing/` und ohne Release-/Signier-Abläufe,
  vier Themen mit Knopf (`assets/themes.*`), Mail-Seite T2a (`assets/v3-ui.*`), Pages-Ablauf, body-parser 2.4.0.
  CI grün, `npm run test:native-web` grün (865 Prüfungen). **Erst PR #1 zusammenführen** (Klaus' Freibrief zum
  Selbst-Mergen gilt laut NETZWEIT), dann von frischem `origin/main` abzweigen.
- Pages: einmalig in den Repo-Einstellungen → Pages → Source „GitHub Actions“ (Klaus' Klick), danach baut jeder Push
  auf main die Web-Fassung.
- Pro PR #75 (nur Doku) und Codex' PR #76 liegen in Pro; nicht anfassen.

## Aufgaben dieser Sitzung, in dieser Reihenfolge

### S1 Standard-Thema Klar (klein)
- `assets/themes.js`: ohne gespeicherte Wahl `klar` statt `bisher`. Gespeichertes „Bisher“ muss möglich bleiben
  (also „bisher“ ausdrücklich speichern statt den Schlüssel zu löschen).
- `tools/native/test-themes.mjs` nachziehen: Erststart = Klar (Akzent `#2b62c4`), „Bisher“ wählbar und bleibt nach
  Neustart, unbekannter Wert → Klar. Gegenprobe: Standard zurück auf „bisher“ → rot.
- Ist-Bilder in `docs/design/v3-2026-10-24/` neu machen (`PB_CAPTURE_DESIGN=1 node tools/native/test-v3-ui.mjs`).

### S2 Eigene App (V3 neben Pro installierbar)
Alles, was V3 von Pro trennt, an **einer** Stelle festhalten (z. B. `docs/V3-IDENTITAET.md`) und mit einer Probe bewachen.

| Was | Pro (heute auch in V3) | V3 neu (Vorschlag, Klaus bestätigt) |
|---|---|---|
| Android-Paket | `de.familyprojekt.privatebrain.pro` (+ `.preview`, `.preview.debug`) | `de.familyprojekt.privatebrain.v3` (+ gleiche Endungen) |
| Name auf dem Gerät | Private Brain Pro | **Private Brain V3** (kurz, passt unter das Symbol) |
| Capacitor `appId`/`appName` | wie oben | wie Android |
| Windows (Tauri) `identifier`/`productName` | `de.familyprojekt.privatebrain.pro` / Private Brain Pro | `de.familyprojekt.privatebrain.v3` / Private Brain V3 |
| Versionsnummer | 1.0.0-preview.29, Code 29 | **eigene Zählung**, z. B. `3.0.0-preview.1`, Code 1 |
| App-Symbol | hellgrau | gleiches Motiv mit kleiner „V3“-Marke oder anderer Randfarbe, damit beide Apps unterscheidbar sind; Klaus zeigen |
| Daten | eigener Speicher je Paket (Android trennt das von selbst) | kein Datenumzug aus Pro; „Vorhandenen Ordner öffnen“ (Speicherort) geht wie bisher |

Dazu:
- **Signieren:** V3 bekommt einen **eigenen** Signierschlüssel, nie Pros Schlüssel und nie `PB_SIGNING_UNLOCK`.
  Erzeugen nur in GitHub Actions oder bei Klaus, verschlüsselt wie in Pro (`docs/SIGNIERUNG-UND-GITHUB.md`), Geheimnisse
  nur als Repo-Secrets in V3, nie in Git oder Chat. Release-Abläufe aus Pro (`android-release.yml`, `windows-release.yml`)
  erst nach Klaus' Ja mit V3-Kennung neu aufnehmen; kein Release ohne Klaus' ausdrückliche Bitte.
- **Gmail-Anmeldung:** Der Android-OAuth-Client bei Google ist an **Paketname + SHA-1 des Zertifikats** gebunden. V3
  braucht im Google-Cloud-Projekt einen **neuen Android-Client** (und für Windows ggf. einen eigenen Desktop-Client).
  Das macht Klaus in der Google-Konsole; die Sitzung liefert ihm Paketname und SHA-1 und eine Schritt-für-Schritt-Liste.
  Bis dahin: Gmail in V3 ehrlich als „noch nicht eingerichtet“ zeigen, Telekom/WEB.DE/GMX usw. gehen ohne Google.
- **Updates:** V3 darf nie Pros Update-Seite oder Pros Release-Dateien abfragen; eigene Adressen oder vorerst keine.
- **Werkzeuge/Freischaltung:** Freischalt-Codes und Herausgeber-Studio prüfen, ob sie an die Paketkennung gebunden sind;
  wenn ja, für V3 dokumentieren, nicht still umgehen.
- Proben: Kennung, Name und Version in `build.gradle`, `capacitor.config.json`, `strings.xml`, `tauri.conf.json` stimmen
  überein und enthalten nirgends mehr `privatebrain.pro` (Gegenprobe: eine Stelle zurücksetzen → rot).
- Android baut nur in CI (`android.yml`); dort muss der Debug-Bau mit neuer Kennung grün werden.

### S3 Kontaktfotos a und b
Eigener Bauabschnitt, Android-Code, braucht Klaus' Test am Tablet.

- **a) Adressbuch:** Plugin `ProContacts` (`ContactsContract`), Berechtigung `READ_CONTACTS` erst auf Klaus' Tipp
  („Kontaktfotos aus dem Adressbuch zeigen“ in den Einstellungen und beim ersten Mal in der Mail-Liste). Abgleich über
  die Absender-Adresse, klein geschrieben, `googlemail.com` = `gmail.com`. Nur Vorschaubilder (Thumbnail), nur lesen.
- **b) Von Hand:** Teilen-Empfang gibt es schon (`native/native-share.js`, `ProSharePlugin`). Kommt **ein einzelnes
  Bild**, bietet die App zusätzlich „Als Kontaktfoto zuordnen …“ an: Absender aus den bekannten Adressen wählen
  (Suchfeld), Bild zuschneiden auf Kreis, verkleinern (z. B. 192 px), verschlüsselt im Speicherort ablegen wie die
  übrigen Daten, nie ins Netz. Entfernen und Ersetzen möglich. Ein von Hand gesetztes Foto geht vor dem Adressbuch-Foto.
- **Anzeige:** In Mail-Liste und Lesebereich statt Buchstabenkreis das Foto, sonst Buchstabenkreis wie bisher.
  Ohne Erlaubnis, unter Windows oder im Web: Buchstabenkreis.
- **K2 „In WhatsApp schreiben“** gehört laut Gesamtplan dazu; Klaus hat ihn nicht abgewählt. Nur anbieten, wenn das
  Adressbuch einen WhatsApp-Eintrag (`com.whatsapp`) mit Nummer kennt; öffnet `https://wa.me/<Nummer>` über die
  vorhandene sichere Browser-Übergabe. Vor dem Bau kurz bei Klaus nachfragen, ob er ihn jetzt will.
- Proben mit gestelltem Plugin: Foto da / kein Foto / keine Erlaubnis / von Hand gesetzt / entfernt / Windows.
  Android-Instrumentierung in CI. Gegenprobe je Fall.

### S4 Mail-Seite fertig (T2 Rest)
Bedienleiste der Mail-Liste in **eine Zeile oben** (Neue E-Mail als einziger Vollton-Knopf, Löschen, Archivieren,
Verschieben, Spam, Antworten, Weiterleiten, Gelesen, Kennzeichnen, ⟳, ⋯ mit dicken Punkten), keine Wortbrüche, am Handy
nur Symbole mit Hinweistext, Konto- und Ordner-Chips am Handy, Befund „Schutz: nichts aufgefallen“ als Marke mit
Symbol und Text, Senden-Symbol Brief mit Pfeil. Vorher/Nachher-Bilder 412 · 768 · 1280, alle Themen.

Danach weiter nach Gesamtplan: T3 (Weg zum Original sichtbar machen), T4 (übrige Seiten), T5 (Emoji-Wächter).

### Schon erledigt nach diesem Brief (2026-10-24, PR #2)
- **Kompakt:** weniger Leerraum oben, kleinere Kästen/Knöpfe, Erklärtexte der alten Fassung hinter einem „?“ je Kasten
  (Tipp zeigt, zweiter Tipp blendet aus), Strichsymbole statt alter Emojis (Suche, Explorer-Leiste, Dateien,
  Einstellungen; Explorer-Baum/Pfad folgen), sichtbarer Name **Private Brain V3**.
- **Sprech-Sprache:** beim ersten Mikrofon-Tipp „Welche Sprache sprichst du?“, Kürzel neben dem Mikrofon; gilt für
  Suche und Diktat, unabhängig von der Gerätesprache (`PBSpeechLang`, `pb-speech-lang`).
- **Übersetzen beim Lesen:** Knopf neben Antworten/Weiterleiten, Feld mit Zielsprache (`assets/v3-translate.js`).
  Stufe 1 eingebaute Übersetzung des Geräts (Chrome Translator/LanguageDetector), nichts geht hinaus;
  Stufe 3 Mistral (EU) mit Verdecken (Modul 25), KI-Anweisungs-Halt und Bestätigung; ohne Schlüssel kopieren.

### S5 Übersetzung weiter ausbauen (Klaus 2026-10-24: „wie bei Mein Rezeptbuch, notfalls kleines LLM, sonst KI-Weg oder integrierte Übersetzung“)
- „Mein Rezeptbuch“ übersetzt per eigenem Claude-Schlüssel (Haiku), ohne Verdecken (Rezepte sind nicht persönlich).
  Für E-Mails gilt deshalb die Reihenfolge: zuerst auf dem Gerät, dann KI-Weg nur verdeckt.
- **Android-App:** Google **ML Kit On-Device Translation** als Plugin (`ProTranslate`), Sprachpakete einmal laden, dann
  offline; Stufe 1 in der App statt Chrome-API (die WebView hat sie nicht).
- **Stufe 2 kleines Modell:** transformers.js 2.17.2 ist schon gebündelt (Bedeutungssuche). Opus-MT-Modelle
  (`Xenova/opus-mt-de-en` usw., je Richtung ca. 75–100 MB) per Schalter laden wie das e5-Modell, mit SHA-256 in einer
  Liste wie `semantic-model.json`; nur gängige Paare (de↔en, de↔ru, de↔pl, de↔uk, de↔tr …).
- Optional wie Rezeptbuch: Claude-Schlüssel als zweiter KI-Anbieter neben Mistral, gleiche Verdeckung.

## Arbeitsweise und Fallen (aus der Vorsitzung)

- Proben laufen mit `export CB_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (Pfad im Container prüfen).
- `npm run build:web` übernimmt **nur Dateien, die in Git stehen**: neue Dateien vor dem Bauen `git add`.
- Das **Siegel** rastet 152 px vom rechten Rand ein. Nichts dorthin bauen; nach Umsetzen von Elementen ein `resize`
  melden (siehe `assets/v3-ui.js`).
- Die App schreibt bei Sprachwechsel in `firstChild` von Knöpfen. Symbole hinten anhängen, per CSS nach vorn.
- `body` blendet den Hintergrund 0,4 s über: in Proben danach kurz warten.
- `tools/e2e-workspace.mjs` bricht schon in Pro ab (Neuladen, „Target page … closed“); Ursache offen, nicht V3.
- Jede neue Beschriftung in DE/EN/RU/PL, hell und dunkel, alle Themen, 320–1280 px ohne Querlaufen.
- Byte-1:1-Module (Drift-Guard) nie ändern.
- Am Tablet misst nur Klaus; bis dahin „ungeprüft am Gerät“.
- Pro beobachten: neue Funktionen aus Pro main herüberholen und hier notieren (Stand 2026-10-24: nichts Neues, #76 ist Doku).
- Die Mail-Dienst-Lücke `body-parser` (GHSA-27r3-jxmh-p828) besteht in Pro weiter; Codex Bescheid geben, nicht selbst ändern.
