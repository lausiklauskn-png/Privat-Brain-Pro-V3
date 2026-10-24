// Private Brain V3 Pro: own Android signing identity (Klaus 2026-10-24). Adapted from Pro's tools/signing format, but a
// NEW key for a NEW app: never Pro's key, never Pro's secret. The keystore is created only inside GitHub Actions
// (.github/workflows/v3-signing.yml) and stored in Git only AES-256-GCM-encrypted with a key derived from the repo secret
// V3_SIGNING_UNLOCK (PBKDF2-SHA256, 600 000 rounds). Nothing here prints passwords, keystore bytes or the secret.
import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes, X509Certificate } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, chmod, writeFile, readFile, rm, mkdir, open, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const APP_ID = 'de.familyprojekt.privatebrain.v3.preview';
export const UNLOCK_NAME = 'V3_SIGNING_UNLOCK';
export const SUBJECT = 'CN=Private Brain V3 Pro';
export const ALIAS = 'private-brain-v3';
export const PACKAGE_FILE = 'v3-android-release.enc.json';
export const CERT_FILE = 'v3-android-certificate.json';
const FORMAT = 'private-brain-v3-android-signing';
const ITERATIONS = 600000;
const VALIDITY_DAYS = 10950;                 // 30 years: Android needs the same certificate for every later update
const sha = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');

/** Errors whose text is ours and contains no secret material; anything else is reported generically. */
export class SafeError extends Error {}

export function requireUnlock(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SafeError('Das Repo-Geheimnis V3_SIGNING_UNLOCK fehlt. Bitte in GitHub unter Settings → Secrets and variables → Actions anlegen (langes Passwort, sicher aufbewahren) und den Lauf wiederholen.');
  }
  if (value.length < 20) throw new SafeError('V3_SIGNING_UNLOCK ist zu kurz: bitte ein langes Passwort mit mindestens 20 Zeichen verwenden.');
  return value;
}

function deriveKey(secret, salt) { return pbkdf2Sync(Buffer.from(requireUnlock(secret), 'utf8'), salt, ITERATIONS, 32, 'sha256'); }

function checked(command, args, env) {
  const childEnv = { ...process.env, ...env };
  delete childEnv[UNLOCK_NAME];
  const run = spawnSync(command, args, { env: childEnv, maxBuffer: 4 * 1024 * 1024 });
  // Subprocess output may include sensitive arguments or paths: never echo it.
  if (run.error || run.status !== 0) throw new SafeError(command + ' fehlgeschlagen; kein Schlüsselinhalt wird ausgegeben.');
  return run.stdout;
}

export async function privateDirectory(fn) {
  const dir = await mkdtemp(path.join(tmpdir(), 'pbv3-sign-'));
  await chmod(dir, 0o700);
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

export function publicCertificate(file, password, alias) {
  if (typeof password !== 'string' || !password || !/^[a-z0-9_-]+$/i.test(alias || '')) throw new SafeError('Ungültige Keystore-Angaben.');
  const der = checked('keytool', ['-exportcert', '-keystore', file, '-storepass:env', 'V3_STORE_PASSWORD', '-alias', alias], { V3_STORE_PASSWORD: password });
  const cert = new X509Certificate(der);
  return { der, cert, sha256: sha(der), sha1: sha(der, 'sha1'), subject: cert.subject, validTo: cert.validTo };
}

export function checkPrivateKey(file, password, alias) {
  // A certificate request needs the private key itself (exportcert does not); stdout never leaves this process.
  checked('keytool', ['-certreq', '-keystore', file, '-alias', alias,
    '-storepass:env', 'V3_STORE_PASSWORD', '-keypass:env', 'V3_STORE_PASSWORD'], { V3_STORE_PASSWORD: password });
}

/** New RSA 4096 key, 30 years, "CN=Private Brain V3 Pro"; returns the keystore bytes and its random password. */
export async function generateKeystore() {
  return privateDirectory(async dir => {
    const file = path.join(dir, 'v3.p12');
    const password = randomBytes(32).toString('hex');      // PKCS12: store and key share one password
    checked('keytool', ['-genkeypair', '-keystore', file, '-storetype', 'PKCS12', '-alias', ALIAS,
      '-keyalg', 'RSA', '-keysize', '4096', '-sigalg', 'SHA256withRSA', '-validity', String(VALIDITY_DAYS),
      '-dname', SUBJECT, '-storepass:env', 'V3_STORE_PASSWORD', '-keypass:env', 'V3_STORE_PASSWORD', '-noprompt'],
      { V3_STORE_PASSWORD: password });
    return { keystore: await readFile(file), password, alias: ALIAS };
  });
}

export async function sealIdentity({ keystore, password, alias, secret }) {
  return privateDirectory(async dir => {
    const file = path.join(dir, 'v3.p12');
    await writeFile(file, keystore, { mode: 0o600, flag: 'wx' });
    const cert = publicCertificate(file, password, alias);
    if (cert.subject.trim() !== SUBJECT) throw new SafeError('Zertifikat trägt nicht den Namen Private Brain V3 Pro.');
    checkPrivateKey(file, password, alias);
    const salt = randomBytes(16);
    const header = { format: FORMAT, version: 1, algorithm: 'aes-256-gcm', kdf: 'pbkdf2-sha256', iterations: ITERATIONS,
      salt: salt.toString('base64'), applicationId: APP_ID, certificateSha256: cert.sha256, certificateSha1: cert.sha1 };
    const key = deriveKey(secret, salt), nonce = randomBytes(12);
    const clear = Buffer.from(JSON.stringify({ alias, password, keystore: Buffer.from(keystore).toString('base64'), keystoreSha256: sha(keystore) }));
    try {
      const cipher = createCipheriv('aes-256-gcm', key, nonce);
      cipher.setAAD(Buffer.from(JSON.stringify(header)));
      const encrypted = Buffer.concat([cipher.update(clear), cipher.final()]);
      return { envelope: { ...header, nonce: nonce.toString('base64'), ciphertext: encrypted.toString('base64'), tag: cipher.getAuthTag().toString('base64') },
        certificate: { applicationId: APP_ID, subject: cert.subject, validTo: cert.validTo, certificateSha256: cert.sha256, certificateSha1: cert.sha1 } };
    } finally { clear.fill(0); key.fill(0); }
  });
}

function decode(value, size) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new SafeError('Ungültige Verschlüsselungsdaten.');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || (size && bytes.length !== size)) throw new SafeError('Ungültige Verschlüsselungsdaten.');
  return bytes;
}

