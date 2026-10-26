// V3-Oberfläche schon beim Bau (Klaus 2026-10-25): „man kann doch gleich das Original richtig rendern“.
// Was native-toolbar.js, native-navigation.js, themes.js, native.js und v3-ui.js beim Start einmalig umbauen,
// steht hier fertig im HTML: Leiste in der Kopfzeile, ☰-Menü, Liniensymbole, Schalter „Bedeutung“, Sprachkürzel.
// Die Skripte finden diese Teile vor und hängen nur noch ihre Handgriffe an. index.html (Pros Stand) bleibt
// unverändert. Jede Ersetzung wirft einen Fehler, wenn ihr Anker fehlt – auch wenn Funktionen aus Pro herüberkommen.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Liest ein Objekt-Literal `const NAME = {…};` aus einer Quelldatei: eine Quelle für die Symbole, keine Abschrift. */
function literal(source, name, file) {
  const m = new RegExp('const ' + name + '\\s*=\\s*\\{').exec(source);
  if (!m) throw new Error('v3-prerender: ' + name + ' nicht gefunden in ' + file);
  // Klammern zählen, Zeichenketten überspringen.
  let i = m.index + m[0].length - 1, depth = 0, quote = '';
  for (; i < source.length; i++) {
    const c = source[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return Function('"use strict";return (' + source.slice(m.index + m[0].length - 1, i + 1) + ');')();
}
function stringConst(source, name, file) {
  const m = new RegExp("const " + name + " = '([^']*)';").exec(source);
  if (!m) throw new Error('v3-prerender: ' + name + ' nicht gefunden in ' + file);
  return m[1];
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = html => html.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');

export async function prerenderV3(html, root, { version } = {}) {
  const read = f => readFile(join(root, f), 'utf8');
  const toolbarJs = await read('native/native-toolbar.js'), uiJs = await read('assets/v3-ui.js'), themesJs = await read('assets/themes.js');
  const PATHS = literal(toolbarJs, 'paths', 'native-toolbar.js');
  const CAPTIONS = literal(toolbarJs, 'captions', 'native-toolbar.js').de;
  const ICONS = literal(uiJs, 'ICONS', 'v3-ui.js');
  const EMOJI = literal(uiJs, 'EMOJI', 'v3-ui.js');
  const PALETTE = stringConst(themesJs, 'PALETTE', 'themes.js');
  const PAGES = ['search', 'intake', 'explorer', 'mail', 'dash', 'order', 'dupes', 'settings'], ICON_ONLY = new Set(['search', 'settings']);
  const svgC = key => `<svg class="compact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${PATHS[key] || PATHS.more}"></path></svg>`;
  const svgV = (key, extra = '') => `<svg class="v3-icon${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[key] || ICONS.folder}"></path></svg>`;

  const swap = (before, after) => {
    if (!html.includes(before)) throw new Error('v3-prerender: Anker fehlt: ' + before.slice(0, 120));
    html = html.replace(before, () => after);
  };
  const cut = (re, what) => {
    const m = re.exec(html);
    if (!m) throw new Error('v3-prerender: Block fehlt: ' + what);
    html = html.slice(0, m.index) + html.slice(m.index + m[0].length);
    return m;
  };

  // ---------- <html class="v3"> ----------
  swap('<html lang="de">', '<html lang="de" class="v3">');

  // ---------- Navigationsleiste (native-toolbar.js decorate) ----------
  function tab(button) {
    const m = /^<button class="([^"]*)" data-tab="([a-z]+)"([^>]*)>([\s\S]*?)<\/button>$/.exec(button.trim());
    if (!m) throw new Error('v3-prerender: unbekannter Reiter: ' + button.trim().slice(0, 80));
    const [, cls, key, rest, inner] = m, label = esc(text(inner));
    const only = ICON_ONLY.has(key);
    const caption = only ? '' : `<span class="compact-caption" aria-hidden="true">${esc(CAPTIONS[PAGES.indexOf(key)])}</span>`;
    return `<button class="${cls} compact-tool${only ? ' compact-icon-only' : ''}" data-tab="${key}"${rest} aria-label="${label}" title="${label}">${svgC(key)}<span class="compact-label">${inner}</span>${caption}</button>`;
  }
  const tabs = block => block.replace(/<button class="tab[^"]*" data-tab="[\s\S]*?<\/button>/g, tab);
  const nav = cut(/  <nav class="tabs main-pages" aria-label="Hauptseiten">([\s\S]*?)<\/nav>\n/, 'main-pages');
  const at = nav.index;
  const tools = cut(/  <div class="workspace-tools" aria-label="Werkzeuge">([\s\S]*?)<\/div>\n/, 'workspace-tools');
  if (tools.index !== at) throw new Error('v3-prerender: workspace-tools steht nicht direkt hinter main-pages');
  const filmeJs = await read('assets/filme.js');
  const FILM_ICON = stringConst(filmeJs, 'ICON', 'filme.js'), filmTitle = 'Anleitungsvideo: was Private Brain kann';
  const film = `<button class="ghost compact-tool pb-filme-knopf" type="button" id="pbFilme" title="${filmTitle}" aria-label="${filmTitle}">${svgC('x').replace(/d="[^"]*"/, `d="${FILM_ICON}"`)}</button>`;
  const look = `<button type="button" id="pbLookBtn" class="ghost iconbtn pb-look-btn compact-tool" aria-haspopup="menu" aria-expanded="false" title="Design wählen" aria-label="Design wählen">${svgC('x').replace(/d="[^"]*"/, `d="${PALETTE}"`)}</button>`;
  const more = 'Weitere Ansichten';
  const row = `  <!--v3-nav-home--><div class="native-toolbar-row"><nav class="tabs main-pages" aria-label="Hauptseiten">${tabs(nav[1])}</nav>`
    + `<details class="native-more" open><summary class="ghost compact-tool" aria-label="${more}" title="${more}">${svgC('more')}<span class="compact-label">${more}</span></summary>`
    + `<div class="workspace-tools" aria-label="Werkzeuge">${tabs(tools[1]).replace(/(data-tab="settings"[\s\S]*?<\/button>)/, '$1' + look + film)}</div></details></div>\n`
    // Breit gehört die Leiste in die Kopfzeile (wie v3-ui.js placeNav). Gleich hier, während die Seite entsteht.
    + `<script>(function(){var h=document.querySelector('header.top'),r=document.querySelector('.native-toolbar-row');if(h&&r&&matchMedia('(min-width: 1100px)').matches){(h.querySelector('.brand')||h.firstChild).after(r);h.classList.add('v3-one-row');}})();</script>\n`;
  html = html.slice(0, at) + row + html.slice(at);

  // ---------- Kopfzeile rechts: Lampe, ← →, ☰-Menü (native-toolbar.js, native-navigation.js) ----------
  const head = cut(/    <div class="tools">\n([\s\S]*?)\n    <\/div>\n  <\/header>/, 'header tools');
  let inner = head[1];
  const badge = /\s*<span class="badge-off"[\s\S]*?<\/span>\n\s*<\/span>/.exec(inner);
  if (!badge) throw new Error('v3-prerender: badge-off fehlt');
  inner = inner.replace(badge[0], '');
  const deco = (id, key) => {
    const re = new RegExp(`<button class="iconbtn" id="${id}"([^>]*)title="([^"]*)" aria-label="[^"]*">([^<]*)</button>`), m = re.exec(inner);
    if (!m) throw new Error('v3-prerender: Knopf fehlt: ' + id);
    inner = inner.replace(m[0], `<button class="iconbtn compact-tool" id="${id}"${m[1]}title="${m[2]}" aria-label="${m[2]}">${svgC(key)}<span class="compact-label">${m[3]}</span></button>`);
  };
  deco('themeToggle', 'moon'); deco('hardReload', 'refresh');
  const off = 'App vom Internet trennen', back = '← Zurück', fwd = 'Vorwärts →', menu = 'App-Menü';
  const headTools = `    <div class="tools">`
    + `<button class="native-net-lamp compact-tool" type="button" role="switch" aria-label="${off}" title="${off}" aria-checked="false" data-state="on"><span class="native-net-dot" aria-hidden="true"></span></button>`
    + `<nav class="native-navigation" aria-label="${back} / ${fwd}"><button class="ghost compact-tool" type="button" disabled aria-label="${back}" title="${back}">${svgC('back')}<span class="compact-label">${back}</span></button>`
    + `<button class="ghost compact-tool" type="button" disabled aria-label="${fwd}" title="${fwd}">${svgC('next')}<span class="compact-label">${fwd}</span></button></nav>`
    + `<details class="native-options"><summary class="ghost compact-tool" aria-label="${menu}" title="${menu}">${svgC('menu')}<span class="compact-label">${menu}</span></summary>`
    + `<div class="native-options-panel">${inner.trim()}<button class="ghost native-offline-switch" type="button" role="switch" aria-checked="false" title="${off}">${off}</button><p class="native-network-error" role="status" hidden></p></div></details>`
    + `</div>\n  </header>`;
  html = html.slice(0, head.index) + headTools + html.slice(head.index);

  // ---------- Versionsnummer neben dem Namen (native.js) ----------
  if (version) {
    const m = /^(\d+)\.(\d+)\.\d+-preview\.(\d+)$/.exec(version), shown = 'v' + (m ? m[1] + '.' + m[2] + '.' + m[3] : version);
    swap('<h1>Private Brain V3 Pro</h1>', `<h1>Private Brain V3 Pro <button type="button" class="pb-version" id="pbVersion" aria-label="Private Brain V3 Pro ${shown}" title="Private Brain V3 Pro ${shown}">${shown}</button></h1>`);
  }

  // ---------- Suchleiste (v3-ui.js) ----------
  const micTag = /<button id="mic" class="ghost"([^>]*)>🎤<\/button>/.exec(html);
  if (!micTag) throw new Error('v3-prerender: Mikrofon-Knopf fehlt');
  const chip = 'Sprech-Sprache: Deutsch (noch nicht gewählt)';
  swap(micTag[0], `<button id="mic" class="ghost v3-ic"${micTag[1]} data-v3-emoji="🎤">${svgV('mic')}</button><button type="button" id="v3SpeechChip" class="ghost v3-speech-chip v3-speech-unset" title="${chip}" aria-label="${chip}">DE</button>`);
  swap('<button class="on" data-m="mean" data-i18n="modeMean">Bedeutungssuche</button>\n      </div>',
    '<button class="on" data-m="mean" type="button" data-v3-toggle="1" aria-pressed="true" title="Bedeutungssuche an. Tippen schaltet aus (dann Suche nach Namen).">'
    + `<span class="v3-mean-label">Bedeutung</span>${svgV('search', ' v3-after')}</button>\n      </div>`
    + `\n      <button type="button" id="v3FilterToggle" class="ghost v3-filter-toggle" aria-expanded="false" aria-controls="filterbar" title="Filter">${svgV('filter')}<span>Filter</span></button>`);
  // Ohne Suche und Treffer ist der Hinweissatz still (v3-ui.js quietSearch); „Alle geprüft“ steht schon an seinem
  // Platz (native-check.js übernimmt den Knopf und schreibt nur, wenn sich der Text ändert).
  swap('<span id="searchInfo" data-i18n="searchInfo">', '<span id="searchInfo" class="v3-quiet" data-i18n="searchInfo">');
  swap('<span id="corpusInfo"></span>', '<span id="corpusInfo"></span><button class="ghost pb-check-all-button" type="button" data-text="🛡 Alle geprüft">🛡 Alle geprüft</button>');
  // Klaus 2026-10-26 (Sitzung 1, Punkt 1): E-Mails · Dateien · lokal · Katalog in einer Zeile mit dem Prüfstand.
  swap('    <div class="search-totals"><span id="searchMailCount"></span><span id="searchDocCount"></span><span id="searchLocalCount"></span></div>\n', '');
  swap('<span id="corpusInfo"></span>', '<span id="searchMailCount" class="pb-meta-count"></span><span id="searchDocCount" class="pb-meta-count"></span><span id="searchLocalCount" class="pb-meta-count"></span><span id="corpusInfo" class="pb-meta-count"></span>');
  // Führende Emojis in der Suche → Liniensymbol (wie decorateGeneric).
  const search = /<section class="panel on" id="panel-search">[\s\S]*?<\/section>/.exec(html);
  if (!search) throw new Error('v3-prerender: Suchseite fehlt');
  let changed = 0;
  const panel = search[0].replace(/(<(button|span)\b([^>]*)>)(\p{Extended_Pictographic})️?\s*/gu, (all, open, tag, attrs, emoji) => {
    if (!EMOJI[emoji] || /\bclass="/.test(attrs) && tag === 'span') return all;
    changed++;
    const withClass = /\bclass="/.test(attrs) ? open.replace(/class="/, 'class="v3-ic ') : open.replace(/>$/, ' class="v3-ic">');
    return withClass.replace(/>$/, ` data-v3-emoji="${emoji}">`) + `\u0000${EMOJI[emoji]}\u0000`;
  }).replace(/\u0000([a-zA-Z]+)\u0000([^<]*)/g, (all, key, rest) => rest + svgV(key));
  if (changed < 2) throw new Error('v3-prerender: zu wenige Symbole in der Suche ersetzt (' + changed + ')');
  html = html.replace(search[0], () => panel);
  // ---------- Fußzeile und family-projekt.de-Plakette stehen in den Einstellungen (native.js) ----------
  const foot = cut(/  <\/section>\n\n  (<footer>[\s\S]*?<\/footer>)\n/, 'footer hinter den Einstellungen');
  const badgeWrap = cut(/<div class="fp-badge-wrap">[\s\S]*?<div class="fp-copy">[\s\S]*?<\/div>\n<\/div>\n/, 'fp-badge-wrap');
  html = html.slice(0, foot.index) + `  ${foot[1]}\n${badgeWrap[0]}  </section>\n` + html.slice(foot.index);
  if (html.indexOf('id="panel-settings"') > html.indexOf('<footer>')) throw new Error('v3-prerender: Fußzeile steht nicht in den Einstellungen');
  return html;
}
