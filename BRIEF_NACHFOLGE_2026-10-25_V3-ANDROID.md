# Brief für die nächste Sitzung: V3 als eigene Android-App, danach die Filme

## Neuer Auftrag von Klaus (2026-10-24) – zuerst lesen

**„Nächste Sitzung: Werbefilm und Handbuchvideo neu aufnehmen im neuen Design – mit Private Brain Pro (Codex' neu
gestaltete Fassung, dort laufen die E-Mails), nicht mit V3.“**

- Aufgenommen wird **in Pro** (`lausiklauskn-png/Privat-Brain-Pro`), mit Codex' neuer Gestaltung, nicht mit V3.
  Pro ist Codex' Repo: dort nur die Film-/Handbuch-Werkzeuge benutzen und anpassen, wie es die Film-Sitzungen bisher
  getan haben, und vorher klären, ob Codex gerade an denselben Dateien arbeitet (frisch von `origin/main`).
- Anleitung und Bausteine stehen in Pro: `docs/film/README.md` (Werbefilm 1:45, Puzzle-Aufbau, quer + hochkant,
  Full HD) und `docs/handbuchvideo/README.md` (Handbuch ~3:15, Bühne `buehne.html`, Comic-Hand, Kapitel, zwei
  Musikfassungen, `musik.py`, Ausgabe yuv420p/H.264 High). Musik sucht Klaus selbst aus; Musikdateien nie ins Repo.
- Nur erfundene Daten (`beispiel/`, `@example.invalid`). Danach die FP-Videoseite (Family-Projekt.de-Video) wie bei #23
  aktualisieren und Klaus die Links nennen.

## Stand V3 Android (S2, PR „Android: eigene App „Private Brain V3 Pro“ (S2) und Signier-Vorbereitung“)

Alles Wichtige steht in [`docs/V3-IDENTITAET.md`](docs/V3-IDENTITAET.md). Kurz:

- Paket `de.familyprojekt.privatebrain.v3` (+ `.preview`, `.preview.debug`), Name „Private Brain V3 Pro“, Version
  `3.0.0-preview.1`, Code 1, Symbol = V3-Logo. Java-Namensraum bleibt `…privatebrain.pro` (nur Code-Name).
- Updates nur aus diesem Repo, Tags `v3-android-…`; Pros Kanal nie.
- Gmail auf Android zeigt „noch nicht eingerichtet“ (`gmail_android_client_ready = false`).
- Signieren vorbereitet: `tools/signing-v3/`, `.github/workflows/v3-signing.yml` (create/check),
  `.github/workflows/v3-android-release.yml`. Nichts davon ist gelaufen; es gibt noch keinen V3-Schlüssel.
- Wächter `tools/native/test-v3-identity.mjs` + Gegenprobe; Signier-Selbsttest mit Wegwerf-Schlüssel, beide in CI.

## Offene Schritte

1. **Klaus:** Repo-Geheimnis `V3_SIGNING_UNLOCK` anlegen, dann „V3-Signierschlüssel“ mit `create` starten
   (Anleitung in `docs/V3-IDENTITAET.md`, Abschnitt „Klaus' einmalige Schritte“).
2. **Sitzung:** Artefakt `v3-signierpaket` des create-Laufs laden, die zwei Dateien nach `signing/` committen
   (PR), danach `check` laufen lassen. Dann im Wächter eine Zeile ergänzen, die
   `signing/v3-android-certificate.json` gegen die Paket-Kennung `de.familyprojekt.privatebrain.v3.preview` prüft.
3. **Klaus:** Google-Android-Client (Paket `de.familyprojekt.privatebrain.v3.preview` + SHA-1 aus Schritt 1).
   **Sitzung:** danach `gmail_android_client_ready` auf `true`, CI prüft dann wieder den echten Google-Ablauf.
4. **Nur auf Klaus' Wunsch:** „V3-Android-Veröffentlichung“ mit `3.0.0-preview.1`; Download-Link nennen.
5. Windows W4–W6 aus [BRIEF_NACHFOLGE_2026-10-25_V3-WINDOWS.md](BRIEF_NACHFOLGE_2026-10-25_V3-WINDOWS.md)
   (eigener Desktop-Google-Client, Windows-Release, Herausgeber-Schlüssel), danach S1/S3–S5 aus dem
   [Start-Brief](BRIEF_NACHFOLGE_2026-10-24_V3-START.md).

## Grenzen

Android baut nur in GitHub Actions; am Tablet ist V3 ungemessen. Die Debug-Test-APK hat einen wechselnden
Entwicklungs-Schlüssel (Gmail dort nicht prüfbar).
