/* Klaus 2026-10-26 (Sitzung 1, Punkt 8): Doppelte – kurz wie im Postfach: ☐ Alle (umschalten) · Auswahl · Entfernen.
   Gleiche Bedienung wie Private Brain Pro (native-dupes.js). „Auswahl leeren“ entfällt: ein zweiter Tipp auf „Alle“ wählt alles ab. */
(() => {
  'use strict';
  const words = {
    de: { all: 'Alle', allTitle: 'Alle auswählen · nochmal tippen: alle abwählen', auto: 'Auswahl', autoTitle: 'Alle außer je einer auswählen', remove: 'Entfernen', removeTitle: 'Ausgewählte Verweise aus dem Katalog entfernen. Keine Datei wird gelöscht.', lastCopy: 'Von {n} Datei(en) bleibt danach kein Verweis im Katalog. Trotzdem entfernen?' },
    en: { all: 'All', allTitle: 'Select all · tap again: select none', auto: 'Auto', autoTitle: 'Select all except one each', remove: 'Remove', removeTitle: 'Remove the selected references from the catalogue. No file is deleted.', lastCopy: '{n} file(s) will have no reference left in the catalogue. Remove anyway?' },
    ru: { all: 'Все', allTitle: 'Выбрать все · ещё раз: снять выбор', auto: 'Выбор', autoTitle: 'Выбрать все, кроме одной копии', remove: 'Убрать', removeTitle: 'Убрать выбранные ссылки из каталога. Файлы не удаляются.', lastCopy: 'У {n} файл(ов) не останется ссылки в каталоге. Всё равно убрать?' },
    pl: { all: 'Wszystkie', allTitle: 'Zaznacz wszystkie · ponownie: odznacz', auto: 'Wybór', autoTitle: 'Zaznacz wszystkie oprócz jednej kopii', remove: 'Usuń', removeTitle: 'Usuń zaznaczone odwołania z katalogu. Żaden plik nie jest kasowany.', lastCopy: '{n} plik(ów) nie będzie miało odwołania w katalogu. Usunąć mimo to?' }
  };
  const NS = 'http://www.w3.org/2000/svg';
  function trashIcon() { const svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); path.setAttribute('d', 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'); svg.append(path); return svg; }
  const t = key => (words[document.documentElement.lang] || words.de)[key];
  function start() {
    const auto = document.getElementById('dupSelectExtra'), clear = document.getElementById('dupClearSel'), rm = document.getElementById('dupRemove');
    if (!auto || !rm || typeof window.renderDupes !== 'function') return;
    const row = auto.parentElement; row.classList.add('pb-dup-short');
    const label = document.createElement('label'), box = document.createElement('input'), text = document.createElement('span');
    label.className = 'pb-dup-all'; box.type = 'checkbox'; box.id = 'dupAll'; label.append(box, text); row.insertBefore(label, row.firstChild);
    if (clear) clear.hidden = true;
    const keys = () => { const out = []; try { for (const r of dupeGroups()) for (const l of locsOf(r)) out.push(dupKey(r.hash, l.path)); } catch {} return out; };
    function sync() { try { const k = keys(), n = k.filter(x => dupSel.has(x)).length; box.checked = !!k.length && n === k.length; box.indeterminate = n > 0 && n < k.length; box.disabled = !k.length; } catch {} }
    box.addEventListener('change', () => { try { dupSel.clear(); if (box.checked) for (const k of keys()) dupSel.add(k); renderDupes(); } catch {} });
    const base = window.renderDupes; window.renderDupes = function () { const out = base.apply(this, arguments); sync(); return out; };
    document.getElementById('dupeList')?.addEventListener('change', e => { if (e.target.matches?.('.dupChk')) queueMicrotask(sync); });
    // Rückfrage nur, wenn von einer Datei gar kein Verweis im Katalog bliebe.
    rm.addEventListener('click', e => { try { let gone = 0; for (const r of dupeGroups()) { const l = locsOf(r); if (l.length && l.every(x => dupSel.has(dupKey(r.hash, x.path)))) gone++; } if (gone && !confirm(t('lastCopy').replace('{n}', gone))) { e.stopImmediatePropagation(); e.preventDefault(); } } catch {} }, true);
    function labels() {
      text.textContent = t('all'); label.title = t('allTitle'); auto.textContent = t('auto'); auto.title = t('autoTitle');
      const icon = window.PBIcons?.create('trash') || trashIcon(); rm.replaceChildren(...(icon ? [icon] : []), document.createTextNode(t('remove'))); rm.title = t('removeTitle'); rm.setAttribute('aria-label', t('removeTitle'));
      sync();
    }
    labels(); new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
