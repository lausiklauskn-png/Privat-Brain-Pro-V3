// Private Brain V3 Pro signing in GitHub Actions only: create | check | prepare-gradle.
// The secret comes from the repo secret V3_SIGNING_UNLOCK; only public fingerprints are ever printed.
import { appendFile, copyFile, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ID, UNLOCK_NAME, SafeError, requireUnlock, generateKeystore, sealIdentity, withIdentity,
  identityExists, saveNewIdentity, verifyPinnedIdentity } from './v3-identity.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
// V3_SIGNING_DIR exists only for the disposable self-test; the workflows always use the repository's signing/.
const directory = process.env.V3_SIGNING_DIR || path.join(root, 'signing');
const [command] = process.argv.slice(2);

async function summary(text) {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text + '\n');
}
const colons = hex => hex.toUpperCase().match(/../g).join(':');

try {
  const secret = requireUnlock(process.env[UNLOCK_NAME]);
  if (command === 'create') {
    if (await identityExists(directory)) throw new SafeError('Die V3-Signieridentität ist schon vorhanden (signing/v3-android-release.enc.json). Sie wird nie ersetzt; zum Prüfen „check“ wählen.');
    const fresh = await generateKeystore();
    try {
      const sealed = await sealIdentity({ ...fresh, secret });
      await withIdentity(sealed.envelope, secret, () => true);          // reopen before anything is kept
      await saveNewIdentity(directory, sealed);
      await verifyPinnedIdentity(directory, secret);
      await summary(['## Neue Signieridentität für Private Brain V3 Pro', '',
        `App-Kennung: \`${APP_ID}\``, '',
        `SHA-256: \`${colons(sealed.certificate.certificateSha256)}\``, '',
        `SHA-1 (für den Google-Android-Client): \`${colons(sealed.certificate.certificateSha1)}\``, '',
        'Nur das verschlüsselte Paket und das öffentliche Zertifikat liegen im Artefakt `v3-signierpaket`.'].join('\n'));
    } finally { fresh.keystore.fill(0); fresh.password = ''; }
  } else if (command === 'check') {
    const result = await verifyPinnedIdentity(directory, secret, identity => ({ sha256: identity.sha256, sha1: identity.sha1 }));
    await summary(`V3-Signierpaket geöffnet, Zertifikat und privater Schlüssel geprüft.\n\nSHA-256: \`${colons(result.sha256)}\`\n\nSHA-1: \`${colons(result.sha1)}\``);
  } else if (command === 'prepare-gradle') {
    if (!process.env.GITHUB_ENV || !process.env.RUNNER_TEMP) throw new SafeError('Die Gradle-Freigabe gibt es nur in GitHub Actions.');
    const file = path.join(process.env.RUNNER_TEMP, 'private-brain-v3.p12');
    const sha256 = await verifyPinnedIdentity(directory, secret, async identity => {
      await copyFile(identity.file, file); await chmod(file, 0o600);
      const values = { V3_KEYSTORE_FILE: file, V3_KEYSTORE_PASSWORD: identity.password, V3_KEY_ALIAS: identity.alias, V3_KEY_PASSWORD: identity.password };
      for (const [name, value] of Object.entries(values)) {
        if (name !== 'V3_KEYSTORE_FILE') console.log('::add-mask::' + value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A'));
        const delimiter = 'V3_' + randomBytes(24).toString('hex');
        await appendFile(process.env.GITHUB_ENV, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
      }
      return identity.sha256;
    });
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `certificate_sha256=${sha256}\n`);
    console.log('V3-Signierer geprüft und nur für diesen Actions-Job freigegeben.');
  } else throw new SafeError('Aufruf: create | check | prepare-gradle');
} catch (error) {
  // Our own messages carry no secrets; anything unexpected (parser, subprocess, paths) is never echoed.
  console.error(error instanceof SafeError ? error.message : 'V3-Signieroperation abgebrochen; keine geheimen Daten ausgegeben.');
  if (process.env.GITHUB_ACTIONS) console.log('::error title=V3-Signierung::' + (error instanceof SafeError ? error.message : 'Abgebrochen'));
  process.exitCode = 1;
}
