/* „Chefcode“ in Private Brain V3 (Pro-Umbau 14, Klaus 2026-10-31: „ziehe die Funktion bei Private Brain V3 nach, PWA und native App“).
   Der Kasten ist der gemeinsame Baustein native/pro-chefcode.js (Quelle Private Brain Pro, byte-gleich, Pin native/pro-bausteine-herkunft.json);
   diese Datei setzt ihn nur in die Einstellungen, direkt hinter den Mycel-Kasten (#mycelPlace). Das Netz selbst ist Modul 23
   (window.SbkimRendezvous). Gilt gleich für die App (Android/Windows) und die Webfassung (Pages). */
(() => {
  'use strict';
  if (window.PBChefcode) return;
  function einsetzen() {
    if (!window.ProChefcode || !window.ProBedienung) return false;
    const settings = document.getElementById('panel-settings');
    if (!settings) return false;
    if (document.getElementById('pbChefcode')) return true;
    const k = window.ProChefcode.kasten({ rdv: () => window.SbkimRendezvous || null });
    k.element.id = 'pbChefcode';
    const mycel = document.getElementById('mycelPlace'), install = document.getElementById('install-box');
    if (mycel) mycel.after(k.element); else if (install) install.before(k.element); else settings.append(k.element);
    window.PBChefcode = { element: k.element, zeichnen: k.zeichnen };
    return true;
  }
  // Der Mycel-Kasten entsteht erst nach dem Laden (native-mycel.js); bis dahin kurz warten, dann ohne ihn einsetzen.
  let versuche = 0;
  const weiter = () => { if (document.getElementById('mycelPlace') || versuche++ > 20) { einsetzen(); return; } setTimeout(weiter, 150); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', weiter, { once: true }); else weiter();
})();
