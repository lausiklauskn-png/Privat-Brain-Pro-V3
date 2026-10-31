# Brief für die nächste Sitzung: Private Brain V3 für Windows

**Auftrag (Klaus 2026-10-24):** Aus V3 eine Windows-Version machen, mit derselben Methode wie bei der normalen
Private Brain Pro. Freibrief wie üblich: selbst bauen, prüfen, zusammenführen. Eine Veröffentlichung (Release mit
Installer) nur, wenn Klaus sie ausdrücklich will; den Download-Link danach wie üblich nennen.

## Pflichtlektüre

1. `CLAUDE.md` (V3-Anker oben), `BRIEF_ABSCHLUSS_2026-10-24_V3.md`, Kimhub forschung/messungen/privat-brain-v3-2026-10-24.md.
2. Die Pro-Methode: `docs/BAUSTAND-WINDOWS.md`, `docs/GESCHENKPAKET-WINDOWS.md`, `windows/README.md`,
   `.github/workflows/windows-app.yml`. Vorbild-Release in Pro: `windows-v1.0.0-preview.29`
   (Tauri 2, WebView2, NSIS pro Benutzer, unsigniert, eigene Java-Laufzeit für die Mail-Maschine).

## Ausgangslage in V3

- `windows/` und `windows-app.yml` sind 1:1 aus Pro kopiert; der Prüfbau läuft in V3 grün (Artefakte
  `windows-installer`, `windows-installationspruefung`).
- **Achtung, Kollision:** `windows/src-tauri/tauri.conf.json` trägt noch `productName "Private Brain Pro"`,
  `identifier "de.familyprojekt.privatebrain.pro"`, Version `1.0.0-preview.29`. Ein so gebauter V3-Installer würde die
  installierte Pro-App ersetzen und deren Daten teilen. Das zuerst ändern.
- V3 hat keine Release-/Signier-Abläufe (absichtlich). Der Windows-Installer ist ohnehin unsigniert; für ein Release
  braucht es einen eigenen V3-Ablauf, nicht Pros Update-Kanal.

## Schritte

W1 **Eigene Identität:** `productName "Private Brain V3"`, `identifier "de.familyprojekt.privatebrain.v3"`, eigene
   Versionsreihe (`3.0.0-preview.1`), Fenstertitel, Startmenü- und Installer-Namen „Private Brain V3“, eigener
   Datenordner. **Symbol (Klaus 2026-10-24):** die dicke Kugel ist durch vier violett-schwarze Fenster
   ersetzt (jedes etwas anders getönt, die Linien der äußeren Kugeln laufen hinein), darüber ein großes leuchtendes „V3“;
   kein Markenlogo, kein Wort „Windows“: `icon-v3-windows-512.png`/`-192.png`/`.ico` aus
   `tools/native/icon/make-v3-icons.py` (daraus die Tauri-Symbole erzeugen, `npx tauri icon`). Gleiche Kennung wie die künftige
   Android-V3-App (Start-Brief S2), damit beide zusammenpassen.
W2 **V3-Oberfläche im Fenster:** prüfen, dass `windows/` die V3-Dateien bündelt (themes, v3-ui, v3-translate, Strichsymbole,
   Spaltenbreiten, Sortierfeld), nicht nur die Pro-Teile. `windows/engine/build/shared-source.json` neu erzeugen.
W3 **Prüfungen anpassen:** `windows/pruefung/*` (installed.ps1, production.ps1, network.mjs) auf Namen „Private Brain V3“,
   neue Kennung und Datenordner; Neuinstallation neben einer vorhandenen Pro-Installation darf Pro nicht berühren
   (eigene Prüfung).
W4 **Google-Anmeldung am PC:** `windows/gmail-desktop.json` gehört zum Pro-Client. Für V3 einen eigenen Desktop-OAuth-Client
   im Projekt `privat-brain-pro` vorbereiten (Klaus legt ihn an; keine Geheimnisse in Git oder Chat).
