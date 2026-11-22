// Generalprüfung 16.11.2026, Einstellungen nach Themen und Tresor: (6) Themen-Knöpfe in der gewählten Sprache, „Zurück“ führt
// zuerst zu „Alle Themen“, die Tab-Taste geht vom Kopf in den Inhalt, der Sprung von „Hinzufügen“ öffnet „Tresor & Ablage“;
// (7) gesperrt ist „Entsperren“ der Hauptknopf; (8) Texte „oben/unten“ und der Verweis auf die Farbpalette.
// Gebautes www/, gestellte Brücke, Themen wie am Gerät eingeschaltet (pb_einstellungen_themen=an).
import { readFile } from 'node:fs/promises';
import { start, ok, total } from './_gp-harness.mjs';
const h = await start();
try {
  // Warten mit Frist: läuft etwas nicht ein, zählt der folgende Prüfpunkt rot (statt dass die Probe abbricht).
  const tipp = knopf => knopf.click({ timeout: 4000 }).catch(() => {});
  const warte = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 4000 }).catch(() => {});
  const names = page => page.evaluate(() => [...document.querySelectorAll('#pbThemen .pb-thema-knopf')].map(b => b.textContent.trim()));
  const settings = async page => { await tipp(page.locator('[data-tab="settings"]:visible').first())   /* V3: Zahnrad ohne Pros Schnellleiste */; await warte(page, () => document.getElementById('panel-settings').classList.contains('on') && document.querySelectorAll('#pbThemen .pb-thema-knopf').length > 5); };
  // V3 Schritt 2: ohne „Sprache & Diktat“ (kommt in V3 mit Schritt 4); geprüft wird an „Werkzeuge“.
  const soll = {
    de: ['Tresor & Ablage', 'Werkzeuge', 'E-Mail-Anhänge', 'Aussehen & App', '‹ Alle Themen'],
    en: ['Vault & storage', 'Tools', 'Email attachments', 'Appearance & app', '‹ All topics'],
    ru: ['Сейф и хранение', 'Инструменты', 'Вложения писем', 'Внешний вид и приложение', '‹ Все темы'],
    pl: ['Sejf i miejsce zapisu', 'Narzędzia', 'Załączniki e-mail', 'Wygląd i aplikacja', '‹ Wszystkie tematy']
  };
  // 6a · Sprache, frisch geladen
  const zahl = {};
  for (const lang of ['de', 'en', 'ru', 'pl']) {
    const page = await h.open({ width: 1280, height: 900, lang, themen: true });
    await settings(page);
    const n = await names(page); zahl[lang] = n.length;
    ok(`${lang}: die Themen-Knöpfe stehen in der gewählten Sprache (${n.slice(0, 3).join(', ')} …)`, soll[lang].slice(0, 4).every(x => n.includes(x)));
    await tipp(page.locator('#pbThemen [data-thema="werkzeuge"]'));
    ok(`${lang}: Rückweg und Titel des Themas sind übersetzt`, await page.evaluate(([back, title]) => document.querySelector('#pbThemaKopf button').textContent === back && document.querySelector('.pb-thema-titel').textContent === title, [soll[lang][4], soll[lang][1]]));
    await page.context().close();
  }
  ok(`In jeder Sprache gibt es gleich viele Themen (${JSON.stringify(zahl)}) – „E-Mail-Anhänge“ hat überall sein eigenes`, new Set(Object.values(zahl)).size === 1);
  // 6a · Sprachwechsel im laufenden Betrieb
  let page = await h.open({ width: 1280, height: 900, themen: true });
  await settings(page);
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await warte(page, () => document.querySelector('#pbThemen [data-thema="tresor"]')?.textContent.trim() === 'Vault & storage');
  ok('Nach dem Umschalten der Sprache werden die Knöpfe neu beschriftet', (await names(page)).includes('Meaning search'));
  await page.evaluate(() => { document.documentElement.lang = 'de'; });
  await warte(page, () => document.querySelector('#pbThemen [data-thema="tresor"]')?.textContent.trim() === 'Tresor & Ablage');

  // 6b · „Zurück“ führt zuerst zu „Alle Themen“
  await tipp(page.locator('#pbThemen [data-thema="bedeutung"]'));
  ok('Thema „Bedeutungssuche“ ist offen, der Zurück-Pfeil ist bedienbar', await page.evaluate(() => window.PBEinstellungen.thema === 'bedeutung' && !document.querySelector('.native-navigation button').disabled));
  await tipp(page.locator('.native-navigation button').first()); await page.waitForTimeout(200);
  ok('Zurück im geöffneten Thema: man steht bei „Alle Themen“, weiter in den Einstellungen', await page.evaluate(() => window.PBEinstellungen.thema === null && document.getElementById('panel-settings').classList.contains('on') && !document.getElementById('pbThemen').hidden));
  ok('Der Fokus steht danach auf dem Knopf des Themas, aus dem man kam', await page.evaluate(() => document.activeElement?.dataset.thema === 'bedeutung'));
  await tipp(page.locator('.native-navigation button').first());
  await warte(page, () => !document.getElementById('panel-settings').classList.contains('on'));
  ok('Der nächste Zurück-Tipp verlässt die Einstellungen (zur Suche)', await page.evaluate(() => document.getElementById('panel-search').classList.contains('on')));
  await settings(page);
  await tipp(page.locator('#pbThemen [data-thema="werkzeuge"]'));
  await tipp(page.locator('#pbThemaKopf button'));
  ok('„‹ Alle Themen“ bleibt und führt ebenfalls zurück', await page.evaluate(() => window.PBEinstellungen.thema === null && document.activeElement?.dataset.thema === 'werkzeuge'));

  // 6c · Tab-Reihenfolge
  await page.focus('#pbThemen [data-thema="werkzeuge"]', { timeout: 4000 }).catch(() => {}); await page.keyboard.press('Enter');
  await warte(page, () => document.activeElement?.classList.contains('pb-thema-titel'));   // V3: der Fokus kommt einen Augenblick später
  ok('Mit Enter geöffnet: der Fokus steht auf der Überschrift des Themas', await page.evaluate(() => document.activeElement?.classList.contains('pb-thema-titel') && document.activeElement.textContent === 'Werkzeuge'));
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => { const a = document.activeElement, box = a?.closest('#panel-settings > *'); return { tag: a?.tagName, id: a?.id, thema: box?.dataset.pbThema || '', inPanel: !!a?.closest('#panel-settings'), visible: !!a && a.getClientRects().length > 0 }; });
  ok(`Die nächste Tab-Taste landet im Inhalt des Themas (${first.tag}${first.id ? '#' + first.id : ''})`, first.inPanel && first.thema === 'werkzeuge' && first.visible);
  await page.keyboard.press('Shift+Tab');
  ok('Rückwärts kommt man auf „‹ Alle Themen“', await page.evaluate(() => document.activeElement === document.querySelector('#pbThemaKopf button')));

  // 8 · Aussehen & App nennt die Farbpalette; Texte ohne „oben/unten“
  await tipp(page.locator('#pbThemaKopf button'));
  await tipp(page.locator('#pbThemen [data-thema="app"]'));
  // V3: die Farben wählt V3s eigener Themen-Knopf (assets/themes.js), Pros Palette-Knopf und „Zustand“ gibt es hier nicht;
  // dann setzt einstellungen-themen.js keine Verweis-Zeile (geprüft: keine leere Zeile bleibt stehen).
  ok('Ohne Pros Palette-Knopf steht keine Verweis-Zeile auf die Farben', await page.evaluate(() => !document.getElementById('pbThemaFarben')));
  const html = await readFile('www/index.html', 'utf8');
  ok('Die Texte verweisen auf das Thema „KI-Schlüssel (EU)“ statt auf „oben“/„unten“', !html.includes('Mistral-Schlüssel (oben)') && !html.includes('wenn du unten bewusst') && html.split('Thema „KI-Schlüssel (EU)“').length === 3);
  await page.context().close();

  // 6d (Sprung von „Hinzufügen“ in „Tresor & Ablage“) und 7 (gesperrter Tresor) prüfen Pros Tresor-Teile;
  // sie kommen in V3 mit Schritt 3 „Tresor und Ablage“ dazu.
  ok('Keine Skriptfehler: ' + h.errors.join(' | '), h.errors.length === 0);
  console.log(`Generalprüfung Einstellungen/Tresor: ${total()} bestanden`);
} finally { await h.stop(); }
