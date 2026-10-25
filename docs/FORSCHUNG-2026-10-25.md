# Forschungseinträge 2026-10-25 (Claude, Sitzung Filme · Geschenk · Kim-sync)

Jeder Eintrag sagt, was gemessen wurde, was die Ursache war und woran man es künftig erkennt.

## F1 Wer einen IndexedDB-Wettlauf mit einer Schleife „abwartet“, verursacht ihn selbst

- **Befund:** V3-CI rot: „requested version (7) is less than the existing version (8)“ beim KI-Tresor.
- **Ursache:** Die erste Reparatur fragte `init()` von Modul 01 in einer Schleife ab. Jede Abfrage öffnete die DB neu
  und trieb die Versionsnummer, die sie abwarten sollte.
- **Lösung:** `heal()` öffnet die DB einmal von außen mit Version + 1. Modul 01 bekommt `onversionchange`, schließt und
  vergisst sein `dbPromise`; danach geht `init()` sauber. Modul 01 bleibt byte-1:1.
- **Regel:** Bei einem hängenden Kanon-Modul nicht pollen, sondern das Ereignis auslösen, auf das es selbst hört.

## F2 Ein eingebautes Video darf die Browserfassung nicht erreichen

- Der Film liegt in APK und Windows unter `filme/`. Im Browser lief die Probe zuerst mit der lokalen Datei, obwohl
  Pages sie gar nicht ausliefert (`prepare-pages` löscht `filme/`).
- **Lösung:** `filme.js` prüft zuerst `sameOrigin` (Seite auf github.io) und nimmt dort nur den Stream von FP Video.
- **Regel:** Jede Probe, die „lokal vorhanden“ prüft, braucht eine Gegenrichtung „im Browser nie lokal“.

## F3 Der Service-Worker von Pro lädt eine offene Seite nicht neu

- Klaus sah nach der Veröffentlichung noch „Private Brain Pro“ in der PWA. Der neue Worker übernimmt (`skipWaiting`,
  `claim`), aber die offene Seite bleibt alt, bis sie neu geladen wird.
- **Rat an Klaus:** Menü → „Aktualisieren“ oder App ganz schließen und neu öffnen. Kein Fehler im Bau.

## F4 Ein Knopf mehr in der Kopfleiste kostet bei 320 px Breite 31 px Überlauf

- Kim-sync bekam 🚪 Räume; die vorhandenen Proben maßen bei 320 px sofort 31 px Überlauf (6 rote Zeilen).
- **Lösung:** Bis 340 px weicht 👥 aus der Kopfleiste, „Einladen“ steht im Räume-Fenster. Bei 360 px passt alles.
- **Regel:** Vor jedem neuen Kopfknopf die Breiten 320/360 messen; die Proben in Kim-sync tun das schon.

## F5 Der Name einer geteilten Datei ging im Service-Worker verloren

- Kim-sync legte geteilte Dateien im Vorrat nur mit `content-type` ab; die App machte daraus `File([b], 'geteilt')`.
  Bei Bildern egal, bei einer APK unbrauchbar.
- **Lösung:** Der Worker legt den Namen im Kopf `x-name` (URI-kodiert) dazu, die App liest ihn zurück.

## F6 Dateinamen von fremden Geräten sind Angriffsfläche

- `rechnung‮fdp.exe` sieht auf dem Schirm aus wie `rechnungexe.pdf`. Kim-sync nimmt Steuer- und
  Richtungszeichen und Pfadzeichen aus dem Namen und setzt den Typ selbst (apk, pdf, sonst `octet-stream`), damit der
  Browser nichts anzeigt oder ausführt. Gegenprobe: Richtungszeichen bleibt stehen → TARN-Zeile rot.

## F7 Drei Proben gleichzeitig verfälschen eine Zählung

- Kim-sync-Gegenprobe in drei Wegwerf-Kopien parallel: in allen dreien zusätzlich „das Bild ging in mehreren Teilen
  hinaus → 1 Teile“, einzeln grün. Ursache nicht untersucht (vermutlich geteilte Ressourcen des gestellten Relais).
- **Regel:** Gegenproben einzeln fahren oder die betroffene Zeile als „aus anderem Grund“ benennen.

## F8 Ein Download, der am Handy hängt, liegt nicht unbedingt an der Datei

- V3-APK (49,7 MB): am Handy blieb Chrome bei „wird heruntergeladen“, am Tablet ging es. Die Datei aus dem Behälter
  vollständig geladen: Größe und SHA-256 gleich `SHA256SUMS`, Typ `application/vnd.android.package-archive`.
- Klaus hat die App per Quick Share übertragen. Ursache am Handy nicht gemessen (Netz, Speicher, Chrome).
- **Rat:** WLAN, Chrome ⋮ → Downloads prüfen, Speicher frei; sonst PWA oder Quick Share.

## F9 Im Testbrowser läuft kein H.264

- `canPlayType('video/mp4; codecs="avc1…"')` ist leer. Film-Proben laufen mit einem VP9-Stellvertreter; das echte MP4
  ist nur am Gerät messbar. Gilt für Pro, V3 und FP Video.