W5 **Release-Ablauf für V3** (nur auf Klaus' Wunsch): eigener Workflow `windows-release.yml` in V3 mit Tag
   `v3-windows-3.0.0-preview.N`, Installer, SHA256SUMS, Baubeleg; öffentlicher Download unabhängig nachladen und vergleichen
   (wie in `docs/GESCHENKPAKET-WINDOWS.md`). Danach den Download-Link Klaus geben.
W6 **Herausgeber-Studio:** in der App (Android oder Windows) Schlüssel erzeugen, Sicherung und Ersatzschlüssel aufbewahren,
   den öffentlichen Schlüssel in `native/license-keys.json` eintragen; erst dann wirken Codes auf Käufergeräten.

## Stand 2026-10-24 (W1–W3 gebaut, CI auf GitHub steht aus)

- **W1 erledigt:** `tauri.conf.json` heißt „Private Brain V3 Pro“, Kennung `de.familyprojekt.privatebrain.v3`, Version
  `3.0.0-preview.1`, Programm `private-brain-v3.exe`, Herausgeber „Private Brain V3 Pro“. Damit eigener Installationsordner
  (`%LOCALAPPDATA%\Private Brain V3 Pro`), eigener Datenordner (`%LOCALAPPDATA%\de.familyprojekt.privatebrain.v3`), eigener
  Deinstallationseintrag und eigenes „Öffnen mit“. Fenstertitel, Startfehler, Passwortfenster, Lizenzseite, Gmail-Antwortseite,
  DPAPI-Zusatz (`private-brain-v3-windows|…`) und Installername `Private-Brain-V3-Pro-Windows-…-x64-setup.exe` auf V3.
  Updates sucht V3 nur in `lausiklauskn-png/Privat-Brain-Pro-V3` unter Tags `v3-windows-3.0.0-preview.N` (Pros Kanal
  nie; eigene Kernprobe). Symbol: `icon-v3-windows.ico` (16–256 px) wird unverändert zu `src-tauri/icons/icon.ico`.
- **Name der nativen App (Klaus 2026-10-24): „Private Brain V3 Pro“.** Gilt für Windows (Produktname, Herausgeber,
  Fenstertitel, Startmenü, Installer `Private-Brain-V3-Pro-Windows-…-x64-setup.exe`, Ordner
  `%LOCALAPPDATA%\Private Brain V3 Pro`) und die gemeinsamen nativen Sätze („Zurück zu …“, Speicherort-Hilfe). Die Webfassung
  (Pages) und die Überschrift in der Oberfläche bleiben „Private Brain V3“. Kennung, Programmname, DPAPI-Zusatz, Version und
  Update-Kanal unverändert. Weil „Private Brain Pro“ und „Private Brain V3 Pro“ dieselben Wörter tragen, vergleicht
  `coexist.ps1` Deinstallationseinträge nur exakt (`-ceq`), nie mit Platzhalter oder Anfang.
- **Bleibt absichtlich „pro“:** das Java-Paket `de.familyprojekt.privatebrain.pro` der Mail-Maschine (sie wird aus den
  gemeinsamen Android-Quellen übersetzt, nur ein Code-Name), die Bridge-Namen `ProMail`/`ProVault`…, das Sicherungsformat
  `app:'private-brain-pro'` (eine Pro-Sicherung bleibt in V3 lesbar) und `gmail-desktop.json` (W4).
- **W2 geprüft:** der Windows-Bau nimmt `www/` aus `tools/native/prepare-web.mjs` ganz; `themes.*`, `v3-ui.*`,
  `v3-translate.js` sind drin, Titel „Private Brain V3“. `shared-source.json` entsteht bei jedem Bau neu (24 Quellen).
- **W3 erledigt:** `pruefung/*.ps1` auf neue Namen/Ordner. Neu `pruefung/coexist.ps1`: installiert vorher den echten
  Pro-Installer `windows-v1.0.0-preview.29` (SHA-256 geprüft) und prüft nach V3-Installation, Start, Deinstallation und
  Neuinstallation, dass Pros Dateien, Daten, „Öffnen mit“ und Deinstallationseintrag unverändert sind.
- Lokal grün: `windows/engine/test.mjs` (91), `protocol-test.mjs`, Drift-Guard, `test:native-web`. Der echte
  Windows-Bau läuft nur auf GitHub (windows-latest) und ist noch zu beobachten. W4–W6 offen.

## Grenzen ehrlich nennen

Unsigniert: Windows SmartScreen warnt beim ersten Start („Weitere Informationen → Trotzdem ausführen“). Kein echter
Windows-PC in der Prüfung außer dem GitHub-Rechner; am PC von Klaus oder Jens ungemessen, bis jemand es dort startet.
