# Private Brain V3 Pro: eigene App neben Private Brain Pro

Stand 2026-10-24 (Klaus): Die native App heißt **„Private Brain V3 Pro“**. Sie installiert sich **neben** Private Brain Pro
und berührt sie nicht – weder auf Android noch auf Windows. Hier steht an **einer** Stelle alles, was V3 von Pro trennt.
Bewacht von `tools/native/test-v3-identity.mjs` (in `npm run test:native-web`), Gegenprobe
`tools/native/gegenprobe-v3-identity.mjs` (jede Stelle einzeln auf Pro zurückgesetzt → rot; zuletzt 15 gefangen,
0 durchgerutscht, 0 tote Anker).

## Was V3 von Pro trennt

| Was | Private Brain Pro | Private Brain V3 Pro |
|---|---|---|
| Android-Paket (applicationId) | `de.familyprojekt.privatebrain.pro` (+ `.preview`, `.preview.debug`) | `de.familyprojekt.privatebrain.v3` (+ `.preview`, `.preview.debug`) |
| Name auf dem Gerät | Private Brain Pro | Private Brain V3 Pro |
| Capacitor `appId`/`appName` | wie oben | wie Android V3 |
| Windows (Tauri) `identifier`/`productName` | `de.familyprojekt.privatebrain.pro` / Private Brain Pro | `de.familyprojekt.privatebrain.v3` / Private Brain V3 Pro |
| Version | 1.0.0-preview.N, Code N | **3.0.0-preview.N, Code N** (beginnt bei 1) |
| App-Symbol | hellgraues Logo | dasselbe Logo mit großem leuchtendem „V3“ (`icon-v3-512.png`); Windows: vier Fenster + „V3“ |
| Updates Android | Repo `Privat-Brain-Pro`, Tags `v1.0.0-preview.N` | Repo `Privat-Brain-Pro-V3`, nur Tags **`v3-android-…`**, Datei `Private-Brain-V3-Pro-<Version>.apk` |
| Updates Windows | Repo `Privat-Brain-Pro`, Tags `windows-v…` | Repo `Privat-Brain-Pro-V3`, nur Tags **`v3-windows-…`** |
| Signierschlüssel Android | Pros Schlüssel, Geheimnis nur in Pro | **eigener** Schlüssel, Repo-Geheimnis `V3_SIGNING_UNLOCK` (noch nicht angelegt) |
| Gmail Android | Google-Android-Client für Pros Paket + Zertifikat | **eigener** seit 2026-10-25: „Private Brain V3 Pro Android“ im Projekt `privat-brain-pro`, Paket `…v3.preview`, SHA-1 des V3-Schlüssels; `gmail_android_client_ready = true` ab 3.0.0-preview.4 |
| Gmail Windows | Desktop-Client „Private Brain Pro Windows“ | vorerst Pros Desktop-Client (`windows/gmail-desktop.json`, Schritt W4 offen) |
| App-Daten | eigener App-Speicher | eigener App-Speicher (Android trennt je Paket), kein Datenumzug |

**Bleibt absichtlich „pro“ (nur Code-Namen, für Nutzer unsichtbar):** der Java-Namensraum
`de.familyprojekt.privatebrain.pro` (`namespace` in `build.gradle`, Klassen, `R`, Testklassen in
`assert-instrumentation.py`, die Update-Probe `UpgradeProbe.PREFIX`). Android unterscheidet Apps nur an der
`applicationId`; der Namensraum ist ein Code-Name. Ihn umzubenennen hieße, über 60 Dateien zu verschieben, auch die
Mail-Maschine, die Windows aus denselben Quellen baut. Ebenso bleiben die Brücken-Namen `ProMail`, `ProVault` …, das
Sicherungsformat `app:'private-brain-pro'` (eine Pro-Sicherung bleibt in V3 lesbar) und der Ordnername
`Private Brain` im Speicherort.

