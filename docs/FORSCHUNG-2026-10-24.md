# Forschungseinträge 2026-10-24 (V3, Claude)

Erkenntnisse aus der Sitzung, in der V3 kompakt, installierbar und verstellbar wurde (PR #1–#5). Jeder Eintrag sagt, was
gemessen wurde, was die Ursache war und woran man es künftig erkennt.

## F1 GitHub Pages veröffentlichte doppelt und überschrieb V3

- **Befund:** Klaus sah „Private Brain“ ohne V3, alte Emojis, schmale Ansicht, obwohl der Pages-Ablauf grün war.
- **Ursache:** Pages-Quelle stand noch auf „Bereitstellung von einem Branch“. Nach jedem Bau aus `www` legte GitHub
  (`pages-build-deployment`) drei Sekunden später die rohe `index.html` aus dem Zweig darüber.
- **Erkennen:** in den Actions-Läufen neben „Pages“ ein Lauf „pages build and deployment“ auf demselben Commit.
- **Lösung:** Quelle „GitHub Actions“ (nur der Besitzer kann umstellen; Klaus hat es am 2026-10-24 getan).

## F2 Der Vorrat (`caches`) gehört dem ganzen Ursprung

- Auf `lausiklauskn-png.github.io` liegen viele Apps; `caches.keys()` sieht alle. Die alte Pro-/PWA-Fassung räumte jeden
  Vorrat mit Präfix `private-brain-` weg, also auch den der alten Private-Brain-PWA.
- **Regel für V3-Web:** eigener Präfix `pbv3-web-`, nie fremde Vorräte löschen. Auch die Bedeutungssuche legt einen
  eigenen Vorrat an (`transformers-cache`); Proben dürfen nur „eigener da, `private-brain-` nie angelegt“ prüfen.
- Geräte mit der alten Fassung: der neue Worker lädt offene Fenster einmal neu (Merker `pbv3-web-alt-ersetzt`).

## F3 Endlosschleife zwischen App-Code und Verzierung

- **Befund:** Android-Starttest hing (Espresso: kein Fensterfokus, Lauf nach 20 min abgebrochen); im Browser unsichtbar.
- **Messung:** im Leerlauf rund 8.600 DOM-Änderungen je Sekunde (main: 210 in 3 s).
- **Ursache:** „Alle prüfen“ verglich seinen Text mit `textContent`; die V3-Verzierung (Strichsymbol statt Emoji) änderte
  ihn, der Knopf schrieb neu, die Verzierung kam wieder.
- **Lösung:** Vergleich mit `data-text`; Schutz in `v3-ui.js` ab 200 Umschreibungen in 2 s (20 war zu streng:
  Fortschrittsanzeigen schreiben Dutzende Male). Probe „Seite im Leerlauf ruhig“.
- **Regel:** Wer App-Knöpfe verziert, muss eine Ruhe-Probe haben. Fremder Code, der `textContent` vergleicht, ist ein
  Kandidat für Schleifen.

## F4 Ein Schalter statt zwei Knöpfe ändert die Bedeutung eines Klicks

- Aus „Namenssuche | Bedeutungssuche“ wurde ein Schalter „Bedeutung“. Fünf ältere Proben klickten zur Sicherheit auf
  den schon aktiven Knopf; jetzt schaltet das aus. Sie schalten nur noch um, wenn die Suchart wechseln soll.
- **Regel:** Wird ein Knopf zum Umschalter, alle Proben suchen, die ihn klicken (`grep data-m=`).

## F5 Zeitliche Rennen in Proben

- `matchMedia`-Wechsel (Navigation zurück in die Zeile) und Service-Worker-Installation sind asynchron. Proben, die
  sofort messen, waren in CI ab und zu rot. Auf den Zustand warten, nicht auf feste Zeiten; im Fehlerfall die Maße
  ausgeben (so wurde `transformers-cache` sichtbar).

## F6 Emulator-Ausfälle, die nichts mit dem Code zu tun haben

- „Error on ZipFile unknown archive“ beim Herunterladen des Emulators: Lauf stirbt vor dem ersten Test, einmal neu starten.
- „Android folder picker did not open“ in der Update-Probe trat auch im reinen Doku-PR Pro #75 auf; auf dem nächsten
  Stand grün. Zweimal hintereinander rot ist dagegen echt (F3).

## F7 Herausgeber-Studio läuft auch im Browser

- Lange (1,5 s) auf „© 2026“ unten in den Einstellungen öffnet das Studio, auch auf der Webseite: Schlüssel anlegen
  (`PBLicense.createKey`), Code für einen Namen (`makeCode`), Einlösen — alles Web-Krypto und `localStorage`.
- **Grenze:** `native/license-keys.json` enthält noch keinen öffentlichen Schlüssel. Bis dahin vertraut ein Gerät nur
  seinem eigenen Studio-Schlüssel; Codes wirken also nur auf Klaus' eigenem Gerät, nicht beim Käufer. Der Studio-Schlüssel
  im Browser liegt nur in diesem Browser (Websitedaten löschen = weg); daher in der nativen App anlegen und sichern.
