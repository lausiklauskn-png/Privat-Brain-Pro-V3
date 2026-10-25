// KI-Schlüssel der Browserfassung im Tresor (Klaus 2026-10-25). Echter Browser, echte Krypto (Modul 20), gestellte
// Passwort-Abfrage. Gegenprobe: der Klartext-Schlüssel steht nie in localStorage, sessionStorage oder IndexedDB.
// Baut die Pages-Fassung in eine Wegwerf-Kopie von www.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,cp,rm,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const dir=await mkdtemp(join(tmpdir(),'pb-tresor-'));
await cp('www',dir,{recursive:true});
execFileSync('node',['tools/native/prepare-pages.mjs',dir],{stdio:'ignore'});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
  const path=resolve(dir,'.'+new URL(req.url,'http://x').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(dir+sep))return res.writeHead(403).end();
  try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const KEY='sk-ALT-geheim-1234567890',NEW='sk-NEU-nur-sitzung-0987';
let browser,count=0;const ok=(n,v)=>{assert.ok(v,n);console.log('✓ '+n);count++;};
// Sucht einen Text in allem, was der Browser dauerhaft hält.
const leak=(page,needle)=>page.evaluate(async needle=>{
  const hits=[];
  for(const store of [localStorage,sessionStorage])for(let i=0;i<store.length;i++){const k=store.key(i);if(String(store.getItem(k)).includes(needle))hits.push('storage:'+k);}
  const dec=new TextDecoder();
  const flat=v=>{try{if(v instanceof ArrayBuffer)return dec.decode(v);if(ArrayBuffer.isView(v))return dec.decode(v.buffer);return JSON.stringify(v,(k,x)=>x instanceof ArrayBuffer||ArrayBuffer.isView(x)?dec.decode(x.buffer||x):x);}catch{return String(v);}};
  for(const info of await indexedDB.databases()){
    const db=await new Promise((ok,no)=>{const r=indexedDB.open(info.name);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
    for(const name of db.objectStoreNames){
      const all=await new Promise(ok=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>ok([]);});
      if(all.some(v=>flat(v).includes(needle)))hits.push('idb:'+info.name+'/'+name);
    }
    db.close();
  }
  return hits;
},needle);
const answers=(page,list)=>page.evaluate(list=>{window.__asked=[];window.__answers=list.slice();window.prompt=t=>{window.__asked.push(t);return window.__answers.length?window.__answers.shift():null;};window.confirm=()=>true;},list);
const status=page=>page.locator('.ki-tresor-status').textContent();
// Wartet auf einen Satz in der Statuszeile; bei Zeitablauf steht der tatsächliche Satz im Fehler.
const waitStatus=async(page,re)=>{try{await page.waitForFunction(src=>new RegExp(src).test(document.querySelector('.ki-tresor-status').textContent),re.source,{timeout:90000});}
  catch(e){throw new Error('Status '+re+' kam nicht; steht da: '+JSON.stringify(await status(page))+' · gefragt: '+JSON.stringify(await page.evaluate(()=>window.__asked))+' · Konsole: '+JSON.stringify((globalThis.__logs||[]).slice(-15)));}};
const ready=async page=>{
  await page.waitForFunction(()=>typeof db!=='undefined'&&db&&document.querySelector('.ki-tresor-status')&&window.SbkimSafe&&window.PBWorkspace?.navigate);
  await page.evaluate(()=>window.PBWorkspace.navigate('settings'));
  await page.waitForFunction(()=>document.getElementById('aiKey').checkVisibility());
};
const shown=(page,id)=>page.locator(`[data-ki-tresor=${id}]`).isVisible();
try{
  const pagesHtml=await readFile(join(dir,'index.html'),'utf8'),nativeHtml=await readFile('www/index.html','utf8');
  ok('Only the browser version loads the vault glue; the app bundle does not',pagesHtml.includes('src="assets/ki-tresor.js"')&&!nativeHtml.includes('ki-tresor.js'));
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  const page=await ctx.newPage();const errors=[];
  if(process.env.PB_SLOW){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.PB_SLOW)});}page.on('pageerror',e=>errors.push(e.message));globalThis.__logs=[];page.on('console',m=>globalThis.__logs.push(m.type()+': '+m.text()));
  await page.goto(url);await ready(page);
  // Altbestand: ein Klartext-Schlüssel aus der früheren Fassung.
  await page.evaluate(k=>{localStorage.setItem('cb_ai_provider','mistral');localStorage.setItem('cb_ai_key',k);},KEY);
  await page.reload();await ready(page);
  const state=()=>page.evaluate(()=>({key:document.getElementById('aiKey').value,tick:document.getElementById('aiPersist').checkVisibility(),
    save:document.querySelector('[data-ki-tresor=save]').checkVisibility(),status:document.querySelector('.ki-tresor-status').textContent}));
  await page.waitForFunction(k=>document.getElementById('aiKey').value===k&&document.querySelector('[data-ki-tresor=save]').checkVisibility()&&/offen/.test(document.querySelector('.ki-tresor-status').textContent),KEY,{timeout:15000}).catch(async()=>console.log(await state()));
  ok('Old plain key is picked up once, the "remember" tick is gone, the page asks to keep it in the vault',
    await page.locator('#aiKey').inputValue()===KEY&&!(await page.locator('#aiPersist').isVisible())&&await shown(page,'save')&&/offen/.test(await status(page)));
  // Zu kurzes Passwort: nichts geschieht.
  await answers(page,['kurz']);await page.click('[data-ki-tresor=save]');
  ok('Password under 8 characters: nothing saved, plain key still waiting',/mindestens 8/.test(await status(page))&&!(await shown(page,'unlock'))&&await page.evaluate(()=>!!localStorage.getItem('cb_ai_key')));
  await answers(page,['geheim-passwort','anderes-passwort']);await page.click('[data-ki-tresor=save]');
  ok('Two different passwords: nothing saved',/verschieden/.test(await status(page)));
  await answers(page,['geheim-passwort','geheim-passwort','Name der Katze']);await page.click('[data-ki-tresor=save]');
  await waitStatus(page,/verschlüsselt im Tresor/);
  ok('Kept in the vault: plain copy deleted, provider still remembered',await page.evaluate(()=>localStorage.getItem('cb_ai_key')===null&&localStorage.getItem('cb_ai_provider')==='mistral'));
  ok('Counter-check: the key is nowhere in plain text (localStorage, sessionStorage, every IndexedDB store)',(await leak(page,KEY)).length===0);
  ok('The vault holds an encrypted record (PBKDF2 600000, AES-GCM) under the KI-Richter name',await page.evaluate(async()=>{const r=await SbkimStorage.get('sbkim_safe','secret:ki_richter_key:mistral');return !!r&&r.iterations===600000&&/AES-GCM/.test(r.cipher)&&!!r.ct;}));
  // Neu laden: Schlüssel weg, Tresor da.
  await page.reload();await ready(page);
  await page.waitForFunction(()=>document.querySelector('[data-ki-tresor=unlock]').style.display!=='none');
  ok('After reload: no key in the field or in memory, "Unlock vault" offered, provider kept',
    await page.locator('#aiKey').inputValue()===''&&await page.evaluate(()=>AI.key==='')&&await page.locator('#aiProvider').inputValue()==='mistral'&&!(await shown(page,'save')));
  await answers(page,['falsches-passwort']);await page.click('[data-ki-tresor=unlock]');
  await waitStatus(page,/Falsches Passwort/);
  ok('Wrong password: no key, a friendly message, the page keeps running',await page.locator('#aiKey').inputValue()===''&&await page.evaluate(()=>AI.key===''));
  await answers(page,['geheim-passwort']);await page.click('[data-ki-tresor=unlock]');
  await page.waitForFunction(k=>document.getElementById('aiKey').value===k,KEY);
  ok('Right password: key back in the field and in use (AI.key), the hint was shown in the question',
    await page.evaluate(k=>AI.key===k,KEY)&&await page.evaluate(()=>window.__asked.some(t=>t.includes('Name der Katze'))));
  ok('Unlocked: still no plain copy anywhere',(await leak(page,KEY)).length===0);
  await page.click('[data-ki-tresor=lock]');
  ok('Lock: key removed from the field and from memory',await page.locator('#aiKey').inputValue()===''&&await page.evaluate(()=>AI.key==='')&&await shown(page,'unlock'));
  // Ohne Tresor: nur bis zum Schließen.
  await page.fill('#aiKey',NEW);await page.locator('#aiKey').dispatchEvent('change');
  ok('A new key without the vault is used for this session only and never written to storage',await page.evaluate(k=>AI.key===k,NEW)&&(await leak(page,NEW)).length===0&&/nur bis zum Schließen/.test(await status(page)));
  await page.reload();await ready(page);
  ok('After reload the session key is gone',await page.evaluate(()=>document.getElementById('aiKey').value===''&&AI.key===''));
  // Anderer Anbieter: eigener Eintrag.
  await page.selectOption('#aiProvider','google');
  await page.waitForFunction(()=>document.querySelector('[data-ki-tresor=unlock]').style.display==='none');
  ok('Another provider has its own vault entry (none yet)',!(await shown(page,'unlock')));
  await page.selectOption('#aiProvider','mistral');await page.waitForFunction(()=>document.querySelector('[data-ki-tresor=unlock]').style.display!=='none');
  await answers(page,[]);await page.click('[data-ki-tresor=remove]');
  await waitStatus(page,/gelöscht/);
  ok('Delete from vault removes the record',await page.evaluate(async()=>!(await SbkimSafe.hasSecret('ki_richter_key:mistral'))));
  ok('No unhandled page errors',errors.length===0||console.log(errors));
  // Ohne Modul 20: keine Knöpfe, ehrlicher Satz, Schlüssel nur für die Sitzung.
  const bare=await browser.newContext();
  await bare.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(url))return r.abort();if(u.includes('20_schluessel_safe.js'))return r.fulfill({status:200,contentType:'text/javascript',body:''});return r.continue();});
  const p2=await bare.newPage();await p2.goto(url);await p2.waitForFunction(()=>typeof db!=='undefined'&&db&&document.querySelector('.ki-tresor-status'));
  await p2.evaluate(()=>{const s=document.getElementById('aiProvider');s.value='mistral';s.dispatchEvent(new Event('change'));const k=document.getElementById('aiKey');k.value='sk-ohne-tresor-1111';k.dispatchEvent(new Event('change'));});
  ok('Without module 20: no vault buttons, honest sentence, nothing in storage',
    !(await p2.locator('[data-ki-tresor=save]').isVisible())&&/nicht verfügbar/.test(await p2.locator('.ki-tresor-status').textContent())&&(await leak(p2,'sk-ohne-tresor-1111')).length===0);
  await bare.close();
  console.log(`${count} vault checks passed.`);
}finally{await browser?.close();server.close();await rm(dir,{recursive:true,force:true});}
