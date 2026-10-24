// Self-test of the V3 signing tools with a DISPOSABLE key in a temporary folder (never the real V3 key, never Pro's).
// Runs the CLI exactly as the workflows do: create, refuse a second create, check, wrong secret, tampering,
// missing secret, prepare-gradle. Needs keytool (Java).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), 'pbv3-signtest-'));
const signing = path.join(dir, 'signing');
const secret = 'wegwerf-nur-fuer-den-selbsttest-' + Date.now();
let count = 0;
const ok = (name, value) => { assert.ok(value, name); console.log('✓ ' + name); count++; };
function run(command, env = {}) {
  const clean = { ...process.env }; delete clean.V3_SIGNING_UNLOCK; delete clean.GITHUB_ACTIONS; delete clean.GITHUB_STEP_SUMMARY;
  const r = spawnSync(process.execPath, [cli, command], { env: { ...clean, V3_SIGNING_DIR: signing, TMPDIR: dir, ...env }, encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
try {
  const missing = run('create');
  ok('ohne V3_SIGNING_UNLOCK: klare deutsche Meldung, nichts angelegt', missing.code === 1 && missing.out.includes('V3_SIGNING_UNLOCK fehlt') && missing.out.includes('Secrets and variables'));
  ok('zu kurzes Geheimnis wird abgelehnt', run('create', { V3_SIGNING_UNLOCK: 'kurz' }).out.includes('zu kurz'));

  const created = run('create', { V3_SIGNING_UNLOCK: secret });
  ok('create legt eine neue Identität an und zeigt SHA-256 und SHA-1', created.code === 0 && /SHA-256: `([0-9A-F]{2}:){31}[0-9A-F]{2}`/.test(created.out) && /SHA-1 \(für den Google-Android-Client\): `([0-9A-F]{2}:){19}[0-9A-F]{2}`/.test(created.out));
  const files = (await readdir(signing)).sort();
  ok('nur verschlüsseltes Paket und öffentliches Zertifikat', JSON.stringify(files) === JSON.stringify(['v3-android-certificate.json', 'v3-android-release.enc.json']));
  const envelope = JSON.parse(await readFile(path.join(signing, 'v3-android-release.enc.json'), 'utf8'));
  const cert = JSON.parse(await readFile(path.join(signing, 'v3-android-certificate.json'), 'utf8'));
  ok('Paket gehört zu de.familyprojekt.privatebrain.v3.preview, AES-256-GCM mit PBKDF2', envelope.applicationId === 'de.familyprojekt.privatebrain.v3.preview' && envelope.algorithm === 'aes-256-gcm' && envelope.kdf === 'pbkdf2-sha256' && envelope.iterations === 600000);
  ok('Zertifikat heißt „Private Brain V3 Pro“, Pins stimmen überein', cert.subject === 'CN=Private Brain V3 Pro' && cert.certificateSha256 === envelope.certificateSha256 && cert.certificateSha1 === envelope.certificateSha1);
  ok('30 Jahre gültig', new Date(cert.validTo).getFullYear() >= new Date().getFullYear() + 29);
  const stored = JSON.stringify(envelope) + JSON.stringify(cert);
  ok('kein Geheimnis und kein Keystore im Klartext', !stored.includes(secret) && !stored.includes('"password"') && !stored.includes('keystore'));
  ok('Ausgabe nennt das Geheimnis nie', !created.out.includes(secret));

  const again = run('create', { V3_SIGNING_UNLOCK: secret });
  ok('zweites create verweigert und ersetzt nichts', again.code === 1 && again.out.includes('schon vorhanden') && (await readFile(path.join(signing, 'v3-android-release.enc.json'), 'utf8')) === JSON.stringify(envelope, null, 2) + '\n');

  const check = run('check', { V3_SIGNING_UNLOCK: secret });
  ok('check öffnet das Paket und prüft den privaten Schlüssel', check.code === 0 && check.out.includes('privater Schlüssel geprüft'));
  const wrong = run('check', { V3_SIGNING_UNLOCK: secret + '-falsch' });
  ok('falsches Geheimnis wird erkannt', wrong.code === 1 && wrong.out.includes('V3_SIGNING_UNLOCK falsch oder Paket verändert'));

  const tampered = { ...envelope, ciphertext: Buffer.from(Buffer.from(envelope.ciphertext, 'base64').map((b, i) => i === 5 ? b ^ 1 : b)).toString('base64') };
  await writeFile(path.join(signing, 'v3-android-release.enc.json'), JSON.stringify(tampered, null, 2) + '\n');
  ok('verändertes Paket wird erkannt', run('check', { V3_SIGNING_UNLOCK: secret }).code === 1);
  await writeFile(path.join(signing, 'v3-android-release.enc.json'), JSON.stringify({ ...envelope, applicationId: 'de.familyprojekt.privatebrain.pro.preview' }, null, 2) + '\n');
  ok('Paket mit Pros Kennung wird abgelehnt', run('check', { V3_SIGNING_UNLOCK: secret }).out.includes('falsche App-Kennung'));
  await writeFile(path.join(signing, 'v3-android-release.enc.json'), JSON.stringify(envelope, null, 2) + '\n');

  const githubEnv = path.join(dir, 'github-env');
  await writeFile(githubEnv, '');
  const prepared = run('prepare-gradle', { V3_SIGNING_UNLOCK: secret, GITHUB_ENV: githubEnv, RUNNER_TEMP: dir });
  const envText = await readFile(githubEnv, 'utf8');
  ok('prepare-gradle gibt V3_KEYSTORE_* nur an den Job weiter und maskiert die Passwörter', prepared.code === 0 && ['V3_KEYSTORE_FILE', 'V3_KEYSTORE_PASSWORD', 'V3_KEY_ALIAS', 'V3_KEY_PASSWORD'].every(n => envText.includes(n + '<<')) && prepared.out.includes('::add-mask::') && !envText.includes('PB_'));
  const tools = (await readFile(fileURLToPath(new URL('./v3-identity.mjs', import.meta.url)), 'utf8')) + (await readFile(cli, 'utf8'));
  ok('V3-Werkzeuge kennen Pros Geheimnis nicht', !tools.includes('PB_' + 'SIGNING_UNLOCK') && !tools.includes('362ee70d'));
  console.log(`\n${count} grün · 0 rot`);
} finally { await rm(dir, { recursive: true, force: true }); }
