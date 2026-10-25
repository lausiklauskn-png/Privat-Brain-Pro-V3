# Brief für die nächste Sitzung (2026-10-25): Gmail in V3, KI-Schlüssel im Tresor, Videos in einer guten Fassung

**Aufträge von Klaus (2026-10-25)**, in dieser Reihenfolge:

1. Gmail in Private Brain V3 Pro einrichten.
2. Den KI-Schlüssel der Browserfassung verschlüsselt in einem eigenen Tresor ablegen statt im Klartext.
3. Werbefilm und Handbuchvideo: nur noch eine gute Fassung. Sie wird gestreamt und lässt sich herunterladen, wie bei family-projekt.de.

Zuerst diese Datei lesen, dann `CLAUDE.md`, `docs/V3-IDENTITAET.md` und
`BRIEF_NACHFOLGE_2026-10-25_VIDEOS.md`. Vor jeder Arbeit frisch von `origin/main` abzweigen.

## Stand bei Übergabe

- **APK 3.0.0-preview.3 ist veröffentlicht:**
  - Link: <https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-android-3.0.0-preview.3/Private-Brain-V3-Pro-3.0.0-preview.3.apk>
  - 7.471.442 Bytes, SHA-256 `c824e28318e028f0b65f830a8d35fc62a520f7b02a4ed9f1383116fddb1abdff`.
  - Quelle: main `196bb97` (PR #12). Main-CI und der Release-Lauf sind grün.
  - Inhalt: die Rechtsseite „Impressum · Datenschutz · Haftung“ (PR #11). Die App ist keine Probeversion mehr.
- **Umstellung auf V3:** family-projekt.de, PWA Toolpoint und Sage zeigen Private Brain V3. Die alte Adresse `…/Privat-Brain/` leitet weiter.
- **Klaus' Antworten auf die offenen Fragen:**
  - **Keine Telefonnummer** ins Impressum.
  - **Suchmodell in der Browserfassung:** Es darf weiter von selbst laden. Das steht schon so als Ausnahme in der Datenschutzerklärung; nichts ändern.
  - **Zugriffsprotokolle von family-projekt.de:** Klaus meint, mindestens ein Jahr, ist sich aber nicht sicher. Nicht als Tatsache in die Datenschutzerklärung schreiben. Klaus bitten, beim Hoster (Hetzner Webhosting bzw. Caddy auf dem Cloud-Server) nachzusehen. Erst mit seiner Auskunft `impressum.html` ergänzen.
- **Altes Repo Privat-Brain einfrieren:** Das macht Klaus selbst, als Erstes. Die Sitzung darf Repo-Einstellungen nicht ändern (Proxy: 403). Weg: GitHub → Repo `Privat-Brain` → **Settings** → ganz unten **Danger Zone** → **Archive this repository** → Namen bestätigen. Danach in `privat-brain/CLAUDE.md` nichts mehr ändern.
- **Geschenk für Jens:** Es wartet auf Codex' neue Windows-Fassung. Codex arbeitet noch, Klaus meldet sich. Danach Artifact `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7` lesen und an dieselbe Adresse neu veröffentlichen.

## 1 · Gmail in V3 Pro

> ✅ **Erledigt am 2026-10-25 in derselben Sitzung:** Klaus hat den Android-Client im Projekt `privat-brain-pro` angelegt
> (kein neues Projekt), `gmail_android_client_ready` steht auf `true`, Version 3.0.0-preview.4. Offen bleibt nur Klaus'
> Prüfung am Gerät (Konto freigeben, abrufen, Testmail senden) mit der veröffentlichten preview.4. Der Rest dieses
> Abschnitts ist die Vorgeschichte.

Heute steht `gmail_android_client_ready = false` in `android/app/src/main/res/values/v3_identity.xml`. Die App sagt ehrlich „noch nicht eingerichtet“. Es fehlt nur der Google-Zugang; der Code ist Pros erprobter Weg.

**Klaus' Schritt** (die Sitzung erklärt ihn in Einzelschritten, keine Geheimnisse in den Chat):

1. Google Cloud Console öffnen, Projekt **`privat-brain-pro`**.
2. **APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen → OAuth-Client-ID → Android.**
3. Diese Werte eintragen:
   - Paketname: `de.familyprojekt.privatebrain.v3.preview`
   - SHA-1: `23b0e28e248f7353653b6581adaa67314b61d6a7`
   - Name: „Private Brain V3 Pro Android“
4. Testnutzer und Zustimmungsbildschirm so lassen; **nicht** auf „Produktion“ umstellen.

**Danach die Sitzung:**

1. `gmail_android_client_ready` auf `true` setzen.
2. Den Wächter `tools/native/test-v3-identity.mjs` nachziehen, falls er `false` erwartet.
3. Die Version auf `3.0.0-preview.4` heben. Den versionCode und die Windows-Version gleich mitziehen; der Wächter verlangt das.
4. PR, grüne CI, Merge.
5. Veröffentlichen nur auf Klaus' ausdrückliches Wort, mit `v3-android-release.yml`.

**Danach prüft Klaus am Gerät:** Konto freigeben, Mails abrufen, eine Testmail senden.

**Windows (W4)** nutzt noch Pros Desktop-Client (`windows/gmail-desktop.json`). Ein eigener Desktop-Client für V3 ist ein eigener Schritt. Siehe `BRIEF_NACHFOLGE_2026-10-25_V3-WINDOWS.md`.

## 2 · KI-Schlüssel der Browserfassung im Tresor

> ✅ **Erledigt am 2026-10-25:** `assets/ki-tresor.js`, nur in der Browserfassung (`prepare-pages.mjs`). Vorbild ist
> der KI-Richter im Mycel-Fenster (Modul 23-UI, Kanon) bzw. `net-widget.js` der alten PWA: Modul 20, Name
> `ki_richter_key:<Anbieter>`, Passwort per Abfrage (zweimal), freiwillige Merkhilfe. Knöpfe „Im Tresor merken“,
> „Tresor entsperren“, „Sperren“, „Aus dem Tresor löschen“; der Haken „merken“ ist weg. Ein alter `cb_ai_key` wird
> beim Merken übernommen und gelöscht, nach jeder Änderung ohne Tresor ebenfalls; der Anbieter bleibt gemerkt.
> **Termux ist nicht nötig:** das Geheimnis entsteht im Browser, das Passwort tippt man in der Seite.
> Probe `tools/native/test-ki-tresor.mjs` (18, echte Krypto, Gegenprobe „kein Klartext in localStorage,
> sessionStorage, IndexedDB“; ohne das Löschen des Altbestands rot). Datenschutzerklärung nachgezogen. Den
> Vorrat `pbv3-web-` zählt der Bau selbst (Commit-Kennung). Grenze: die Apps (Android, Windows) speichern den
> Schlüssel mit „merken“ weiter im App-Speicher, wie beauftragt unverändert; am Tablet nicht gemessen.

**Heute:** Mit dem Haken „merken“ legt die Browserfassung den Schlüssel im **Klartext** ab: `localStorage` `cb_ai_key` und `cb_ai_provider`. Die Fundstellen in `index.html` sind etwa Zeile 1981 (Lesen) und 2143 (Schreiben). Auf einer geteilten Adresse (github.io) ist das schwach.

**Ziel:** Nie ein Klartext-Schlüssel im Speicher. Der Schlüssel liegt verschlüsselt in einem **eigenen V3-Tresor** und übersteht Neuladen und Schließen. Ein Passwort entsperrt ihn je Sitzung. Andere Apps am selben Ursprung können ihn nicht lesen.

**Wie:**

- Nach dem Rezept im Skill **`verschluesselter-schluessel-tresor`** (Sage-Protokol) bauen.
- Den vorhandenen **Modul 20 Safe** nutzen (`modules/20_schluessel_safe.js`, byte-1:1, nie abwandeln). Kein Parallel-Bau, Glue nur app-eigen.
- **Zuerst nachsehen, wo der Weg schon läuft.** Klaus weiß das Repo nicht mehr. Mit `list_repos` und Suche nach dem Skill-Namen bzw. „KI-Schlüssel“ + `SbkimSafe` in seinen Repos finden und von dort übernehmen. Nicht neu erfinden.
- **Termux:** Klaus bietet ihn als Weg an, wie beim Signierschlüssel. Das passt nur, wenn ein Geheimnis außerhalb des Browsers entstehen soll. Für einen Browser-Tresor tippt der Nutzer sein Passwort in der Seite. Die Sitzung entscheidet nach dem Rezept und sagt Klaus, ob Termux nötig ist.
- **Altbestand:** Ein vorhandener Klartext-Schlüssel wird beim ersten Entsperren in den Tresor übernommen und **danach aus `localStorage` gelöscht**. Ohne Passwort bleibt der Schlüssel nur für diese Sitzung im Speicher.
- **Nur die Browserfassung.** Die Android- und Windows-App haben ihren eigenen Keystore-Weg; den nicht anfassen.
- **Datenschutzerklärung nachziehen.** Dort steht heute, der KI-Schlüssel liege unverschlüsselt im Browser.
- Danach den Service-Worker-Vorrat `pbv3-web-` hochzählen, wenn eine Vorrat-Datei geändert wurde. Nie `private-brain-` anfassen.
- **Proben:** im echten Browser entsperren, neu laden, sperren, falsches Passwort. Dazu die Gegenprobe: Klartext darf nie im Speicher auftauchen. `npm test` grün.

## 3 · Videos: eine gute Fassung, gestreamt und herunterladbar

**Klaus' Entscheidung (2026-10-25):**

- Nicht mehr viele Fassungen: **je Film eine gute Fassung.**
- Vorbild ist **family-projekt.de**. Das Werbevideo läuft dort direkt im Rahmen der Startseite: erst auf Tipp, gestreamt, mit Vollbild und Herunterladen. Der Download war rund **198 MB** in voller Qualität.
- Lange Ladezeiten sind bei guter Qualität kein Problem.
- Abspielen im Netz und Herunterladen müssen beide sicher funktionieren. „Das kann gar nicht viel komplizierter sein vom Packen und vom Transport.“

Das **ersetzt** in `BRIEF_NACHFOLGE_2026-10-25_VIDEOS.md` die Liste der fünf Fassungen: kein hochkant, keine zwei Musikfassungen. Hochkant nur, wenn Klaus es ausdrücklich will.

**Erst nachsehen, dann bauen:**

1. **family-project** (Klaus' Repo `family-project`):
   - `assets/abspielen-kern.js` und `assets/abspielen-rahmen.js` sind byte-1:1 aus dem Repo „Family-Projekt.de-Video“ (FP-Videos).
   - Die Route `werbevideo/<kennung>.mp4` steht in `sw.js`.
   - Die Teile liegen auf github.io und sind per SHA-256 geprüft. Der Spiegel `videos.family-projekt.de` ist in `server/videos/` beschrieben.
   - Gestreamt wird 720p, im Menü sind 480p/1080p wählbar; Herunterladen läuft über die Video-Seite.
   - Abschnitt „DAS WERBEVIDEO LÄUFT IM RAHMEN DER STARTSEITE“ in `family-project/CLAUDE.md` lesen. Dort stehen auch die benannten Grenzen (ganzer 14-MB-Teil vor dem ersten Bild).
2. **Workflow PDF** bindet seine Videos in der App ein (Detailseite, `video: {quer, hoch, poster}` in den Marktplätzen). Zum Vergleich ansehen, wie das dort geladen wird.
3. **Danach entscheiden und Klaus kurz sagen**, welcher Weg für Private Brain Pro gilt. Vermutlich derselbe Spieler und dieselbe Teile-Ablage wie family-project, damit nichts Neues entsteht. Er ist erprobt und am Tablet bestätigt.

**Aufnahme:**

- Wie im Video-Brief: mit **Private Brain Pro** (Codex' Repo, nur `docs/film/` und `docs/handbuchvideo/`, kein App-Code). Nur erfundene Daten.
- Ausgabe einmal in voller Qualität (1920×1080, H.264 High, yuv420p). Daraus die Teile für den Stream.
- Die alten IDs auf der FP-Videoseite durch die neue eine Fassung je Film ersetzen.

**Am Ende:**

- Die neuen Filme ins Geschenk für Jens.
- Grenzen ehrlich nennen: am Tablet nicht gemessen, solange Klaus es nicht gesehen hat.

## 4 · Die neue Oberfläche gleich fertig ausliefern (Klaus 2026-10-25)

> ✅ **Erledigt am 2026-10-25:** `tools/native/v3-prerender.mjs` schreibt beim Bau (`prepare-web.mjs`) Leiste mit
> Liniensymbolen, ☰-Menü, Lampe, ← →, Versionsnummer, Designknopf, Schalter „Bedeutung“, Sprachkürzel, Filterknopf,
> „Alle geprüft“ und die Fußzeile in den Einstellungen fertig ins HTML; breit setzt ein kleines Skript direkt hinter
> der Leiste sie noch beim Aufbau in die Kopfzeile. `native-toolbar.js`, `native-navigation.js`, `themes.js`,
> `native.js` und `v3-ui.js` übernehmen die vorhandenen Teile. Der Symbol-Beobachter in `v3-ui.js` startet schon im
> `<head>` (übersetzte Texte mit Emoji bekommen ihr Symbol vor dem ersten Bild). `html.v3-wait` ist entfernt.
> Wächter in `test-v3-ui.mjs`: erstes Bild ohne JavaScript bei 1280 und 390 px; Gegenprobe ohne Vorab-Bau wird rot.
> Grenze: das schwebende Siegel (Modul 17) entsteht weiter erst beim Start; am Tablet nicht gemessen.

Klaus: *„Warum flackert immer noch die alte Version auf … man kann doch gleich das Original richtig rendern. Ich meine mit
Original die neue Version, die ist doch auch bekannt.“*

**Heute** liefert `index.html` noch Pros alte Oberfläche aus (umbrechende Leiste, Knopf „Namenssuche“, Emoji-Symbole).
`assets/v3-ui.js` und `native/native-toolbar.js` bauen sie erst nach dem Laden um. Seit 3.0.0-preview.5 verdeckt
`html.v3-wait` die Seite bis dahin (höchstens 2,5 s), es blitzt also nichts mehr auf. Das ist aber nur eine Abdeckung.

**Ziel:** Die fertige V3-Oberfläche steht schon im ausgelieferten HTML.
- Was `v3-ui.js` beim Start einmalig umbaut, macht künftig der Bau (`tools/native/prepare-web.mjs`, und für den Browser `prepare-pages.mjs`) direkt im HTML:
  - Navigation in der Kopfleiste
  - Schalter „Bedeutung“ statt „Namenssuche“
  - Liniensymbole statt Emojis
- `v3-ui.js` behält nur, was zur Laufzeit entsteht (Mails, Konten, Ordner).
- Danach `v3-wait` entfernen.
- Wächter: Erstes Bild ohne JavaScript (Playwright `javaScriptEnabled:false`) zeigt schon die V3-Leiste und keinen Knopf „Namenssuche“.
- Pro bleibt unangetastet. Wenn Funktionen aus Pro herübergeholt werden, greifen dieselben Bau-Ersetzungen; jede wirft einen Fehler, wenn ihr Anker fehlt.

## Was nie

- Pros `signing/`, `PB_SIGNING_UNLOCK` oder Pros Schlüssel benutzen.
- Geheimnisse in Git oder Chat.
- Byte-gepinnte Module ändern.
- In Pro am App-Code bauen.
- Echte Mails oder Adressen von Klaus in Filme oder Entwürfe.
- Ohne Klaus' Wort veröffentlichen.
