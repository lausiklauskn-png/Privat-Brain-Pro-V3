# Abschlussbericht 2026-10-25 (abends): Anleitungsvideo in den Apps, Geschenk, Kim-sync

Sitzung `session_01BHMn6XzYQ4DtsRudfL8uJ8` (Claude). Sie begann mit V3-Oberfläche, Tresor und Videos
([Brief](BRIEF_NACHFOLGE_2026-10-25_GMAIL-TRESOR-VIDEOS.md)) und endete mit dem Geschenk für Jens und Kim-sync.
Erkenntnisse: [Forschung 2026-10-25](https://github.com/lausiklauskn-png/Kimhub/blob/main/forschung/messungen/privat-brain-v3-2026-10-25.md). Weiter: [Brief](BRIEF_NACHFOLGE_2026-10-26_KIMSYNC-GESCHENK.md).

## Veröffentlicht

| App | Fassung | Download | Größe | SHA-256 |
|---|---|---|---|---|
| Private Brain Pro, Android | 1.0.38 | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.38/Private-Brain-Pro-1.0.38.apk) | 60.853.558 B | `ed563278995f196acaffa345b9be8685a6b9d5f491b86fa745abf0d47ee89f72` |
| Private Brain Pro, Windows | 1.0.38 | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.38/Private-Brain-Pro-Windows-1.0.38-x64-setup.exe) | 101.119.348 B | `bb8389aa2feff6b4734c604a80d2314bb3418ca1dfa7429f710c085a4c4f2b59` |
| Private Brain V3 Pro, Android | 3.0.0-preview.7 | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-android-3.0.0-preview.7/Private-Brain-V3-Pro-3.0.0-preview.7.apk) | 49.658.744 B | `ae5bb3168a481286b95657cb3febf490d26fcc7f216dc4a70665fa467da12095` |
| Private Brain V3 Pro, Windows | 3.0.0-preview.7 | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-windows-3.0.0-preview.7/Private-Brain-V3-Pro-Windows-3.0.0-preview.7-x64-setup.exe) | 91.371.701 B | `e36af07511b9158edb5aaaebe0323ce2be1ce4a42c7e8df2135c0014da3e1426` |

Alle vier über die Release-Abläufe in Actions, Prüfsummen gegen `SHA256SUMS` geprüft. In beiden APKs steckt das
Anleitungsvideo mit SHA-256 `e38a44a5…` (gleich der Datei auf FP Video).

## Was gebaut wurde

1. **Film-Knopf mit ▶ in Pro und V3** (Pro 1.0.38, V3 PR #20): nur das Anleitungsvideo (Klaus: kein
   Werbefilm, sonst überladen). Vorschaubild mit großem ▶ und kurzem Vorladen. `assets/filme.js` ist in beiden Repos
   byte-gleich. In APK und Windows ist der Film **eingebaut** (`tools/native/fetch-films.mjs`, Pins in
   `film-pins.json`); die PWA streamt ihn von FP Video im Rahmen-Spieler. Probe `tools/native/test-filme.mjs`.
2. **PWA ohne „Pro“** (Pro PR #86): Kopfzeile, Titel und Name unter dem Symbol heißen in der Browserfassung
   „Private Brain“ (V3: „Private Brain V3“). „Pro“ tragen nur APK und Windows. Klaus aktualisiert mit dem Knopf
   „Aktualisieren“ im Menü.
3. **V3 Tresor-Wettlauf behoben**: Modul 01 hing nach einem Versionssprung in IndexedDB. `heal()` öffnet die DB von
   außen eine Version höher, das löst `onversionchange` aus; `settled()` fragt nicht mehr selbst in einer Schleife.
4. **Geschenk für Jens** (`https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7`, Fassung 23): drei Apps
   (Private Brain, Private Brain V3, Workflow PDF Pro) mit je einem Logo; je App zuerst die Browser-App (PWA,
   „am einfachsten“), dann Android und Windows; vier Filme; Installationshinweise in kurzen Schritten über die ganze
   Feldbreite (Play Protect, Erlaubnis „Unbekannte Apps“, „Dateien von Google“), Überschrift „Installationshinweise“.
   Quelle liegt nur im Sitzungs-Notizblock (nicht im Repo).
5. **Kim-sync PR #32** (übernommen, `cd17067`): 🚪 Räume mit Liste und Wechsel per Tipp, 🔐 Tresor für die Raum-Codes
   (Passwort, PBKDF2 600 000 → AES-256-GCM), 📎 beliebige Dateien (APK, PDF …) bis 20 MB über die Relais, größer über
   Datei-Post, Teilen aus anderen Apps nimmt jede Datei an. Probe 379 grün · 0 ROT. Einzelheiten im Kim-sync-Anker.

## Geprüft, nicht geprüft

- Geprüft: alle Proben der berührten Repos, Downloads und Prüfsummen, Kim-sync-Gegenprobe (drei Sabotagen, alle
  gefangen).
- **Nicht gemessen:** Tablet und Handy für Film-Knopf, Kim-sync-Räume und -Dateien, Installieren einer APK aus
  Kim-sync; H.264 im Testbrowser (VP9-Stellvertreter); Windows-Setup auf einem fremden Rechner.
- Klaus' Handy: Der Download der V3-APK blieb bei „wird heruntergeladen“ stehen, am Tablet klappte er. Die Datei auf
  GitHub ist heil (vollständig geladen, Prüfsumme gleich). Ursache am Handy unbekannt; Klaus hat die App per Quick
  Share übertragen.