/** Decrypts into a private temporary folder, checks certificate and private key, then calls fn(identity). */
export async function withIdentity(envelope, secret, fn) {
  const { format, version, algorithm, kdf, iterations, salt, applicationId, certificateSha256, certificateSha1, nonce, ciphertext, tag } = envelope || {};
  if (format !== FORMAT || version !== 1 || algorithm !== 'aes-256-gcm' || kdf !== 'pbkdf2-sha256' || iterations !== ITERATIONS || applicationId !== APP_ID ||
      !/^[a-f0-9]{64}$/.test(certificateSha256 || '') || !/^[a-f0-9]{40}$/.test(certificateSha1 || '')) {
    throw new SafeError('Falsches Signierpaket oder falsche App-Kennung (erwartet ' + APP_ID + ').');
  }
  const header = { format, version, algorithm, kdf, iterations, salt, applicationId, certificateSha256, certificateSha1 };
  const iv = decode(nonce, 12), auth = decode(tag, 16), encrypted = decode(ciphertext), saltBytes = decode(salt, 16);
  if (encrypted.length > 1024 * 1024) throw new SafeError('Signierpaket zu groß.');
  const key = deriveKey(secret, saltBytes);
  let clear;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(JSON.stringify(header))); decipher.setAuthTag(auth);
    try { clear = Buffer.concat([decipher.update(encrypted), decipher.final()]); }
    catch { throw new SafeError('Signierpaket lässt sich nicht öffnen: V3_SIGNING_UNLOCK falsch oder Paket verändert.'); }
    const content = JSON.parse(clear.toString('utf8'));
    const bytes = Buffer.from(content.keystore, 'base64');
    try {
      if (sha(bytes) !== content.keystoreSha256) throw new SafeError('Keystore-Prüfsumme stimmt nicht.');
      return await privateDirectory(async dir => {
        const file = path.join(dir, 'v3.p12');
        await writeFile(file, bytes, { mode: 0o600, flag: 'wx' });
        const cert = publicCertificate(file, content.password, content.alias);
        checkPrivateKey(file, content.password, content.alias);
        if (cert.sha256 !== certificateSha256 || cert.sha1 !== certificateSha1) throw new SafeError('Signierzertifikat stimmt nicht mit dem Paket überein.');
        return await fn({ file, password: content.password, alias: content.alias, sha256: cert.sha256, sha1: cert.sha1, directory: dir });
      });
    } finally { bytes.fill(0); content.password = ''; content.keystore = ''; }
  } finally { key.fill(0); if (clear) clear.fill(0); }
}

export async function identityExists(directory) {
  for (const name of [PACKAGE_FILE, CERT_FILE]) {
    try { await lstat(path.join(directory, name)); return true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return false;
}

export async function saveNewIdentity(directory, { envelope, certificate }) {
  await mkdir(directory, { recursive: true });
  if (await identityExists(directory)) throw new SafeError('Die V3-Signieridentität ist schon vorhanden (signing/' + PACKAGE_FILE + '); sie wird nie ersetzt.');
  const handle = await open(path.join(directory, PACKAGE_FILE), 'wx', 0o644);
  try { await handle.writeFile(JSON.stringify(envelope, null, 2) + '\n'); } finally { await handle.close(); }
  await writeFile(path.join(directory, CERT_FILE), JSON.stringify({ ...certificate, created: new Date().toISOString() }, null, 2) + '\n', { flag: 'wx', mode: 0o644 });
}

export async function verifyPinnedIdentity(directory, secret, fn = () => true) {
  let envelope, metadata;
  try {
    envelope = JSON.parse(await readFile(path.join(directory, PACKAGE_FILE), 'utf8'));
    metadata = JSON.parse(await readFile(path.join(directory, CERT_FILE), 'utf8'));
  } catch { throw new SafeError('Kein V3-Signierpaket gefunden (signing/' + PACKAGE_FILE + '). Zuerst „v3-signing“ mit create ausführen und die Dateien übernehmen.'); }
  if (metadata.applicationId !== APP_ID || metadata.certificateSha256 !== envelope.certificateSha256 || metadata.certificateSha1 !== envelope.certificateSha1) {
    throw new SafeError('Öffentlicher Zertifikats-Pin stimmt nicht mit dem Paket überein.');
  }
  return withIdentity(envelope, secret, fn);
}
