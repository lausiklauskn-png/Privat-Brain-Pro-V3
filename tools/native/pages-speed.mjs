// Schnellerer Start der Webfassung auf GitHub Pages (Klaus 2026-10-26, Lighthouse-Leistung 61).
// Läuft nur in prepare-pages.mjs, also nur für die Browserfassung. Apps (Android, Windows) und alle Quelldateien im
// Repo bleiben unverändert; geschützte Module werden nur in der ausgelieferten Kopie verkleinert, der Drift-Guard
// prüft weiter die Quellen.
//   1. kleines Logo statt des 512-px-Bildes (Lighthouse: 327 KB für 49 px)
//   2. Bedeutungs-Modell erst nach dem Laden (mit Katalog) oder bei der ersten Bedienung (leerer Katalog)
//   3. die Stylesheets im Kopf als eine Datei, Schriften vorab
//   4. Skripte im Seitenkörper laden gleichzeitig und laufen erst nach dem Zeichnen, in derselben Reihenfolge
//      (eingebettete Skripte dafür in eigene Dateien, damit die Reihenfolge exakt bleibt)
//   5. JavaScript verkleinert
import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { minify } from 'terser';

export async function speedUpPages(dir, root, html) {
  const swap = (before, after) => { if (!html.includes(before)) throw new Error('pages-speed: nicht gefunden: ' + before); html = html.split(before).join(after); };

  // 1. Logo
  await cp(join(root, 'icon-kopf-96.png'), join(dir, 'icon-kopf-96.png'));
  swap('<img src="icon-512.png" alt="" width="46" height="46">', '<img src="icon-kopf-96.png" alt="" width="46" height="46">');

  // 2. Bedeutungs-Modell: im Browser lud es bisher bei jedem Aufruf sofort (Bibliothek von jsDelivr, dann das Modell).
  swap('(window.PBSemantic ? PBSemantic.start(initEmbedding) : initEmbedding());',
    '(window.PBSemantic ? PBSemantic.start(initEmbedding) : pbWebModelLater(initEmbedding));');
  const later = `<script>/* Webfassung: Modell nicht beim ersten Zeichnen laden. Mit Katalog nach dem Laden, sonst bei der ersten Bedienung. */
function pbWebModelLater(start){var go=function(){go=function(){};start();};
if(typeof CATALOG!=='undefined'&&CATALOG.length){if(document.readyState==='complete')setTimeout(function(){go();},0);else addEventListener('load',function(){setTimeout(function(){go();},0);},{once:true});return;}
['pointerdown','keydown','focusin'].forEach(function(t){addEventListener(t,function(){go();},{once:true,capture:true});});}
</script>`;

  // 3. Stylesheets im Kopf: eine Datei in derselben Reihenfolge (keine relativen Adressen darin, geprüft beim Bau)
  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"?]+)">\n/g)];
  const bundle = [];
  for (const [tag, href] of links) {
    const css = await readFile(join(dir, href), 'utf8');
    if (/url\((?!["']?data:)/.test(css) || /@import/.test(css)) throw new Error('pages-speed: relative Adresse in ' + href);
    bundle.push('/* ' + href + ' */\n' + css);
  }
  if (links.length < 5) throw new Error('pages-speed: Stylesheets nicht gefunden');
  await writeFile(join(dir, 'web.css'), bundle.join('\n'));
  html = html.replace(links[0][0], '<link rel="stylesheet" href="web.css">\n');
  for (const [tag] of links.slice(1)) html = html.replace(tag, '');
  const fonts = ['Lato-400-latin', 'Lato-700-latin', 'OpenSans-400-latin']
    .map(f => `<link rel="preload" href="assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n');
  swap('<link rel="stylesheet" href="web.css">', fonts + '\n<link rel="stylesheet" href="web.css">');

  // 3b. Hilfetext der Bildsuche sofort sichtbar (Lighthouse: größtes Element, kam erst mit dem letzten Skript).
  // pb-bildbeschreibung.js (byte-gleich mit Pro) baut die Zeile selbst und bleibt unverändert. Hier steht eine Vorab-
  // Fassung mit gleichem Aussehen, nicht bedienbar (inert, aria-hidden); sobald die echte Zeile da ist, verschwindet sie.
  await writeFile(join(dir, 'web.css'), (await readFile(join(dir, 'web.css'), 'utf8')) + '\n/* Vorab-Zeile der Bildsuche */\n'
    + (await readFile(join(dir, 'help-layout.css'), 'utf8')).split('html.pb-help-ready ').join('#pb-bild-row-vorab '));
  const box = html.indexOf('<div class="searchbox">', html.indexOf('id="panel-search"'));
  if (box < 0) throw new Error('pages-speed: Suchfeld nicht gefunden');
  let depth = 0, end = -1;
  for (const m of html.slice(box).matchAll(/<div\b|<\/div>/g)) { depth += m[0] === '</div>' ? -1 : 1; if (!depth) { end = box + m.index + 6; break; } }
  const icon = (d, size, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="${size}" height="${size}" class="pb-bild-icon">${extra}<path d="${d}"></path></svg>`;
  const vorab = `\n    <div id="pb-bild-row-vorab" class="pb-bild-row" aria-hidden="true" inert>`
    + `<button type="button" class="pb-bild-filter" tabindex="-1">${icon('M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.1', 16)}<span class="pb-bild-filter-label">Bildbeschreibung</span></button>`
    + `<button type="button" class="pb-help-toggle pb-bild-help-toggle" aria-expanded="true" tabindex="-1">${icon('M12 10v7m0-10v.01', 20, '<circle cx="12" cy="12" r="9"></circle>')}</button>`
    + `<div class="pb-help-content pb-bild-help">Findet Bilder nach dem, was das Modell erkannt hat, und nach deinen eigenen Worten. Ohne Suchwort stehen alle beschriebenen Bilder da.</div></div>`
    + `\n    <script>(function(){var v=document.getElementById('pb-bild-row-vorab');try{var o=JSON.parse(localStorage.getItem('pb_help_open_v1')||'null');if(document.documentElement.lang!=='de'||(o&&o['bild-filter']===false)){v.remove();return;}}catch(e){}`
    + `var gone=function(){if(v.isConnected)v.remove();};new MutationObserver(function(r,ob){if(document.getElementById('pb-bild-row')){gone();ob.disconnect();}}).observe(v.parentNode,{childList:true});addEventListener('load',gone,{once:true});})();</script>`;
  if (end < 0) throw new Error('pages-speed: Ende des Suchfelds nicht gefunden');
  html = html.slice(0, end) + vorab + html.slice(end);

  // 4. Skripte im Seitenkörper ab dem ersten nachgeladenen Skript
  const body = html.indexOf('<body>');
  const first = html.indexOf('<script src=', body);
  if (body < 0 || first < 0) throw new Error('pages-speed: Seitenkörper/Skripte nicht gefunden');
  // Was schon vorher verzögert lief (defer/module, auch im Kopf), lief NACH allen anderen Skripten. Damit das so
  // bleibt, kommen diese Skripte in ihrer Reihenfolge ans Ende des Seitenkörpers.
  const late = [];
  const lateTag = /<script[^>]*\bsrc=[^>]*\b(defer|type="module")[^>]*><\/script>\n?/g;
  let head = html.slice(0, first).replace(lateTag, tag => { late.push(tag.trim()); return ''; });
  let rest = html.slice(first).replace(lateTag, tag => { late.push(tag.trim()); return ''; }), n = 0;
  if (!rest.includes('</body>')) throw new Error('pages-speed: </body> nicht gefunden');
  rest = rest.replace('</body>', late.join('\n') + '\n</body>');
  await mkdir(join(dir, 'web-inline'), { recursive: true });
  const inline = [];
  rest = rest.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g, (tag, attrs, code) => {
    if (/\bsrc=/.test(attrs)) {
      if (/\b(defer|async)\b|type="module"/.test(attrs)) return tag;
      return `<script${attrs} defer></script>`;
    }
    if (attrs.trim()) throw new Error('pages-speed: eingebettetes Skript mit Angaben: ' + attrs);
    const name = `web-inline/${String(++n).padStart(2, '0')}.js`;
    inline.push([name, code]);
    return `<script src="${name}" defer></script>`;
  });
  for (const [name, code] of inline) await writeFile(join(dir, name), code);
  html = head + rest;
  swap('</head>', later + '\n</head>');

  // 5. JavaScript verkleinern (Kommentare mit Urheberrecht bleiben)
  const keep = /©|copyright|@license|FP-COPYRIGHT|Klaus Nitzsche/i;
  let before = 0, after = 0;
  const shrink = async file => {
    const src = await readFile(file, 'utf8');
    const module = /^\s*(import|export)\b/m.test(src);
    const r = await minify(src, { module, compress: true, mangle: { keep_fnames: true, keep_classnames: true }, keep_fnames: true, keep_classnames: true, format: { comments: (n, c) => keep.test(c.value) } });
    before += src.length; after += r.code.length;
    await writeFile(file, r.code);
  };
  for (const sub of ['', 'assets', 'modules', 'web-inline']) {
    for (const e of await readdir(join(dir, sub), { withFileTypes: true })) {
      if (e.isFile() && /\.m?js$/.test(e.name) && !/\.min\.js$/.test(e.name) && e.name !== 'sw.js') await shrink(join(dir, sub, e.name));
    }
  }
  console.log(`Pages-Beschleunigung: ${links.length} Stylesheets → 1, ${inline.length} eingebettete Skripte ausgelagert, JavaScript ${Math.round(before / 1024)} → ${Math.round(after / 1024)} KB.`);
  return html;
}
