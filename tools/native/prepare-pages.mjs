// Webfassung von V3 für GitHub Pages (Klaus 2026-10-24): installierbar, mit eigenem Namen und Symbol „V3“.
// Läuft NACH build:web und ändert nur das Verzeichnis, das übergeben wird (Standard www). Die Android-App
// bekommt diese Schritte nicht: dort aktualisiert Android, und es gibt keinen Installieren-Knopf.
//   node tools/native/prepare-pages.mjs [verzeichnis]
import { readFile, writeFile, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = resolve(process.argv[2] || join(root, 'www'));
let version = 'lokal';
try { version = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}

for (const name of ['icon-v3-192.png', 'icon-v3-512.png']) await cp(join(root, name), join(dir, name));

const manifest = {
  id: './?app=private-brain-v3',
  name: 'Private Brain V3',
  short_name: 'Private Brain V3',
  description: 'Dein privater Offline-Raum: sammelt, ordnet und findet deine eigenen Daten nach Bedeutung.',
  lang: 'de', dir: 'ltr', start_url: './index.html', scope: './', display: 'standalone', orientation: 'any',
  background_color: '#faf6f0', theme_color: '#faf6f0', categories: ['productivity', 'utilities'],
  icons: [
    { src: 'icon-v3-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-v3-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-v3-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: 'icon-v3-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
await writeFile(join(dir, 'app-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// Service Worker: immer zuerst das Netz, damit nie eine alte Fassung zuerst erscheint; ohne Netz der Vorrat.
// Eigener Vorrat-Präfix „pbv3-web-“: caches gehören dem ganzen Ursprung (lausiklauskn-png.github.io),
// fremde Apps (auch die alte Private-Brain-PWA mit „private-brain-“) bleiben unberührt.
const worker = `/* Private Brain V3 (Webfassung, erzeugt von tools/native/prepare-pages.mjs, Stand ${version}). */
const PREFIX = 'pbv3-web-', CACHE = PREFIX + ${JSON.stringify(version)};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== CACHE && k !== PREFIX + 'alt-ersetzt') await caches.delete(k);
    await self.clients.claim();
    // Einmalig: Hatte dieses Gerät die alte Fassung (Vorrat „private-brain-v93“ aus der früheren Veröffentlichung
    // aus dem Zweig), zeigen offene Fenster sie noch. Sie einmal frisch laden; den fremden Vorrat nicht anfassen.
    const keys = await caches.keys();
    if (keys.includes('private-brain-v93') && !keys.includes(PREFIX + 'alt-ersetzt')) {
      await caches.open(PREFIX + 'alt-ersetzt');
      for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url).catch(() => {});
    }
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(async () => (await caches.open(CACHE).then(c => c.match(req))) || (req.mode === 'navigate' ? caches.open(CACHE).then(c => c.match('./index.html')) : Response.error())));
});
`;
await writeFile(join(dir, 'sw.js'), worker);

let html = await readFile(join(dir, 'index.html'), 'utf8');
const swap = (before, after) => { if (!html.includes(before)) throw new Error('prepare-pages: nicht gefunden: ' + before); html = html.split(before).join(after); };
swap('<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png?v=3d">', '<link rel="icon" type="image/png" sizes="192x192" href="icon-v3-192.png">');
// Klaus 2026-10-25: die Apps heißen „Private Brain V3 Pro“, die Browserfassung nur „Private Brain V3“.
swap('<title>Private Brain V3 Pro — nach Bedeutung suchen</title>', '<title>Private Brain V3 — nach Bedeutung suchen</title>');
swap('<meta name="apple-mobile-web-app-title" content="Private Brain V3 Pro">', '<meta name="apple-mobile-web-app-title" content="Private Brain V3">');
swap('<h1>Private Brain V3 Pro</h1>', '<h1>Private Brain V3</h1>');
swap('<link rel="apple-touch-icon" href="icon-192.png?v=3d">', '<link rel="apple-touch-icon" href="icon-v3-192.png">\n<link rel="manifest" href="app-manifest.json">');
// Installieren-Knopf (Kanon-Datei, unverändert) wieder einbinden; native.css blendet ihn sonst aus.
const pagesBits = `<style>html.pb-web #installieren{display:inline-flex!important;align-items:center;gap:4px;height:28px;padding:0 10px;border-radius:8px;font-size:.8rem;white-space:nowrap;box-shadow:none}html.pb-web #install-box{display:block!important}@media (display-mode: standalone){html.pb-web #installieren{display:none!important}}</style>
<script>/* Die App-Leiste legt den Platzhalter ins ☰-Menü; der Knopf soll aber sichtbar oben stehen (Klaus 2026-10-24). */addEventListener('load',()=>{const put=()=>{const b=document.getElementById('installieren'),t=document.querySelector('header.top .tools');if(b&&t&&b.parentElement!==t)t.prepend(b);};put();new MutationObserver(put).observe(document.body,{childList:true,subtree:true});});</script>
<script>document.documentElement.classList.add('pb-web');if('serviceWorker' in navigator){/* Lieferte ein alter Worker diese Seite, einmal frisch laden, sobald der neue übernimmt. */const had=!!navigator.serviceWorker.controller;let done=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!done){done=true;location.reload();}});addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}</script>
<script src="assets/installieren.js?v=1" data-name="Private Brain V3" data-in="#install-box" data-klasse="primary" data-vor="install-platz" defer></script>
</head>`;
swap('</head>', pagesBits);
await writeFile(join(dir, 'index.html'), html);
console.log('Pages-Fassung vorbereitet in ' + dir + ' (Stand ' + version + ').');
