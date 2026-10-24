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
    folder: 'M3 7V4h6l2 3h10v13H3Z'
  };
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
  function decorate(root) {
    root.querySelectorAll?.('.mail-folders .mail-folder').forEach(decorateFolder);
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

  function start() {
    document.documentElement.classList.add('v3');
    decorate(document);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') { const b = m.target.parentElement; if (b?.matches('.mail-folders .mail-folder') && b.firstChild === m.target) stripEmoji(b); continue; }
        for (const n of m.addedNodes) {
          if (n.nodeType === 1) { if (n.matches?.('.mail-folders .mail-folder')) decorateFolder(n); else decorate(n); }
          else if (n.nodeType === 3 && n.parentElement?.matches('.mail-folders .mail-folder')) stripEmoji(n.parentElement);
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    placeNav(); wide.addEventListener('change', placeNav);
  }
  // Nach den Skripten am Ende von <body> (dort baut native-toolbar.js die Leiste).
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
