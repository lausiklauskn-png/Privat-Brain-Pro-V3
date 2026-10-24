# Private Brain V3 Pro für Windows

**Eigene Identität (2026-10-24):** Name „Private Brain V3 Pro“, Kennung
`de.familyprojekt.privatebrain.v3`, Programm `private-brain-v3.exe`, Versionsreihe
`3.0.0-preview.N`. Installiert wird nach `%LOCALAPPDATA%\Private Brain V3 Pro`, die Daten
liegen in `%LOCALAPPDATA%\de.familyprojekt.privatebrain.v3`. Eine vorhandene
Private Brain Pro (`…privatebrain.pro`) bleibt unberührt; `pruefung/coexist.ps1`
installiert in der CI den echten Pro-Installer daneben und prüft das. Updates sucht
V3 nur im eigenen Repository unter Tags `v3-windows-3.0.0-preview.N`. Das Java-Paket
der Mail-Maschine heißt weiter `de.familyprojekt.privatebrain.pro`, weil der Kern aus
den gemeinsamen Android-Quellen übersetzt wird; das ist nur ein Code-Name, keine
Kennung auf dem PC. Symbol: `icon-v3-windows.ico` aus `tools/native/icon/make-v3-icons.py`.

Herkunft: 1:1 aus Privat-Brain-Pro kopiert. Tauri 2/WebView2 mit derselben lokalen
V3-Oberfläche wie Android. Der Mail-,
MIME- und PBV1-Kern wird beim Bau aus den Android-Quellen übernommen. Der
mitgelieferte Java-21-Laufzeitteil braucht keine Installation durch den Nutzer.
Windows speichert Gerätegeheimnisse mit DPAPI; der portable Ordner bleibt mit
dem Benutzerpasswort verschlüsselt. Keine Android-Schlüssel werden übernommen.

`docs/BAUSTAND-WINDOWS.md` nennt den belegten Stand und die Grenzen. Die CI
prüft die installierte App, Neustart, Daten nach Neuinstallation, das reale
Offline-Modell und die Abbruchwege. Danach baut und installiert sie einen
zusätzlichen Auslieferungsbau ohne Prüfzugang. Ausschließlich dessen Artefakt
`windows-installer` ist ein Veröffentlichungskandidat; es enthält Prüfsummen
und den genauen Quellstand. Die Veröffentlichung erfolgt nach Freigabe.

Kern prüfen: `node windows/engine/test.mjs` (Java 21, Node 24).
Auf Windows: `npm ci --prefix windows`, `node windows/tools/prepare-runtime.mjs`,
`npm run tauri --prefix windows -- build --bundles nsis`.

Die öffentliche Gmail-Client-ID in `gmail-desktop.json` ist noch die von Pro
(Schritt W4: eigener Desktop-Client für V3, legt Klaus an). Der Loopback-Anmeldeweg nutzt
den Standardbrowser und PKCE S256; Tokens verlassen den nativen Gerätespeicher
nicht. Live-Anmeldung und Google-Freigabe stehen noch aus. Technischer Vertrag:
https://developers.google.com/identity/protocols/oauth2/native-app

Veröffentlichen/Übernehmen in main bleibt bis zu Klaus' ausdrücklicher Freigabe
offen. Unsigniertes NSIS-Setup pro Benutzer ist der beauftragte Auslieferungsweg.
