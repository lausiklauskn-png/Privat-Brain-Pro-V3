# Brief für die nächste Sitzung (ab 2026-10-26): Kim-sync am Gerät, Geschenk, offene Reste

Stand: [Abschlussbericht 2026-10-25 abends](BRIEF_ABSCHLUSS_2026-10-25_FILME-GESCHENK-KIMSYNC.md),
Erkenntnisse: [Forschung 2026-10-25](https://github.com/lausiklauskn-png/Kimhub/blob/main/forschung/messungen/privat-brain-v3-2026-10-25.md).

## 1. Kim-sync mit Klaus am Gerät prüfen (zuerst)

Kim-sync PR #32 ist online (https://lausiklauskn-png.github.io/Kim-sync/). Nach ⟳ in der App mit Klaus durchgehen:

1. 🚪 → „Räume im Tresor sichern“, Passwort zweimal. Danach beide Räume, die er schon kennt, mit ihrem Code wieder
   betreten (den zweiten Raum hatte die alte Fassung beim Beitreten des neuen vergessen; nur der Code fehlt, die
   Nachrichten liegen noch auf dem Gerät).
2. ✏ Namen geben, per Tipp wechseln, App schließen und öffnen → Passwortabfrage → zuletzt benutzter Raum.
3. 📎 eine APK senden; beim Empfänger ⬇ Speichern, dann installieren. Auch Teilen → Kim-sync aus „Dateien“.
   ⚠ Die installierte App muss einmal geöffnet (oder ⟳) werden, damit Android das neue Manifest (`*/*`) liest;
   eventuell neu installieren.

Ungemessen und danach nachzutragen: Dauer der 600 000 Runden am Handy, APK-Installation aus dem Download.

## 2. Kim-sync: mögliche nächste Schritte (nur auf Klaus' Wunsch)

- Hinweis auf neue Nachrichten in **anderen** Räumen (heute lauscht die App nur am offenen Raum).
- Tresor-Passwort ändern (heute: leeren und neu anlegen).
- Ersatzschlüssel für das Tresor-Passwort (wie JasonLib-Anteile in Pro), falls Klaus das will.

## 3. Geschenk für Jens

- `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7`, Fassung 23. Die Quelle lag nur im Notizblock der Sitzung;
  die nächste Sitzung holt sie mit dem Artifact-Werkzeug („read“) und baut darauf auf.
- Bei jeder neuen Veröffentlichung (Pro, V3, Workflow PDF Pro) Versionen, Größen und Links dort nachziehen.
- Klaus' Wunsch: PWA steht je App oben (einfachste Installation), Android und Windows darunter.

## 4. Kleine Reste

- **Pro `CLAUDE.md`:** Die erste Zeile sagt noch „1.0.38 in Arbeit“. 1.0.38 ist veröffentlicht (Android und Windows,
  Prüfsummen im Abschlussbericht). Pro ist Codex' Repo: nur mit Absprache nachziehen.
- V3-Download am Handy (Forschung F8): falls es wieder passiert, Chromes Download-Liste ansehen lassen.
- Film-Knopf am Tablet und unter Windows ansehen lassen (H.264 ist im Testbrowser nicht messbar).

## Regeln, die weiter gelten

- Veröffentlichen nur auf Klaus' Wort und nur über die Release-Abläufe in Actions; keine Signier-Geheimnisse anfassen.
- Pro nicht veröffentlichen, solange Codex dort veröffentlicht.
- Byte-gepinnte Module nie abwandeln; in Kim-sync gehören dazu `krypto.js`, `echtheit.js`, die SBKIM-Module.
- Speicher-Namen nie ändern: `KimSync1`, `kimsync_*` (neu: `kimsync_raeume`), V3 `pbv3-web-`, nie `private-brain-`.
