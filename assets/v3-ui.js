/* V3-Oberfläche (Claude, 2026-10-24). Eigene Schicht über der unveränderten Pro-Logik:
   - kurze Kontonamen (Klaus: „T-Online“ statt name@t-online.de), volle Adresse als Hinweistext
   - Strichsymbole statt Emojis in der Ordnerliste (Emoji bleibt im Text, ist aber verborgen und stumm)
   - breit eine Kopfzeile: Navigation sitzt in der Kopfleiste (wie Codex' Vorschau), schmal darunter
   Lädt früh im <head>; die DOM-Arbeit beginnt nach dem Aufbau der Seite. */
(() => {
  'use strict';
  // ---------- Kurze Kontonamen ----------
  const PROVIDERS = [
    [/(^|\.)t-online\.de$/i, 'T-Online'], [/(^|\.)magenta\.de$/i, 'Magenta'],
    [/(^|\.)googlemail\.com$/i, 'Googlemail'], [/(^|\.)gmail\.com$/i, 'Gmail'],
    [/(^|\.)web\.de$/i, 'WEB.DE'], [/(^|\.)gmx\.(de|net|at|ch)$/i, 'GMX'], [/(^|\.)yahoo\./i, 'Yahoo'],
    [/(^|\.)(ionos|1und1|online)\.de$/i, 'IONOS'], [/(^|\.)(outlook|hotmail|live|msn)\./i, 'Outlook'],
    [/(^|\.)(icloud|me|mac)\.com$/i, 'iCloud'], [/(^|\.)posteo\.(de|net)$/i, 'Posteo'], [/(^|\.)mailbox\.org$/i, 'mailbox.org']
  ];
  function provider(email) {
    const at = String(email || '').lastIndexOf('@');
    if (at < 0) return String(email || '');
    const domain = email.slice(at + 1).toLowerCase();
    for (const [re, name] of PROVIDERS) if (re.test(domain)) return name;
    const first = domain.split('.')[0] || domain;
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  /** Kurzer Name für ein Konto; bei gleichem Kurznamen mehrerer Konten kommt der Teil vor dem @ dazu. */
  function accountName(email, all) {
    const name = provider(email), list = (all || []).filter(Boolean);
    const twins = list.filter(e => provider(e) === name);
    if (twins.length > 1) return name + ' · ' + String(email).slice(0, String(email).lastIndexOf('@'));
    return name;
  }
  /** Eine <option> mit kurzem Namen und voller Adresse als Hinweis. */
  function accountOption(email, value, all) {
    const option = new Option(accountName(email, all), value);
    option.title = email; option.dataset.email = email;
    return option;
  }
  /** Nur der Name eines Absenders („Praxis Dr. Weiß <post@…>“ → „Praxis Dr. Weiß“); ohne Namen die Adresse. */
  function senderName(from) {
    const text = String(from || '').trim(), m = text.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    return m ? (m[1].trim() || m[2].trim()) : text;
  }
  window.PBSenderName = senderName;
  window.PBAccountName = accountName;
  window.PBAccountOption = accountOption;

  // ---------- Strichsymbole ----------
  const ICONS = {
    all: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5 M16 3.5a4 4 0 0 1 0 7.5 M18 14.8c2.4.6 4 2.6 4 6.2',
    inbox: 'M3 13 6 5h12l3 8v6H3Z M3 13h5l1 3h6l1-3h5',
    draft: 'M14 5l5 5 M4 20l5-1L20 8l-4-4L5 15Z',
    outbox: 'M12 14V3m-4 4 4-4 4 4 M3 13h5l1 3h6l1-3h5v6H3Z',
    sent: 'M3 6h13v12H3Z m0 0 6.5 5L16 6 M18 12h4m-2-2 2 2-2 2',
    archive: 'M3 4h18v4H3Z m2 4v12h14V8 M10 12h4',
    spam: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z M12 8v5 M12 16.5h.01',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    exported: 'M14 3h7v7m0-7L10 14 M10 3H3v18h18v-7',
    folder: 'M3 7V4h6l2 3h10v13H3Z',
    save: 'M6 3h12v18l-6-4-6 4Z',
    shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z m-3.5 9 2.5 2.5 4.5-5',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3',
    intake: 'M12 3v12m-4-4 4 4 4-4 M4 14v7h16v-7',
    lock: 'M5 11h14v10H5Z M8 11V7a4 4 0 0 1 8 0v4',
    key: 'M15 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z M10 13l-7 7 M5 18l2 2 M7 16l2 2',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
    mail: 'M3 5h18v14H3Z m0 0 9 7 9-7',
    filter: 'M4 6h16M7 12h10M10 18h4',
    dash: 'M4 20V10m8 10V4m8 16v-7',
    images: 'M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.01',
    file: 'M6 3h8l4 4v14H6Z M14 3v4h4',
    clipK: 'M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7'
  };
  // Alte Emojis → Strichsymbol (nur diese; Pfeile wie ↕ ← → bleiben).
  const EMOJI = { '💾':'save','🛡':'shield','🔗':'link','🔎':'search','🔍':'search','📁':'folder','📂':'folder','🎤':'mic',
    '📥':'intake','🔐':'lock','🔒':'lock','🔑':'key','🌐':'globe','✉':'mail','📧':'mail','📊':'dash','🖼':'images','📄':'file','📎':'clipK' };
  const NS = 'http://www.w3.org/2000/svg';
  function svg(key) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'v3-icon'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', ICONS[key] || ICONS.folder); s.append(p); return s;
  }
  // Führendes Emoji (mit Variationszeichen) oder Zeichen wie ✓ ↗ vor dem Wort.
  const LEAD = /^\s*((?:\p{Extended_Pictographic}|[✓↗✏🗄])(?:️|‍\p{Extended_Pictographic})*)\s*/u;
  function folderKey(button) {
    if (button.dataset.mailAll) return 'all';
    const k = button.dataset.mailFolder || '';
    return ICONS[k] ? k : 'folder';
  }
  // Der Textknoten bleibt das erste Kind: die App schreibt beim Sprachwechsel dort hinein
  // (z. B. native-mail-index.js „Alle Konten“). Das Symbol hängt am Ende, CSS zieht es nach vorn.
  function stripEmoji(button) {
    const first = button.firstChild;
    if (!first || first.nodeType !== 3) return;
    const m = first.nodeValue.match(LEAD);
    if (m) { button.dataset.v3Emoji = m[1]; first.nodeValue = first.nodeValue.slice(m[0].length); }
  }
  function decorateFolder(button) {
    stripEmoji(button);
    if (!button.querySelector(':scope>svg.v3-icon')) button.append(svg(folderKey(button)));
  }
  const GENERIC = '#panel-search button, #panel-search label > span, #panel-explorer .explorer-toolbar button, #panel-explorer .explorer-toolbar label > span, #panel-intake button, #panel-intake h3, #panel-settings h3';
  function firstText(el) { for (const n of el.childNodes) { if (n.nodeType === 3) { if (n.nodeValue.trim()) return n; } else return null; } return null; }
  // Schutz gegen Endlosschleifen: schreibt fremder Code denselben Knopf immer wieder neu, hört V3 dort auf (200 in 2 s; eine echte Schleife macht Tausende, Fortschrittsanzeigen nur Dutzende).
  const seen = new WeakMap();
  function tooOften(el) {
    const now = Date.now(), s = seen.get(el) || { t: now, n: 0 };
    if (now - s.t > 2000) { s.t = now; s.n = 0; }
    s.n++; seen.set(el, s); return s.n > 200;
  }
  function decorateGeneric(el) {
    const t = firstText(el); if (!t) return;
    if (tooOften(el)) return;
    const m = t.nodeValue.match(/^\s*(\p{Extended_Pictographic})\uFE0F?\s*/u);
    if (!m || !EMOJI[m[1]]) return;
    t.nodeValue = t.nodeValue.slice(m[0].length);
    el.dataset.v3Emoji = m[1]; el.classList.add('v3-ic');
    if (!el.querySelector(':scope>svg.v3-icon')) el.append(svg(EMOJI[m[1]]));
  }
  function decorate(root) {
    root.querySelectorAll?.('.mail-folders .mail-folder').forEach(decorateFolder);
    root.querySelectorAll?.(GENERIC).forEach(decorateGeneric);
    if (root.matches?.(GENERIC)) decorateGeneric(root);
  }

  // ---------- Kopfzeile ----------
  const wide = matchMedia('(min-width: 1100px)');
  let home = null;
  function placeNav() {
    const header = document.querySelector('header.top'), row = document.querySelector('.native-toolbar-row');
    if (!header || !row) return;
    if (!home) { home = document.createComment('v3-nav-home'); row.before(home); }
    const brand = header.querySelector('.brand');
    let moved = false;
    if (wide.matches) { if (row.parentElement !== header) { (brand || header.firstChild).after(row); moved = true; } header.classList.add('v3-one-row'); }
    else { if (row.parentElement === header) { home.after(row); moved = true; } header.classList.remove('v3-one-row'); }
    // Das Siegel (Modul 17) misst die Kopfleiste bei „resize“. Fand das vor dem Umsetzen statt, stünde es an der alten Stelle.
    if (moved) requestAnimationFrame(() => dispatchEvent(new Event('resize')));
  }

  // Erklärsätze nur, wenn sie etwas über ein Ergebnis sagen (Klaus: keine Erklärung, was die App kann).
  function quietSearch() {
    const q = document.getElementById('q'), info = document.getElementById('searchInfo'), res = document.getElementById('results');
    if (!q || !info || !res) return;
    const sync = () => info.classList.toggle('v3-quiet', !q.value.trim() && !res.children.length);
    q.addEventListener('input', sync); new MutationObserver(sync).observe(res, { childList: true }); new MutationObserver(sync).observe(info, { childList: true, characterData: true, subtree: true });
    sync();
  }
  // Am Handy die fünf Auswahlfelder hinter einem Knopf „Filter“.
  const FILTER = { de: 'Filter', en: 'Filters', ru: 'Фильтры', pl: 'Filtry' };
  function filterToggle() {
    const box = document.querySelector('#panel-search .searchbox'), bar = document.getElementById('filterbar');
    if (!box || !bar || document.getElementById('v3FilterToggle')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'v3FilterToggle'; b.className = 'ghost v3-filter-toggle';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'filterbar');
    const label = document.createElement('span'); b.append(svg('filter'), label);
    const text = () => { const w = FILTER[document.documentElement.lang] || FILTER.de; label.textContent = w; b.title = w; };
    text(); new MutationObserver(text).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    b.addEventListener('click', () => { const open = !document.documentElement.classList.contains('v3-filters-open'); document.documentElement.classList.toggle('v3-filters-open', open); b.setAttribute('aria-expanded', String(open)); });
    box.append(b);
  }

  // „?“ im Kasten: Erklärtexte zeigen/verstecken.
  const HELP = { de: ['Erklärung zeigen', 'Erklärung ausblenden'], en: ['Show explanation', 'Hide explanation'],
    ru: ['Показать пояснение', 'Скрыть пояснение'], pl: ['Pokaż wyjaśnienie', 'Ukryj wyjaśnienie'] };
  function helpButton(container, place) {
    if (!container || container.querySelector(':scope .v3-help')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost v3-help'; b.textContent = '?';
    const label = () => { const w = HELP[document.documentElement.lang] || HELP.de, open = container.classList.contains('v3-help-open');
      b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', w[open ? 1 : 0]); b.title = w[open ? 1 : 0]; };
    b.addEventListener('click', () => { container.classList.toggle('v3-help-open'); label(); });
    new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    label(); place(b);
  }
  function helpButtons() {
    // Suche: kein „?“ mehr (Klaus 2026-10-24: „das erklärt sich selber“); ihre Erklärtexte bleiben verborgen.
    const lib = document.querySelector('#panel-intake .library-setup'); if (lib) helpButton(lib, b => lib.append(b));
    const drop = document.getElementById('drop'); if (drop) helpButton(drop, b => drop.append(b));
  }

  // ---------- Sprech-Sprache (Klaus 2026-10-24: „welche Sprache sprichst du“, unabhängig von der Gerätesprache) ----------
  const SPEECH = [['de-DE','DE','Deutsch'],['en-US','EN','English'],['ru-RU','RU','Русский'],['pl-PL','PL','Polski'],['uk-UA','UK','Українська'],
    ['tr-TR','TR','Türkçe'],['fr-FR','FR','Français'],['it-IT','IT','Italiano'],['es-ES','ES','Español']];
  const SPEECH_KEY = 'pb-speech-lang';
  const ASK = { de: 'Welche Sprache sprichst du?', en: 'Which language do you speak?', ru: 'На каком языке вы говорите?', pl: 'W jakim języku mówisz?' };
  const SPOKEN = { de: 'Sprech-Sprache', en: 'Spoken language', ru: 'Язык речи', pl: 'Język mowy' };
  const speechLang = () => { try { const v = localStorage.getItem(SPEECH_KEY); return SPEECH.some(x => x[0] === v) ? v : null; } catch { return null; } };
  window.PBSpeechLang = speechLang;
  function speechPicker(anchor, after) {
    document.getElementById('v3SpeechMenu')?.remove();
    const menu = document.createElement('div'); menu.id = 'v3SpeechMenu'; menu.className = 'pb-look-menu'; menu.setAttribute('role', 'menu');
    const h = document.createElement('h3'); h.textContent = ASK[document.documentElement.lang] || ASK.de; menu.append(h);
    const cur = speechLang();
    for (const [code, short, name] of SPEECH) {
      const item = document.createElement('button'); item.type = 'button'; item.className = 'pb-look-item'; item.dataset.speech = code;
      item.setAttribute('role', 'menuitemradio'); item.setAttribute('aria-checked', String(cur === code));
      const tag = document.createElement('span'); tag.className = 'v3-speech-code'; tag.textContent = short;
      const label = document.createElement('span'); label.textContent = name; item.append(tag, label);
      item.addEventListener('click', () => { try { localStorage.setItem(SPEECH_KEY, code); } catch {} menu.remove(); syncSpeech(); after?.(); });
      menu.append(item);
    }
    document.body.append(menu);
    const r = anchor.getBoundingClientRect(), m = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(innerWidth - m.width - 8, r.right - m.width)) + 'px';
    menu.style.top = Math.max(8, Math.min(innerHeight - m.height - 8, r.bottom + 6)) + 'px';
    setTimeout(() => document.addEventListener('click', function off(e) { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', off, true); } }, true));
    menu.querySelector('[aria-checked="true"]')?.focus() || menu.querySelector('.pb-look-item')?.focus();
  }
  // Klaus 2026-10-24: im Knopf immer die Sprache als Kürzel (DE, EN, RU …), nie „?“. Noch nicht gewählt: die Sprache
  // der App, blasser; der erste Tipp aufs Mikrofon fragt dann nach (die Gerätesprache ist oft eine andere).
  const APP_SPEECH = { de: 'de-DE', en: 'en-US', ru: 'ru-RU', pl: 'pl-PL' };
  function syncSpeech() {
    const chip = document.getElementById('v3SpeechChip'); if (!chip) return;
    const chosen = SPEECH.find(x => x[0] === speechLang());
    const shown = chosen || SPEECH.find(x => x[0] === APP_SPEECH[document.documentElement.lang]) || SPEECH[0];
    chip.textContent = shown[1];
    chip.classList.toggle('v3-speech-unset', !chosen);
    const spoken = SPOKEN[document.documentElement.lang] || SPOKEN.de;
    const w = spoken + ': ' + shown[2] + (chosen ? '' : ' (' + (UNSET[document.documentElement.lang] || UNSET.de) + ')');
    chip.title = w; chip.setAttribute('aria-label', w);
  }
  const UNSET = { de: 'noch nicht gewählt', en: 'not chosen yet', ru: 'ещё не выбран', pl: 'jeszcze nie wybrano' };
  function speechChip() {
    const mic = document.getElementById('mic'); if (!mic || document.getElementById('v3SpeechChip')) return;
    const chip = document.createElement('button'); chip.type = 'button'; chip.id = 'v3SpeechChip'; chip.className = 'ghost v3-speech-chip';
    chip.addEventListener('click', e => { e.stopPropagation(); speechPicker(chip); });
    mic.after(chip); syncSpeech();
    new MutationObserver(syncSpeech).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    // Erster Tipp aufs Mikrofon ohne gewählte Sprache: erst fragen, dann zuhören.
    // Am Fenster (nicht am Dokument), damit es vor dem Abfänger von native-speech.js läuft.
    window.addEventListener('click', e => {
      const target = e.target.closest?.('#mic, .pb-dictate');
      if (!target || speechLang()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      speechPicker(target, () => target.click());
    }, true);
  }

  // ---------- Bedeutung an/aus (Klaus 2026-10-24) ----------
  // „Namenssuche“ entfällt; ein Schalter „Bedeutung“ mit Lupe dahinter. An: wie bisher hervorgehoben. Aus: sichtbar aus,
  // dann sucht die App wie vorher über die Namen (MODE "name"). Fehlt in der App das Modell, führt der Knopf weiter zum
  // Laden (native-semantic.js) und schaltet nicht aus.
  const MEAN = { de: 'Bedeutung', en: 'Meaning', ru: 'По смыслу', pl: 'Znaczenie' };
  const MEAN_TIP = {
    de: ['Bedeutungssuche an. Tippen schaltet aus (dann Suche nach Namen).', 'Bedeutungssuche aus (Suche nach Namen). Tippen schaltet ein.'],
    en: ['Meaning search on. Tap to switch off (then search by name).', 'Meaning search off (search by name). Tap to switch on.'],
    ru: ['Поиск по смыслу включён. Нажмите, чтобы выключить (поиск по имени).', 'Поиск по смыслу выключен (поиск по имени). Нажмите, чтобы включить.'],
    pl: ['Wyszukiwanie po znaczeniu włączone. Dotknij, aby wyłączyć (szukanie po nazwie).', 'Wyszukiwanie po znaczeniu wyłączone (szukanie po nazwie). Dotknij, aby włączyć.'] };
  function meaningToggle() {
    const mean = document.querySelector('#mode [data-m="mean"]'), name = document.querySelector('#mode [data-m="name"]');
    if (!mean || !name || mean.dataset.v3Toggle) return;
    mean.dataset.v3Toggle = '1'; mean.removeAttribute('data-i18n'); mean.type = 'button';
    const label = document.createElement('span'); label.className = 'v3-mean-label';
    const icon = svg('search'); icon.classList.add('v3-after');
    mean.replaceChildren(label, icon);
    const lang = () => document.documentElement.lang;
    const sync = () => {
      const on = mean.classList.contains('on');
      label.textContent = MEAN[lang()] || MEAN.de;
      mean.setAttribute('aria-pressed', String(on));
      if (!mean.dataset.semanticMissing) mean.title = (MEAN_TIP[lang()] || MEAN_TIP.de)[on ? 0 : 1];
    };
    window.addEventListener('click', e => {
      if (!e.target.closest?.('#mode [data-m="mean"]')) return;
      if (!mean.classList.contains('on') || mean.dataset.semanticMissing) return;   // einschalten bzw. Modell laden: wie bisher
      e.stopImmediatePropagation(); e.preventDefault();
      name.click();                                                                    // ausschalten = Suche nach Namen
    }, true);
    new MutationObserver(sync).observe(mean, { attributes: true, attributeFilter: ['class', 'data-semantic-missing'] });
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    sync();
  }

  // ---------- Spaltenbreiten verstellen (Klaus 2026-10-24: „Maus dahin, Pfeil rechts links, Größe verändern“) ----------
  // Postfach (Ordner | Liste | Lesen) und Explorer (Baum | Dateien): Trennlinie mit der Maus oder dem Finger ziehen,
  // mit Pfeiltasten in 16-px-Schritten, Doppelklick stellt zurück. Die Breiten bleiben gespeichert (je Gerät).
  const SPLITS = [
    { sel: '#mailWorkspace .mail-layout', key: 'pb-cols-mail', cols: ['.mail-folders', '.mail-list'], vars: ['--v3-col-a', '--v3-col-b'], min: [110, 180], rest: 320, media: '(min-width: 901px)' },
    { sel: '#panel-explorer .explorer-layout', key: 'pb-cols-explorer', cols: ['#explorerTree'], vars: ['--v3-col-a'], min: [140], rest: 280, media: '(min-width: 651px)' }
  ];
  const SPLIT_TIP = { de: 'Breite ändern: ziehen oder Pfeiltasten · Doppelklick: zurücksetzen', en: 'Change width: drag or arrow keys · double-click: reset',
    ru: 'Изменить ширину: перетащите или стрелки · двойной щелчок: сброс', pl: 'Zmień szerokość: przeciągnij lub strzałki · dwuklik: reset' };
  function splitLayout(layout, set) {
    if (layout.dataset.v3Split) return; layout.dataset.v3Split = '1'; layout.classList.add('v3-split');
    const mq = matchMedia(set.media);
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(set.key) || '{}') || {}; } catch {}
    set.vars.forEach(v => { if (saved[v] > 0) layout.style.setProperty(v, saved[v] + 'px'); });
    const col = i => layout.querySelector(':scope>' + set.cols[i]);
    const handles = set.cols.map((_, i) => {
      const h = document.createElement('div'); h.className = 'v3-splitter'; h.tabIndex = 0;
      h.setAttribute('role', 'separator'); h.setAttribute('aria-orientation', 'vertical');
      layout.append(h); return h;
    });
    const place = () => handles.forEach((h, i) => {
      const c = col(i), on = mq.matches && c && c.offsetParent !== null && getComputedStyle(layout).display === 'grid';
      h.hidden = !on; if (!on) return;
      const gap = parseFloat(getComputedStyle(layout).columnGap) || 0;
      h.style.left = (c.offsetLeft + c.offsetWidth + gap / 2 - 5) + 'px';
      const tip = SPLIT_TIP[document.documentElement.lang] || SPLIT_TIP.de; h.title = tip; h.setAttribute('aria-label', tip);
      h.setAttribute('aria-valuenow', String(Math.round(c.offsetWidth)));
    });
    const save = () => { const o = {}; set.vars.forEach(v => { const n = parseFloat(layout.style.getPropertyValue(v)); if (n > 0) o[v] = Math.round(n); });
      try { localStorage.setItem(set.key, JSON.stringify(o)); } catch {} };
    const resize = (i, width) => {
      const others = set.cols.reduce((sum, _, j) => j === i ? sum : sum + (col(j)?.offsetWidth || 0), 0);
      const max = Math.max(set.min[i], layout.clientWidth - others - set.rest);
      layout.style.setProperty(set.vars[i], Math.round(Math.min(max, Math.max(set.min[i], width))) + 'px'); place();
    };
    handles.forEach((h, i) => {
      h.addEventListener('pointerdown', e => {
        const c = col(i); if (!c) return; e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('v3-dragging');
        document.documentElement.classList.add('v3-resizing');
        const x0 = e.clientX, w0 = c.getBoundingClientRect().width;
        const move = ev => resize(i, w0 + ev.clientX - x0);
        const up = () => { h.removeEventListener('pointermove', move); h.classList.remove('v3-dragging'); document.documentElement.classList.remove('v3-resizing'); save(); };
        h.addEventListener('pointermove', move); h.addEventListener('pointerup', up, { once: true }); h.addEventListener('pointercancel', up, { once: true });
      });
      h.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
        resize(i, (col(i)?.offsetWidth || 0) + (e.key === 'ArrowRight' ? 16 : -16)); save();
      });
      h.addEventListener('dblclick', () => { layout.style.removeProperty(set.vars[i]); place(); save(); });
    });
    new ResizeObserver(place).observe(layout);
    new MutationObserver(place).observe(layout, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    mq.addEventListener('change', place); place();
  }
  function columnSplitters(root = document) {
    for (const set of SPLITS) root.querySelectorAll?.(set.sel).forEach(l => splitLayout(l, set));
  }

  function start() {
    document.documentElement.classList.add('v3');
    decorate(document);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') { const b = m.target.parentElement; if (b?.matches('.mail-folders .mail-folder') && b.firstChild === m.target) stripEmoji(b); else if (b?.matches(GENERIC)) decorateGeneric(b); continue; }
        for (const n of m.addedNodes) {
          if (n.nodeType === 1) { if (n.matches?.('.mail-folders .mail-folder')) decorateFolder(n); else decorate(n); }
          else if (n.nodeType === 3 && n.parentElement?.matches('.mail-folders .mail-folder')) stripEmoji(n.parentElement);
          else if (n.nodeType === 3 && n.parentElement?.matches(GENERIC)) decorateGeneric(n.parentElement);
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    placeNav(); wide.addEventListener('change', placeNav);
    quietSearch(); filterToggle(); helpButtons(); speechChip(); meaningToggle(); columnSplitters();
    new MutationObserver(() => columnSplitters()).observe(document.body, { childList: true, subtree: true });
  }
  // Nach den Skripten am Ende von <body> (dort baut native-toolbar.js die Leiste).
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
