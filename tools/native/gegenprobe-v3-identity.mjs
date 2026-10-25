// Gegenprobe zum V3-Identitäts-Wächter: jede Stelle einzeln in einer Wegwerf-Kopie auf Pro zurücksetzen → der Wächter
// muss rot werden. Ein Fall, dessen Eingriff die Datei nicht ändert, zählt als „toter Anker“ (misst nichts).
import { mkdtemp, cp, readFile, writeFile, copyFile, rm, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
const files = ['android/app/build.gradle', 'capacitor.config.json', 'android/app/src/main/res/values/strings.xml',
  'android/app/src/main/res/values/v3_identity.xml', 'android/app/src/main/AndroidManifest.xml', 'windows/src-tauri/tauri.conf.json',
  'android/app/src/main/java/de/familyprojekt/privatebrain/pro/UpdatePolicy.java',
  'android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProUpdatesPlugin.java', 'windows/engine/src/DesktopUpdates.java',
  'android/app/src/main/res/drawable-nodpi/private_brain_icon.png', 'icon-v3-pro-512.png', 'icon-512.png',
  '.github/workflows/android.yml', '.github/workflows/v3-android-release.yml', '.github/workflows/v3-signing.yml'];
const text = (file, a, b) => async dir => { const p = join(dir, file), s = await readFile(p, 'utf8'); await writeFile(p, s.replace(a, b)); return s !== s.replace(a, b); };
const cases = {
  'applicationId zurück auf Pro': text('android/app/build.gradle', 'applicationId "de.familyprojekt.privatebrain.v3"', 'applicationId "de.familyprojekt.privatebrain.pro"'),
  'Capacitor-Name zurück auf Pro': text('capacitor.config.json', '"Private Brain V3 Pro"', '"Private Brain Pro"'),
  'Capacitor appId zurück auf Pro': text('capacitor.config.json', 'privatebrain.v3', 'privatebrain.pro'),
  'App-Name in strings.xml zurück auf Pro': text('android/app/src/main/res/values/strings.xml', '<string name="app_name">Private Brain V3 Pro<', '<string name="app_name">Private Brain Pro<'),
  'URL-Schema zurück auf Pro': text('android/app/src/main/res/values/strings.xml', '<string name="custom_url_scheme">de.familyprojekt.privatebrain.v3<', '<string name="custom_url_scheme">de.familyprojekt.privatebrain.pro<'),
  'Windows-Kennung zurück auf Pro': text('windows/src-tauri/tauri.conf.json', '"identifier":"de.familyprojekt.privatebrain.v3"', '"identifier":"de.familyprojekt.privatebrain.pro"'),
  'Android-Version zurück auf Pros Reihe': text('android/app/build.gradle', /versionName "[^"]+"/, 'versionName "1.0.0-preview.29"'),
  'versionCode passt nicht zur Vorschau-Nummer': text('android/app/build.gradle', /versionCode \d+/, 'versionCode 29'),
  'Debug-Endung entfernt': text('android/app/build.gradle', 'applicationIdSuffix ".preview.debug"', 'applicationIdSuffix ".debug"'),
  'Updates wieder aus Pros Repo': text('android/app/src/main/java/de/familyprojekt/privatebrain/pro/UpdatePolicy.java', '"lausiklauskn-png/Privat-Brain-Pro-V3"', '"lausiklauskn-png/Privat-Brain-Pro"'),
  'Update-Prüfung wieder für Pros Paket': text('android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProUpdatesPlugin.java', '"de.familyprojekt.privatebrain.v3.preview"', '"de.familyprojekt.privatebrain.pro.preview"'),
  'Android-Symbol wieder Pros Logo': async dir => { await copyFile(join(dir, 'icon-512.png'), join(dir, 'android/app/src/main/res/drawable-nodpi/private_brain_icon.png')); return true; },
  'Update-Probe wieder auf Pros Paket': text('.github/workflows/android.yml', '-PprobeTarget=de.familyprojekt.privatebrain.v3.preview.debug', '-PprobeTarget=de.familyprojekt.privatebrain.pro.preview.debug'),
  'Veröffentlichung mit Pros Geheimnis': text('.github/workflows/v3-android-release.yml', 'secrets.V3_SIGNING_UNLOCK', 'secrets.PB_' + 'SIGNING_UNLOCK'),
  'Veröffentlichung ohne Grün-Bedingung': text('.github/workflows/v3-android-release.yml', 'actions/workflows/android.yml/runs?head_sha=$SOURCE_SHA', 'actions/runs'),
};
let caught = 0, slipped = 0, dead = 0;
for (const [name, sabotage] of Object.entries(cases)) {
  const dir = await mkdtemp(join(tmpdir(), 'pbv3-gegen-'));
  try {
    for (const f of files) { await mkdir(dirname(join(dir, f)), { recursive: true }); await cp(f, join(dir, f)); }
    if (!(await sabotage(dir))) { console.log('☠ toter Anker: ' + name); dead++; continue; }
    const r = spawnSync(process.execPath, ['tools/native/test-v3-identity.mjs', dir], { encoding: 'utf8' });
    if (r.status !== 0) { console.log('✓ gefangen: ' + name); caught++; } else { console.log('✗ durchgerutscht: ' + name); slipped++; }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
const clean = spawnSync(process.execPath, ['tools/native/test-v3-identity.mjs'], { encoding: 'utf8' }).status;
console.log(`\n${caught} gefangen · ${slipped} durchgerutscht · ${dead} tote Anker · unveränderter Stand ${clean === 0 ? 'grün' : 'ROT'}`);
if (slipped || dead || clean !== 0) process.exitCode = 1;