⚠ **Speicherort:** Wer Pro und V3 auf demselben Gerät nutzt, sollte jeder App einen **eigenen** Ordner auf Tablet/SD-Karte
geben. Beide legen darin einen Unterordner `Private Brain` an; derselbe Ordner mit zwei Passwörtern wäre verwirrend.

### Android-Symbol

`python3 tools/native/icon/export-v3-android-icon.py` übernimmt `icon-v3-512.png` als
`android/app/src/main/res/drawable-nodpi/private_brain_icon.png`. Ein Bild gilt für alle Dichten (die Dateien in
`mipmap-anydpi*/` zeigen darauf); adaptives Symbol mit 13 % Rand auf hellgrauem `#a3a6ad`, Startbildschirm ebenso.
Das Skript prüft, dass das „V3“ im sicheren Kreis (66 dp von 108 dp) liegt: weitester Punkt 113 px von der Mitte,
Grenze 211 px. Die äußeren kleinen Kugeln dürfen wie bei Pro von runden Masken angeschnitten werden.
`tools/native/export-pro-icons.mjs` kopiert nicht mehr nach Android.

### Gmail ehrlich

`android/app/src/main/res/values/v3_identity.xml`: `gmail_android_client_ready = false`. Bei „Google / Gmail“ zeigt das
Konto-Fenster „Google / Gmail ist in Private Brain V3 Pro noch nicht eingerichtet …“ und den Knopf
„Einrichtungsplan anzeigen“; das Google-Kontofenster wird nie geöffnet, kein Konto verbunden. Telekom, WEB.DE, GMX,
Yahoo, IONOS und Hetzner gehen wie gewohnt. Die Startprobe (`NativeStartupTest`) prüft beide Fälle: ohne Client die
ehrliche Meldung und null Aufrufe der Kontoauswahl, mit Client wieder die alte Google-Prüfung.
Wenn der Google-Client angelegt ist: den Wert auf `true` setzen (siehe unten, Schritt 4).

### Signieren und Veröffentlichen

**Stand 2026-10-25:** Klaus hat `V3_SIGNING_UNLOCK` angelegt (Tresor-Datei `pbv3-freigabe.age`, age -p, bei Klaus).
Schlüssel erzeugt in Lauf 40165892761, übernommen per `adopt` (Zweig `v3-signierpaket-uebernahme`).
Zertifikat `CN=Private Brain V3 Pro`, gültig bis 2056-10-17:
SHA-256 `e00eb61d0749fc276b97708d06c4fb47e424802db5d29b7e83839a1fb487b45e`,
SHA-1 `23b0e28e248f7353653b6581adaa67314b61d6a7` (für den Google-Android-Client, Paket `de.familyprojekt.privatebrain.v3.preview`).

- `tools/signing-v3/` – neues Format `private-brain-v3-android-signing`: Schlüssel RSA 4096, 30 Jahre,
  „CN=Private Brain V3 Pro“, nur in GitHub Actions erzeugt; im Repo liegt er nur AES-256-GCM-verschlüsselt, der
  Schlüssel dazu kommt per PBKDF2-SHA256 (600 000 Runden) aus dem Repo-Geheimnis `V3_SIGNING_UNLOCK`. Pros Werkzeuge
  (`tools/signing/`) und Pros Geheimnis sind aus V3 entfernt. Selbsttest mit Wegwerf-Schlüssel:
  `node tools/signing-v3/test-v3-identity.mjs` (16 grün, auch in CI).
- `.github/workflows/v3-signing.yml` (von Hand, nur auf `main`): **create** erzeugt einmalig den Schlüssel, verweigert,
  wenn schon einer im Repo liegt, fehlt das Geheimnis, steht dort eine klare deutsche Meldung. Ergebnis ist nur das
  Artefakt `v3-signierpaket` (verschlüsseltes Paket + öffentliches Zertifikat), SHA-256 und SHA-1 stehen in der
  Zusammenfassung. **check** öffnet das eingecheckte Paket und prüft Zertifikat und privaten Schlüssel.
