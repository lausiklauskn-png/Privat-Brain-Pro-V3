// Wächter: Private Brain V3 Pro ist eine eigene App neben Private Brain Pro (Klaus 2026-10-24, docs/V3-IDENTITAET.md).
// Kennung, Name und Version stimmen in Android, Capacitor und Windows überein; keine Kennung enthält „privatebrain.pro“;
// Updates fragen nur V3 (eigener Tag-Anfang); Symbol ist das V3-Logo; Signier-Abläufe kennen Pros Geheimnis nicht.
// Aufruf: node tools/native/test-v3-identity.mjs [Wurzel]   (Gegenprobe: tools/native/gegenprobe-v3-identity.mjs)
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(process.argv[2] || '.');
const read = file => readFileSync(join(root, file), 'utf8');
const ID = 'de.familyprojekt.privatebrain.v3', NAME = 'Private Brain V3 Pro';
let count = 0, failed = 0;
const ok = (name, value) => { if (value) { console.log('✓ ' + name); count++; } else { console.log('✗ ' + name); failed++; } };

const gradle = read('android/app/build.gradle');
const appId = /applicationId\s+"([^"]+)"/.exec(gradle)?.[1];
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
const cap = JSON.parse(read('capacitor.config.json'));
const strings = read('android/app/src/main/res/values/strings.xml');
const string = name => new RegExp(`<string name="${name}">([^<]*)</string>`).exec(strings)?.[1];
const tauri = JSON.parse(read('windows/src-tauri/tauri.conf.json'));

ok('Android applicationId ist ' + ID, appId === ID);
ok('Endungen .preview und .preview.debug bleiben', /preview\s*\{[^}]*applicationIdSuffix\s+"\.preview"/.test(gradle) && /debug\s*\{[^}]*applicationIdSuffix\s+"\.preview\.debug"/.test(gradle));
ok('Capacitor appId = Android applicationId', cap.appId === appId);
ok('Windows identifier = Android applicationId', tauri.identifier === appId);
ok('strings.xml package_name und custom_url_scheme = applicationId', string('package_name') === appId && string('custom_url_scheme') === appId);
ok(`Name „${NAME}“ überall gleich (Android, Capacitor, Windows)`, [string('app_name'), string('title_activity_main'), cap.appName, tauri.productName].every(v => v === NAME));
ok('eigene Versionsreihe 3.x: Android versionName = Windows version', /^3\.\d+\.\d+-preview\.\d+$/.test(versionName || '') && tauri.version === versionName);
ok('versionCode = Vorschau-Nummer (3.0.0-preview.N → N)', versionCode === Number(versionName?.split('.').pop()));
const ids = [appId, cap.appId, tauri.identifier, string('package_name'), string('custom_url_scheme')];
ok('keine Kennung enthält „privatebrain.pro“', ids.every(v => v && !v.includes('privatebrain.pro')));
ok('Manifest nutzt ${applicationId} für den FileProvider', read('android/app/src/main/AndroidManifest.xml').includes('android:authorities="${applicationId}.fileprovider"'));

const policy = read('android/app/src/main/java/de/familyprojekt/privatebrain/pro/UpdatePolicy.java');
const updates = read('android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProUpdatesPlugin.java');
ok('Updates nur aus lausiklauskn-png/Privat-Brain-Pro-V3, Tags „v3-android-“', policy.includes('REPOSITORY = "lausiklauskn-png/Privat-Brain-Pro-V3"') && policy.includes('TAG_PREFIX = "v3-android-"'));
ok('Update-Prüfung kennt nur die V3-Pakete', updates.includes(`"${ID}.preview"`) && updates.includes(`"${ID}"`) && !updates.includes('privatebrain.pro.preview'));
ok('Windows-Updates bleiben im eigenen Kanal „v3-windows-“', read('windows/engine/src/DesktopUpdates.java').includes('TAG_PREFIX="v3-windows-"'));

const icon = readFileSync(join(root, 'android/app/src/main/res/drawable-nodpi/private_brain_icon.png'));
ok('Android-Symbol ist das V3-Pro-Logo (icon-v3-pro-512.png)', icon.equals(readFileSync(join(root, 'icon-v3-pro-512.png'))));
ok('Gmail-Schalter für den fehlenden Google-Android-Client vorhanden', /<bool name="gmail_android_client_ready">(true|false)<\/bool>/.test(read('android/app/src/main/res/values/v3_identity.xml')));

const ci = read('.github/workflows/android.yml');
ok('Update-Probe in CI zielt auf ' + ID + '.preview.debug', ci.includes(`-PprobeTarget=${ID}.preview.debug`) && ci.includes(`PB_UPGRADE_TEST_PACKAGE=${ID}.preview.debug`) && !ci.includes('privatebrain.pro.preview'));
const release = read('.github/workflows/v3-android-release.yml'), signing = read('.github/workflows/v3-signing.yml');
ok('Veröffentlichung nur für ' + ID + '.preview mit Tag „v3-android-“', release.includes(`package: name='${ID}.preview'`) && release.includes('tag="v3-android-$VERSION"') && release.includes(`application-label:'${NAME}'`));
ok('Veröffentlichung verlangt grüne android.yml auf demselben Commit', release.includes('actions/workflows/android.yml/runs?head_sha=$SOURCE_SHA'));
const workflows = ['android.yml', 'v3-android-release.yml', 'v3-signing.yml', 'windows-app.yml', 'pages.yml', 'v3-windows-release.yml'].filter(f => existsSync(join(root, '.github/workflows', f))).map(f => read('.github/workflows/' + f)).join('\n');
ok('kein Ablauf nutzt Pros Signier-Geheimnis', !workflows.includes('PB_' + 'SIGNING_UNLOCK') && signing.includes('secrets.V3_SIGNING_UNLOCK') && release.includes('secrets.V3_SIGNING_UNLOCK'));
const winRelease = existsSync(join(root, '.github/workflows/v3-windows-release.yml')) ? read('.github/workflows/v3-windows-release.yml') : '';
ok('Windows-Veröffentlichung nur aus grünem windows-app.yml auf main, Tag v3-windows-, nie Pros Repo', winRelease.includes('actions/workflows/windows-app.yml/runs?head_sha=$GITHUB_SHA') && winRelease.includes('tag="v3-windows-$VERSION"') && !winRelease.includes('Privat-Brain-Pro/'));
ok('keine Signierdateien von Pro im Repo', !existsSync(join(root, 'signing/android-release.enc.json')) && !existsSync(join(root, 'tools/signing/identity.mjs')));

console.log(`\n${count} grün · ${failed} rot`);
if (failed) process.exitCode = 1;
