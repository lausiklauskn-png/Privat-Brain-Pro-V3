/* KI-Schlüssel der Browserfassung im Tresor (Klaus 2026-10-25, Rezept „verschluesselter-schluessel-tresor“, Sage).
   Vorher lag der Schlüssel mit „merken“ im Klartext in localStorage (cb_ai_key). Jetzt:
   - „Im Tresor merken“ legt ihn mit einem Passwort verschlüsselt ab: Modul 20 (SbkimSafe, byte-1:1),
     PBKDF2-SHA256 600 000 Runden → AES-256-GCM, in der eigenen Schublade (SBKIM_DB_SUFFIX „privatbrain“).
   - „Tresor entsperren“ holt ihn je Sitzung mit dem Passwort zurück. Das Passwort wird nirgends gespeichert.
   - Ohne Tresor bleibt ein Schlüssel nur bis zum Schließen im Arbeitsspeicher.
   - Ein alter Klartext-Schlüssel wird beim Merken übernommen und danach aus localStorage gelöscht.
   Name im Tresor wie beim KI-Richter im Mycel-Fenster: „ki_richter_key:<Anbieter>“.
   Nur die Browserfassung lädt diese Datei (tools/native/prepare-pages.mjs); die Apps bleiben unberührt. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const W = {
    de: { save: 'Im Tresor merken', unlock: 'Tresor entsperren', lock: 'Sperren', remove: 'Aus dem Tresor löschen',
      askNew: 'Tresor-Passwort (mindestens 8 Zeichen). Es verschlüsselt deinen KI-Schlüssel und wird nirgends gespeichert:',
      askAgain: 'Dasselbe Passwort noch einmal:', askHint: 'Merkhilfe fürs Passwort (freiwillig, NICHT das Passwort selbst):',
      askOpen: 'Tresor-Passwort, um deinen KI-Schlüssel zu holen:', hint: 'Merkhilfe: ',
      short: 'Das Passwort braucht mindestens 8 Zeichen. Nichts gespeichert.', differ: 'Die beiden Passwörter sind verschieden. Nichts gespeichert.',
      saved: 'Schlüssel verschlüsselt im Tresor. Beim nächsten Öffnen mit „Tresor entsperren“ holen.',
      opened: 'Schlüssel aus dem Tresor geholt. Er bleibt bis zum Schließen.', wrong: 'Falsches Passwort oder kein Schlüssel im Tresor.',
      locked: 'Gesperrt. Der Schlüssel ist aus dem Arbeitsspeicher entfernt.', removed: 'Aus dem Tresor gelöscht.',
      removeAsk: 'Den gemerkten Schlüssel für diesen Anbieter aus dem Tresor löschen?',
      session: 'Der Schlüssel gilt nur bis zum Schließen. „Im Tresor merken“ legt ihn verschlüsselt ab.',
      inVault: 'Ein Schlüssel liegt verschlüsselt im Tresor.', legacy: 'Dein Schlüssel liegt noch offen in diesem Browser. Tippe „Im Tresor merken“: danach liegt er nur noch verschlüsselt hier.',
      noProvider: 'Erst einen Anbieter wählen.', missing: 'Der Tresor ist in diesem Browser nicht verfügbar. Der Schlüssel gilt nur bis zum Schließen.',
      forgot: 'Passwort vergessen? Kein Drama: beim Anbieter einen neuen Schlüssel holen und neu merken.',
      error: 'Tresor-Fehler: ', reload: 'Der Speicher dieses Browsers war gerade beschäftigt. Bitte die Seite neu laden und noch einmal versuchen. Dein Schlüssel ist nicht verloren.', intro: 'Aus, solange leer. Der Schlüssel bleibt in diesem Browser: bis zum Schließen im Arbeitsspeicher oder, wenn du willst, mit einem Passwort verschlüsselt im Tresor. Er wird nie ins Repo geschrieben. Erst wenn gesetzt, dürfen einzelne Bilder/Texte zur EU-KI gehen, mit klarer Anzeige.' },
    en: { save: 'Keep in vault', unlock: 'Unlock vault', lock: 'Lock', remove: 'Delete from vault',
      askNew: 'Vault password (at least 8 characters). It encrypts your AI key and is never stored:',
      askAgain: 'The same password again:', askHint: 'Password hint (optional, NOT the password itself):',
      askOpen: 'Vault password to get your AI key:', hint: 'Hint: ',
      short: 'The password needs at least 8 characters. Nothing saved.', differ: 'The two passwords differ. Nothing saved.',
      saved: 'Key encrypted in the vault. Next time, get it with “Unlock vault”.',
      opened: 'Key taken from the vault. It stays until you close the page.', wrong: 'Wrong password or no key in the vault.',
      locked: 'Locked. The key has been removed from memory.', removed: 'Deleted from the vault.',
      removeAsk: 'Delete the kept key for this provider from the vault?',
      session: 'The key lasts only until you close the page. “Keep in vault” stores it encrypted.',
      inVault: 'A key is stored encrypted in the vault.', legacy: 'Your key is still stored unencrypted in this browser. Tap “Keep in vault”: afterwards it is only kept encrypted.',
      noProvider: 'Choose a provider first.', missing: 'The vault is not available in this browser. The key lasts only until you close the page.',
      forgot: 'Forgot the password? No problem: get a new key from the provider and keep it again.',
      error: 'Vault error: ', reload: 'This browser’s storage was busy. Please reload the page and try again. Your key is not lost.', intro: 'Off while empty. The key stays in this browser: in memory until you close the page or, if you like, encrypted with a password in the vault. It is never written to the repository. Only when set may single images/texts go to the EU AI, clearly shown.' }
  };
  const w = () => W[document.documentElement.lang] || W.de;   // RU/PL: Deutsch (wie das Mycel-Fenster)
  const safe = () => { const s = window.SbkimSafe; return s && typeof s.putSecret === 'function' && typeof s.getSecret === 'function' && typeof s.hasSecret === 'function' ? s : null; };
  const ask = text => { try { return typeof window.prompt === 'function' ? window.prompt(text) : null; } catch { return null; } };
  const LEGACY = 'cb_ai_key';
  let box = null, status = null, buttons = {}, inVault = false, note = '';

  const provider = () => $('aiProvider')?.value || '';
  const name = () => 'ki_richter_key:' + provider();
  const key = () => ($('aiKey')?.value || '').trim();
  const legacy = () => { try { return !!localStorage.getItem(LEGACY); } catch { return false; } };
  /** Schlüssel ins Feld setzen und über den vorhandenen Weg (saveAI) übernehmen. */
  function setKey(value) { const f = $('aiKey'); if (!f) return; f.value = value; f.dispatchEvent(new Event('change', { bubbles: true })); }
  function say(text) { note = text; render(); }

  function render() {
    if (!box) return;
    const t = w(), s = safe(), k = key(), p = provider();
    buttons.save.textContent = t.save; buttons.unlock.textContent = t.unlock; buttons.lock.textContent = t.lock; buttons.remove.textContent = t.remove;
    // Die Knopfzeile setzt display selbst; hidden allein würde dort überstimmt.
    const show = (b, on) => { b.hidden = !on; b.style.display = on ? '' : 'none'; };
    show(buttons.save, s && k && p);
    show(buttons.unlock, s && !k && p && inVault);
    show(buttons.lock, !!k);
    show(buttons.remove, s && p && inVault && !k);
    let line = note;
    if (!line) line = !s ? t.missing : legacy() ? t.legacy : k ? (inVault ? t.inVault + ' ' : '') + t.session : inVault ? t.inVault : '';
    status.textContent = line;
    const intro = box.parentElement?.querySelector(':scope > p');
    if (intro && intro.dataset.kiTresor) intro.textContent = t.intro;
  }
  // Nur nachsehen, nichts anlegen: SbkimSafe.hasSecret() legt die Schublade sbkim_safe an (Versionssprung der
  // Datenbank). Geschah das beim Start gleichzeitig mit den übrigen Modulen, blieb Modul 01 bis zum Neuladen
  // hängen (CI 2026-10-25: „Re-Open mit Version 9 … existing version (10)“). Angelegt wird erst beim Merken.
  async function stored() {
    const st = window.SbkimStorage;
    if (!st || typeof st.get !== 'function' || !provider()) return false;
    try { return !!(await st.get('sbkim_safe', 'secret:' + name())); } catch { return false; }   // Schublade fehlt: nichts gemerkt
  }
  async function refresh() {
    inVault = safe() ? await stored() : false;
    render();
  }
  const storageTrouble = e => /version|re-open|closing|StorageOpenError/i.test(String(e?.message || e) + ' ' + (e?.name || ''));
  // Der Anbieter ist kein Geheimnis und bleibt gemerkt; den Klartext-Schlüssel schreibt saveAI nicht mehr
  // (der Haken „merken“ ist aus und verborgen). Läuft nach saveAI, weil später angemeldet.
  function keepProvider() {
    const persist = $('aiPersist'); if (persist) persist.checked = false;
    try {
      localStorage.removeItem(LEGACY);   // nach jeder Änderung gilt: Schlüssel nur im Arbeitsspeicher oder im Tresor
      const p = provider();
      if (p) localStorage.setItem('cb_ai_provider', p); else localStorage.removeItem('cb_ai_provider');
    } catch {}
  }

  // Die Schublade sbkim_safe entsteht beim ersten Speichern über einen Versionssprung der Datenbank (Modul 01).
  // Liest ein anderer Teil der App genau in diesem Augenblick (beim Start tun das Mycel und Sporen), scheitert der
  // Sprung, und erst ein Neuladen hilft. Deshalb: warten, bis die Datenbank-Version eine Weile ruhig ist, dann die
  // Schublade allein anlegen; putSecret braucht danach keinen Sprung mehr.
  async function settled() {
    const st = window.SbkimStorage;
    if (!st || typeof st.init !== 'function' || typeof st.ensureStore !== 'function') return;
    let last = -1, calm = 0;
    for (let i = 0; i < 40 && calm < 3; i++) {
      const v = (await st.init()).version;
      calm = v === last ? calm + 1 : 0; last = v;
      if (calm < 3) await new Promise(r => setTimeout(r, 150));
    }
    await st.ensureStore('sbkim_safe');
  }
  async function save() {
    const s = safe(), t = w(), k = key();
    if (!s) return say(t.missing);
    if (!provider()) return say(t.noProvider);
    if (!k) return;
    const pw = ask(t.askNew); if (!pw) return;
    if (pw.length < 8) return say(t.short);
    const again = ask(t.askAgain); if (again === null) return;
    if (again !== pw) return say(t.differ);
    const hint = (ask(t.askHint) || '').trim().slice(0, 140);
    try {
      await settled();
      await s.putSecret(name(), k, pw, hint ? { hint } : undefined);
      try { localStorage.removeItem(LEGACY); } catch {}
      inVault = true; say(t.saved + ' ' + t.forgot);
    } catch (e) { try { console.warn('[ki-tresor] save:', e?.name, e?.message); } catch {} say(storageTrouble(e) ? t.reload : t.error + (e?.message || e)); }
  }
  async function unlock() {
    const s = safe(), t = w();
    if (!s) return say(t.missing);
    let hint = null; try { hint = await s.getSecretHint?.(name()); } catch {}
    const pw = ask((hint ? t.hint + hint + '\n\n' : '') + t.askOpen); if (!pw) return;
    let value = null;
    try { value = await s.getSecret(name(), pw); } catch (e) { return say(t.error + (e?.message || e)); }
    if (!value) {
      // getSecret() meldet jeden Fehler als null. Nur wenn der verschlüsselte Eintrag lesbar da ist, war es das Passwort.
      let readable = false; try { readable = !!(await window.SbkimStorage.get('sbkim_safe', 'secret:' + name())); } catch {}
      return say(readable ? t.wrong + ' ' + t.forgot : t.reload);
    }
    setKey(value); say(t.opened);
  }
  function lock() { setKey(''); say(w().locked); }
  async function remove() {
    const s = safe(), t = w(); if (!s) return;
    if (typeof window.confirm === 'function' && !window.confirm(t.removeAsk)) return;
    try { await s.removeSecret(name()); } catch (e) { return say(t.error + (e?.message || e)); }
    inVault = false; say(t.removed);
  }

  function mount() {
    const field = $('aiKey'), persist = $('aiPersist');
    if (!field || box) return;
    // Der Klartext-Haken entfällt: aus, verborgen (saveAI schreibt cb_ai_key dann nicht mehr).
    if (persist) { persist.checked = false; const row = persist.closest('.switch'); if (row) { row.hidden = true; row.style.display = 'none'; } }
    const label = field.closest('label');
    const intro = label?.parentElement?.querySelector(':scope > p');
    if (intro) intro.dataset.kiTresor = '1';
    box = document.createElement('div'); box.className = 'btnrow ki-tresor'; box.dataset.kiTresor = '1';
    for (const id of ['save', 'unlock', 'lock', 'remove']) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.dataset.kiTresor = id;
      b.hidden = true; b.style.display = 'none';   // erst zeigen, wenn der Stand bekannt ist (kein kurzes Aufblitzen)
      b.addEventListener('click', () => ({ save, unlock, lock, remove })[id]());
      buttons[id] = b; box.append(b);
    }
    status = document.createElement('p'); status.className = 'hint ki-tresor-status'; status.setAttribute('role', 'status');
    (label || field).after(box, status);
    render();
    field.addEventListener('input', () => { note = ''; render(); });
    field.addEventListener('change', () => { keepProvider(); render(); });
    $('aiProvider')?.addEventListener('change', () => { keepProvider(); note = ''; refresh(); });
    $('euOnly')?.addEventListener('change', keepProvider);
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    refresh();
  }
  // loadAI() (index.html) läuft im asynchronen Start; danach den Stand neu lesen (Anbieter, alter Klartext).
  const original = window.loadAI;
  if (typeof original === 'function') window.loadAI = function () { const r = original.apply(this, arguments); const p = $('aiPersist'); if (p) p.checked = false; mount(); refresh(); return r; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  addEventListener('load', () => { mount(); refresh(); });
  window.PBKiTresor = { refresh };
})();
