#!/usr/bin/env node
// Gemeinsame Bausteine der Pro-Apps, die Private Brain V3 nutzt (Pro-Umbau 14): Bedienung (Kasten, ⓘ, Knopf), die Feld-Stile aus
// pro-ueberall.css und der Chefcode. Quelle: Private Brain Pro (native/), dort gepflegt — hier NIE von Hand ändern.
//   node tools/native/pro-bausteine-nachziehen.mjs --quelle ../Privat-Brain-Pro   kopieren + Herkunft pinnen
//   node tools/native/pro-bausteine-nachziehen.mjs                                 prüfen (Rückgabe 1 bei Abweichung)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BAUSTEINE = ['pro-bedienung.js', 'pro-bedienung.css', 'pro-ueberall.css', 'pro-chefcode.js'];
const pinDatei = join(root, 'native/pro-bausteine-herkunft.json');
const sha = b => createHash('sha256').update(b).digest('hex');
const i = process.argv.indexOf('--quelle');
if (i > 0) {
  const quelle = resolve(process.argv[i + 1] || '');
  const fassung = Number((readFileSync(join(quelle, 'native/pro-bedienung.js'), 'utf8').match(/const FASSUNG = (\d+)/) || [])[1]);
  let commit = ''; try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: quelle, encoding: 'utf8' }).trim(); } catch { /* ohne */ }
  const dateien = {};
  for (const n of BAUSTEINE) { const b = readFileSync(join(quelle, 'native', n)); writeFileSync(join(root, 'native', n), b); dateien[n] = sha(b); }
  writeFileSync(pinDatei, JSON.stringify({ _: 'Gemeinsame Bausteine der Pro-Apps in Private Brain V3. Quelle: Private Brain Pro. Nie von Hand ändern.', quelle: 'lausiklauskn-png/Privat-Brain-Pro', commit, fassung, dateien }, null, 2) + '\n');
  console.log(`übernommen: ${BAUSTEINE.length} Bausteine (Fassung ${fassung}) aus ${commit}`);
}
const pin = JSON.parse(readFileSync(pinDatei, 'utf8'));
const falsch = BAUSTEINE.filter(n => pin.dateien[n] !== sha(readFileSync(join(root, 'native', n))));
if (falsch.length) { console.error('Von Hand geändert oder veraltet: ' + falsch.join(', ') + ' — node tools/native/pro-bausteine-nachziehen.mjs --quelle ../Privat-Brain-Pro'); process.exit(1); }
console.log(`Pro-Bausteine byte-gleich mit der Herkunft (Fassung ${pin.fassung}).`);