- `.github/workflows/v3-android-release.yml` (von Hand, nur auf `main`, Version zur Bestätigung): verlangt einen
  grünen `android.yml`-Lauf auf demselben main-Commit, baut signierte APK + AAB für
  `de.familyprojekt.privatebrain.v3.preview`, prüft Paket, Name, Version, Debug-Flag und Zertifikat, veröffentlicht
  als Vorabversion `v3-android-<Version>` mit `SHA256SUMS` und lädt die öffentlichen Dateien zum Bytevergleich wieder
  herunter. Kein Release ohne Klaus' ausdrückliche Bitte.

## Klaus' einmalige Schritte (in dieser Reihenfolge)

1. **Geheimnis anlegen.** Auf GitHub im Repo *Privat-Brain-Pro-V3*: **Settings → Secrets and variables → Actions →
   New repository secret**. Name: `V3_SIGNING_UNLOCK`. Wert: ein **langes Passwort** (mindestens 20 Zeichen, besser
   ein ganzer Satz). Dieses Passwort wie das Pro-Passwort in deinem Termux-Tresor aufbewahren
   (z. B. `pbv3-freigabe.age`, `age -p`). Es nie in einen Chat schreiben. Ohne dieses Passwort kann später niemand
   ein Update für V3 signieren.
2. **Schlüssel erzeugen.** Auf GitHub: **Actions → „V3-Signierschlüssel (Private Brain V3 Pro)“ → Run workflow →**
   bei *operation* `create` wählen → **Run workflow**. Nach etwa einer Minute ist der Lauf grün; in der
   Zusammenfassung stehen zwei Fingerabdrücke (SHA-256 und SHA-1).
3. **Übernehmen.** Der Sitzung (Claude) sagen: „Signierschlüssel ist erzeugt.“ Die Sitzung lädt das Artefakt
   `v3-signierpaket`, legt die beiden Dateien unter `signing/` ins Repo und lässt danach `check` laufen. Das
   verschlüsselte Paket darf ins Repo, das Passwort nie.
4. **Google für Gmail.** In der Google Cloud Console, Projekt `privat-brain-pro`: **APIs & Dienste → Anmeldedaten →
   Anmeldedaten erstellen → OAuth-Client-ID → Android**. Paketname `de.familyprojekt.privatebrain.v3.preview`, dazu
   der **SHA-1-Fingerabdruck** aus Schritt 2. Name z. B. „Private Brain V3 Pro Android“. Dasselbe Testnutzer-Konto
   wie bei Pro bleibt eingetragen; nichts auf „Produktion“ umstellen. Danach der Sitzung Bescheid geben: sie setzt
   `gmail_android_client_ready` auf `true`. (Für die Debug-Test-APK aus der CI gilt ein anderes, wechselndes
   Zertifikat; Gmail wird deshalb erst mit der signierten V3-Vorschau geprüft.)
5. **Erste Veröffentlichung** nur, wenn du sie willst: der Sitzung sagen „V3 für Android veröffentlichen“. Sie startet
   „V3-Android-Veröffentlichung“ mit `3.0.0-preview.1` und nennt dir danach den Download-Link.

## Grenzen ehrlich

- Android baut nur in GitHub Actions; am Tablet ist V3 ungemessen, bis Klaus die Test-APK installiert.
- Die Debug-Test-APK aus der CI ist mit einem wechselnden Entwicklungs-Schlüssel signiert: eine spätere Test-APK
  lässt sich nicht immer über eine frühere installieren (dann erst deinstallieren; nur V3-Testdaten gehen verloren,
  Pro bleibt unberührt).
- Die Update-Prüfung in der App sagt bis zur ersten V3-Veröffentlichung „aktuell“ (es gibt noch keine `v3-android-`
  Version); die Debug-APK meldet wie bei Pro „keine Updateprüfung für Entwicklungsversionen“.
- Freischalt-Codes (`native/license-keys.json`) sind nicht an die Paketkennung gebunden; der öffentliche Schlüssel des
  Herausgebers fehlt dort weiterhin (W6).
