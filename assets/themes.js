/* Wählbare Themen (Klaus 2026-10-24). Lädt früh im <head>, damit beim Start nichts aufblitzt.
   Setzt data-look am <html>; ohne Wahl bleibt das bisherige Aussehen. Der Knopf oben (Malpalette)
   öffnet eine kleine Auswahl. Hell/Dunkel bleibt der eigene Schalter im ☰-Menü und gilt für jedes Thema. */
(() => {
  'use strict';
  const KEY = 'pb-look';
  const LOOKS = ['bisher', 'klar', 'petrol', 'schiefer', 'weich'];
  // Farbprobe je Thema: Fläche und Akzent (hell).
  const SWATCH = {
    bisher: ['#faf6f0', '#b08d57'], klar: ['#ffffff', '#2b62c4'], petrol: ['#f6f1ea', '#0e6b6b'],
    schiefer: ['#eceef1', '#c24e14'], weich: ['#fbe7ef', '#a63a6a']
  };
  const WORDS = {
    de: { title: 'Design wählen', head: 'Design', names: ['Bisher', 'Klar', 'Petrol warm', 'Schiefer kompakt', 'Weich und luftig'] },
    en: { title: 'Choose design', head: 'Design', names: ['Original', 'Clear', 'Warm petrol', 'Compact slate', 'Soft and airy'] },
    ru: { title: 'Выбрать оформление', head: 'Оформление', names: ['Прежнее', 'Ясное', 'Тёплый петроль', 'Компактный сланец', 'Мягкое и лёгкое'] },
    pl: { title: 'Wybierz wygląd', head: 'Wygląd', names: ['Dotychczasowy', 'Jasny', 'Ciepły petrol', 'Kompaktowy łupek', 'Miękki i lekki'] }
  };
  const words = () => WORDS[document.documentElement.lang] || WORDS.de;
  const root = document.documentElement;

  const read = () => { try { const v = localStorage.getItem(KEY); return LOOKS.includes(v) ? v : 'bisher'; } catch { return 'bisher'; } };
  const apply = look => { if (look === 'bisher') root.removeAttribute('data-look'); else root.setAttribute('data-look', look); };
  function set(look) {
    if (!LOOKS.includes(look)) return false;
    apply(look);
    try { if (look === 'bisher') localStorage.removeItem(KEY); else localStorage.setItem(KEY, look); } catch {}
    dispatchEvent(new CustomEvent('pb:look', { detail: { look } }));
    return true;
  }
  apply(read());
  const get = () => root.getAttribute('data-look') || 'bisher';
  window.PBLook = { get, set, list: () => LOOKS.slice() };

  const NS = 'http://www.w3.org/2000/svg';
  function svg(cls, d) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', cls); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); return s;
  }
  const PALETTE = 'M12 3a9 9 0 1 0 0 18c1.2 0 1.7-.9 1.3-1.8-.4-.9.2-2 1.3-2H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3Z M7.5 11.5h.01 M10 7.5h.01 M14.5 7.5h.01 M17 11h.01';
  const CHECK = 'm5 12 5 5 9-10';

  function build() {
    if (document.getElementById('pbLookBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'pbLookBtn'; btn.className = 'ghost iconbtn pb-look-btn compact-tool';
    btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false');
    const icon = svg('compact-icon', PALETTE); btn.append(icon);
    const menu = document.createElement('div');
    menu.id = 'pbLookMenu'; menu.className = 'pb-look-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
    document.body.append(menu);

    // Hinter dem Zahnrad in der Navigationszeile; rechts oben ist der Platz des Siegels (native-seal-place.js).
    const gear = document.querySelector('.workspace-tools [data-tab="settings"], .main-pages [data-tab="settings"]');
    const tools = document.querySelector('header .tools');
    if (gear) gear.after(btn); else if (tools) tools.prepend(btn); else return;

    function label() { const t = words().title; btn.title = t; btn.setAttribute('aria-label', t); }
    function render() {
      const w = words(); menu.replaceChildren();
      const h = document.createElement('h3'); h.textContent = w.head; menu.append(h);
      LOOKS.forEach((look, i) => {
        const item = document.createElement('button');
        item.type = 'button'; item.className = 'pb-look-item'; item.dataset.look = look;
        item.setAttribute('role', 'menuitemradio'); item.setAttribute('aria-checked', String(get() === look));
        const sw = document.createElement('span'); sw.className = 'pb-look-swatch';
        sw.style.background = `linear-gradient(135deg,${SWATCH[look][0]} 0 50%,${SWATCH[look][1]} 50% 100%)`;
        const name = document.createElement('span'); name.textContent = w.names[i];
        item.append(sw, name, svg('pb-look-check', CHECK));
        item.addEventListener('click', () => { set(look); close(); btn.focus(); });
        menu.append(item);
      });
    }
    function place() {
      const r = btn.getBoundingClientRect(), m = menu.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(innerWidth - m.width - 8, r.right - m.width)) + 'px';
      menu.style.top = Math.min(innerHeight - m.height - 8, r.bottom + 6) + 'px';
    }
    function open() { render(); menu.hidden = false; place(); btn.setAttribute('aria-expanded', 'true'); menu.querySelector('[aria-checked="true"]')?.focus(); }
    function close() { if (menu.hidden) return; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', e => { e.stopPropagation(); if (menu.hidden) open(); else close(); });
    document.addEventListener('click', e => { if (!menu.contains(e.target) && e.target !== btn) close(); });
    document.addEventListener('keydown', e => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { close(); btn.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...menu.querySelectorAll('.pb-look-item')], i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus(); e.preventDefault();
      }
    });
    addEventListener('resize', close);
    new MutationObserver(() => { label(); if (!menu.hidden) render(); }).observe(root, { attributes: true, attributeFilter: ['lang'] });
    label();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
