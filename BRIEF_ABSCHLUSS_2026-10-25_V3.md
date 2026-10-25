# Abschlussbericht 2026-10-24/25: Private Brain V3 wird eigene App

Sitzung `session_01MLJHofn3TXp2pQF4g2ZtDC`, 24.10. 10:56Z bis 25.10. 12:36Z, in fünf Abschnitten. Die
Forschungseinträge stehen in Kimhub (`forschung/sitzungen.json`, Kennungen `2026-10-24-v3-…` und `2026-10-25-v3-…`).
Weiter geht es mit [BRIEF_NACHFOLGE_2026-10-25_GMAIL-TRESOR-VIDEOS.md](BRIEF_NACHFOLGE_2026-10-25_GMAIL-TRESOR-VIDEOS.md);
eine Folge-Sitzung arbeitet daran schon (PR #17).

## Veröffentlicht

| | Version | Link |
|---|---|---|
| Android (APK) | 3.0.0-preview.5 | [Private-Brain-V3-Pro-3.0.0-preview.5.apk](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-android-3.0.0-preview.5/Private-Brain-V3-Pro-3.0.0-preview.5.apk) |
| Windows (Installer) | 3.0.0-preview.5 | [Private-Brain-V3-Pro-Windows-3.0.0-preview.5-x64-setup.exe](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-windows-3.0.0-preview.5/Private-Brain-V3-Pro-Windows-3.0.0-preview.5-x64-setup.exe) |
| Browser | main | https://lausiklauskn-png.github.io/Privat-Brain-Pro-V3/ |

- APK SHA-256: `e636bd41dde105a621802bb6dd0f28f535067025f9daaf2753c3237116910c23`, 7.471.870 Bytes.
- Windows-Installer SHA-256: `c5c79c6f0150828a29338cb1c700c7234a06ed336cf24af54d0a0c11520dda3a`, 48.923.935 Bytes. Er ist nicht mit einem Windows-Zertifikat signiert, deshalb fragt SmartScreen einmal nach.
- Ältere Stände bleiben als Vorabversionen stehen:
  - Android preview.1 bis preview.4
  - Windows preview.3

## Was in dieser Sitzung entstand

1. **Themen und V3** (24.10.)
   - vier Designs als wechselbare Themen
   - V3 als Kopie von Pro `30c11ea`
   - Pages-Quelle auf „GitHub Actions“ (PR #1, #2)
2. **Browserfassung installierbar**: Knopf, Name und Symbol „V3“ (PR #3).
3. **Bedienung und eigene Identität**
   - Schalter „Bedeutung“, ziehbare Spalten, ein Sortierfeld, Design „Erdton“
   - Windows W1–W3, Android S2, „Private Brain V3 Pro“ (PR #4–#7)
4. **Signatur, APK, Umstellung, Rechtsseite** (25.10.)
   - eigener Signierschlüssel; das Passwort hat Klaus in Termux erzeugt, es liegt im Tresor `pbv3-freigabe.age`
   - APK preview.1–.3
   - Symbol „V3 Pro“, lesbarer Mycel-Knopf
   - family-projekt.de, PWA Toolpoint und Sage zeigen V3, das alte Privat-Brain leitet weiter
   - Impressum, Datenschutz und Haftung vollständig, keine Probeversion mehr (PR #8–#12)
5. **Gmail, Windows-Download, Name, Aufblitzen**
   - Google-Android-Client im Projekt `privat-brain-pro` (Klaus), Gmail eingeschaltet
   - Ablauf `v3-windows-release.yml` (W5)
   - die Apps zeigen „Private Brain V3 Pro“, die Browserfassung „Private Brain V3“
   - Abdeckung `html.v3-wait` gegen das Aufblitzen der alten Oberfläche (PR #13–#16)

## Offen

| Wer | Was |
|---|---|
| Klaus | altes Repo **Privat-Brain** archivieren: Settings → Danger Zone → Archive (der Proxy der Sitzung darf es nicht) |
| Klaus | Gmail in preview.5 am Tablet prüfen: Konto hinzufügen, abrufen, Testmail senden |
| Klaus | Aufbewahrungsdauer der Zugriffsprotokolle beim Hoster nachsehen; erst dann in die Datenschutzerklärung (Klaus vermutet „mindestens ein Jahr“) |
| Jens | Windows-Installer und Gmail am PC prüfen; Gmail läuft dort über Pros Desktop-Client „Private Brain Pro Windows“ |
| Folge-Sitzung | Brief-Abschnitte 4, 2 und 3: fertige Oberfläche im HTML, KI-Schlüssel im Tresor, Videos mit Private Brain Pro |
| später | eigener Desktop-Client für V3 (W4), Klaus' Studio-Schlüssel in `native/license-keys.json` (W6), Spore von V3 mit eigenem Namen |
| Klaus | Pro PR #75 (Designentwürfe, nur Doku) steht in Codex' Repo noch offen |
| Geschenk für Jens | wartet auf Codex' neue Windows-Fassung von Private Brain Pro (veröffentlicht ist Windows .29) |

Entschieden von Klaus:
- keine Telefonnummer im Impressum
- das Suchmodell der Browserfassung lädt weiter von selbst
- Windows braucht vorerst keinen eigenen Google-Zugang

## Grenzen

- Am Tablet und am PC hat diese Sitzung nichts gemessen.
- Die Android-Debug-Bauten aus der CI tragen ein anderes Zertifikat. Gmail lässt sich dort nicht anmelden, nur in den signierten Vorabversionen.
- Die Abdeckung gegen das Aufblitzen ist eine Zwischenlösung. Die saubere Lösung steht als Abschnitt 4 im Folge-Brief.
