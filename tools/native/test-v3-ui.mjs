// V3-Oberfläche (Klaus 2026-10-24): eine Kopfzeile, Strichsymbole statt Emojis, kurze Kontonamen, keine Wiederholzeile.
// Gestelltes Mailkonto mit erfundenen Daten; kein Netz. PB_CAPTURE_DESIGN=1 legt Bilder in docs/design/themen-2026-10-24/ ab.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const capture=process.env.PB_CAPTURE_DESIGN==='1',shots='docs/design/v3-2026-10-24';
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
// Erwarteter Akzent je Thema (hell / dunkel), aus native-themes.css.
const EXPECT={klar:['#2b62c4','#5b95f2'],petrol:['#0e6b6b','#3fb4a8'],schiefer:['#c24e14','#f07a36'],weich:['#a63a6a','#e47fab']};
const MAILS=[
  ['Stadtwerke Musterstadt','Ihre Rechnung Oktober',false],['Praxis Dr. Weiß','Termin bestätigt: Zahnarzt Dr. Weiß',true],
  ['Anna Beispiel','Fotos vom Wochenende',false],['Paketdienst','Ihr Paket ist unterwegs',true],
  ['Ferienhof Sonnenblick','Angebot Ferienwohnung Ostsee',true],['Grundschule am Park','Protokoll Elternabend',true],
  ['Hausrat Plus','Versicherungsschein 2027',true],['Familie Lehmann','Einladung Grillfest',false]
];
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await context.route('**/*',r=>{
    if(r.request().url().startsWith(url))return r.continue();
    if(r.request().url().startsWith('https://cdn.jsdelivr.net/'))return r.fulfill({status:404,body:''});
    return r.abort();
  });
  await context.addInitScript(mails=>{
    const account={id:'22222222-2222-4222-8222-222222222222',email:'post@example.invalid',provider:'telekom'};
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'1.0.0-preview.28-debug',nativeMail:true};}},
      ProMail:{
        async accounts(){return{items:[account]};},
        async addAccount(){return account;},
        async folders(){return{items:[{path:'INBOX',name:'INBOX',specialUse:'',total:128},{path:'Drafts',name:'Drafts',specialUse:''},{path:'Sent',name:'Sent',specialUse:''},{path:'Archiv',name:'Archiv',specialUse:''},{path:'Spam',name:'Spam',specialUse:'',total:2},{path:'Trash',name:'Trash',specialUse:'',total:6}]};},
        async messages(args){const now=Date.now();return{validity:'1',total:args.folder==='INBOX'?128:0,next:null,
          items:args.folder==='INBOX'?mails.map(([from,subject,seen],i)=>({uid:100-i,subject,from:from+' <post@example.invalid>',date:now-i*3*3600e3,flags:seen?['\\Seen']:[],size:2000})):[]};},
        async message(){return{subject:'Termin bestätigt: Zahnarzt Dr. Weiß',from:'Praxis Dr. Weiß <post@example.invalid>',to:account.email,messageId:'<termin@example.invalid>',
          text:'Guten Tag,\n\nwir bestätigen Ihren Termin am Dienstag, 4. November, um 9:30 Uhr. Bitte bringen Sie Ihre Versichertenkarte mit.\n\nFreundliche Grüße\nIhre Praxis Dr. Weiß',attachments:[]};},
        async action(){return{ok:true};},async actions(a){return{ok:true,done:a.uids.length,missing:0};},
        async saved(){return{items:[]};},async savedDraft(){return null;},async saveDraft(){return{ok:true};},
        async openAttachment(){return{ok:true};},async openOriginal(){return{ok:true};},async removeAccount(){return{ok:true};}
      }
    }};
  },MAILS);
  await page.goto(url);
  await page.waitForFunction(()=>window.PBAccountName&&document.documentElement.classList.contains('v3')&&typeof db!=='undefined'&&db);
  ok('Short names: T-Online, Gmail, Googlemail, WEB.DE, GMX, unknown domain without ending',await page.evaluate(()=>[
    PBAccountName('a@t-online.de'),PBAccountName('a@gmail.com'),PBAccountName('a@googlemail.com'),PBAccountName('a@web.de'),PBAccountName('a@gmx.net'),PBAccountName('a@musterhaus.de')].join('|')==='T-Online|Gmail|Googlemail|WEB.DE|GMX|Musterhaus'));
  ok('Two accounts with the same short name keep apart by the part before @',await page.evaluate(()=>PBAccountName('erst@gmx.de',['erst@gmx.de','zweit@gmx.net'])==='GMX · erst'));
  const oneRow=()=>page.evaluate(()=>{const h=document.querySelector('header.top'),row=document.querySelector('.native-toolbar-row');return {inside:row.parentElement===h,height:h.getBoundingClientRect().height,sub:getComputedStyle(h.querySelector('.brand .sub')).display};});
  let r=await oneRow();
  ok('1280px: navigation sits in the header, one row, no subtitle line',r.inside&&r.height<=64&&r.sub==='none');
  // Kompakt (Klaus 2026-10-24): keine Erklärtexte der alten Fassung, kein Wortbruch, Suchfeld weit oben.
  ok('Search page: no welcome text, no counters, no empty-state explanation',await page.evaluate(()=>['.search-welcome','.search-totals','#searchEmpty'].every(s=>{const n=document.querySelector('#panel-search '+s)||document.querySelector(s);return !n||getComputedStyle(n).display==='none';})));
  ok('Search page: the help sentence is quiet until there is a result',await page.locator('#searchInfo').evaluate(e=>getComputedStyle(e).display==='none'));
  // Emulator-Starttest hing, weil „Alle prüfen“ und das Symbol sich ständig gegenseitig neu schrieben (2026-10-24).
  ok('The page is quiet when idle: no endless rewrite loop between app code and line symbols',await page.evaluate(()=>new Promise(res=>{let c=0;const o=new MutationObserver(m=>c+=m.length);o.observe(document.body,{subtree:true,childList:true,characterData:true});setTimeout(()=>{o.disconnect();res(c<100);},2000);})));
  ok('Old emojis replaced by line symbols on the search page (mic, remember, checked, related)',await page.evaluate(()=>['#mic','#fSave','.pb-check-all-button','[data-i18n=combine]'].every(s=>{const n=document.querySelector('#panel-search '+s);return n&&n.querySelector('svg.v3-icon')&&!/[🎤💾🛡🔗]/u.test(n.textContent);})));
  // Klaus 2026-10-24: kein „?“ in der Suche, keine Namenssuche; ein Schalter „Bedeutung“ mit Lupe dahinter.
  ok('No "?" in the search box, its explanation stays hidden',await page.locator('#panel-search .v3-help').count()===0&&await page.locator('#panel-search .search-welcome').evaluate(e=>getComputedStyle(e).display==='none'));
  const mean=page.locator('#mode [data-m=mean]');
  ok('No name search button, only "Bedeutung" with the magnifier behind it',!(await page.locator('#mode [data-m=name]').isVisible())&&(await mean.textContent()).trim()==='Bedeutung'&&await mean.evaluate(b=>{const i=b.querySelector('svg.v3-icon'),t=b.querySelector('.v3-mean-label');return !!i&&i.getBoundingClientRect().left>t.getBoundingClientRect().right-1;}));
  ok('Switched on: highlighted as before, pressed',await mean.evaluate(b=>b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true'&&getComputedStyle(b).borderStyle!=='dashed'));
  ok('"Bedeutung" stays on one line',await mean.evaluate(b=>b.getBoundingClientRect().height<40));
  await mean.click();
  ok('A tap switches it off, visibly (dashed, crossed out) and the search goes by name',await mean.evaluate(b=>!b.classList.contains('on')&&b.getAttribute('aria-pressed')==='false'&&getComputedStyle(b).borderTopStyle==='dashed'&&getComputedStyle(b.querySelector('.v3-mean-label')).textDecorationLine.includes('line-through'))&&await page.evaluate(()=>MODE==='name'));
  await mean.click();
  ok('Another tap switches meaning search on again',await mean.evaluate(b=>b.classList.contains('on'))&&await page.evaluate(()=>MODE==='mean'));
  await page.locator('[data-tab="mail"]').click();
  const connect=page.locator('#mailWorkspace [data-live-text="connect"]');if(await connect.isVisible().catch(()=>false))await connect.click();
  await page.locator('#mailWorkspace [data-live-uid="99"]').waitFor({state:'visible',timeout:15000});
  const folders=page.locator('#mailWorkspace .live-mail .mail-folders .mail-folder');
  ok('Every folder carries a line symbol',await folders.evaluateAll(n=>n.length>=8&&n.every(b=>b.querySelector(':scope>svg.v3-icon'))));
  ok('No emoji in the folder list; the symbol stands before the name',await folders.evaluateAll(n=>n.every(b=>!/\p{Extended_Pictographic}/u.test(b.textContent)&&b.querySelector('svg.v3-icon').getBoundingClientRect().left<b.firstChild.parentElement.getBoundingClientRect().left+30)));
  await page.locator('.native-options>summary').click();await page.locator('[data-lang=en]').click();await page.waitForTimeout(300);
  ok('Language change: "All accounts" is translated and stays without emoji',await page.locator('#mailWorkspace .live-mail [data-mail-all=open]').evaluate(b=>b.firstChild.nodeValue.trim()==='All accounts'&&!/\p{Extended_Pictographic}/u.test(b.textContent)&&!!b.querySelector('svg.v3-icon')));
  await page.locator('.native-options>summary').click();await page.locator('[data-lang=de]').click();await page.waitForTimeout(300);
  ok('Folder names stay on one line (no word breaks)',await folders.evaluateAll(n=>n.every(b=>b.getBoundingClientRect().height<48)));
  const opt=page.locator('#mailWorkspace .live-mail .mail-account-bar select option:checked');
  ok('Account choice shows the short name, the full address only as hint',await opt.textContent()==='Example'&&await opt.getAttribute('title')==='post@example.invalid');
  ok('No "address · Posteingang" line any more; the marked folder shows where you are',await page.locator('#mailWorkspace .live-mail .mail-notice').evaluate(e=>e.textContent===''&&getComputedStyle(e).display==='none')&&await page.locator('#mailWorkspace .live-mail .mail-folder[aria-current=true]').textContent().then(t=>t.includes('Posteingang')));
  ok('The address appears nowhere as visible text on the mail page',await page.locator('#mailWorkspace .live-mail').evaluate(e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.textContent.includes('post@example.invalid')&&n.parentElement.offsetParent&&n.parentElement.tagName!=='OPTION')return false;return true;}));
  await page.locator('#mailWorkspace [data-live-uid="99"]').click();await page.waitForTimeout(400);
  for(const look of ['bisher','klar','petrol','schiefer','weich']){
    await page.evaluate(n=>PBLook.set(n),look);await page.waitForTimeout(450);
    if(capture){await mkdir(shots,{recursive:true});await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${look}-hell-1280.png`});
      await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dunkel'));await page.waitForTimeout(450);await page.screenshot({path:`${shots}/${look}-dunkel-1280.png`});
      await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));}
  }
  // Klaus 2026-10-24: Spaltenbreiten mit der Maus verstellen (Postfach und Explorer), ↔-Zeiger an der Trennlinie.
  const live='#mailWorkspace .live-mail .mail-layout';
  const split=page.locator(live+' > .v3-splitter').first();
  ok('Mail: a divider with the ↔ pointer sits between folders and list',await split.isVisible()&&await split.evaluate(h=>getComputedStyle(h).cursor==='col-resize'));
  const fw=()=>page.locator(live+' > .mail-folders').evaluate(e=>e.getBoundingClientRect().width);
  const w0=await fw(),hb=await split.boundingBox();
  await page.mouse.move(hb.x+hb.width/2,hb.y+40);await page.mouse.down();await page.mouse.move(hb.x+hb.width/2+60,hb.y+40,{steps:6});await page.mouse.up();
  const w1=await fw();
  ok('Mail: dragging the divider makes the folder column wider',Math.abs(w1-w0-60)<=3);
  ok('Mail: the width is kept for the next start',await page.evaluate(()=>JSON.parse(localStorage.getItem('pb-cols-mail')||'{}')['--v3-col-a']>0));
  const lw=()=>page.locator(live+' > .mail-list').evaluate(e=>e.getBoundingClientRect().width);
  const l0=await lw();await page.locator(live+' > .v3-splitter').nth(1).focus();await page.keyboard.press('ArrowRight');
  ok('Mail: arrow keys move the second divider (list column) in 16 px steps',Math.abs(await lw()-l0-16)<=2);
  await split.dblclick();
  ok('Mail: double-click resets the column',Math.abs(await fw()-w0)<=3);
  ok('Mail: the reading pane keeps at least 320 px even when dragged far',await (async()=>{const b=await split.boundingBox();await page.mouse.move(b.x+5,b.y+40);await page.mouse.down();await page.mouse.move(b.x+2000,b.y+40,{steps:4});await page.mouse.up();
    return page.locator(live+' > .mail-reader').evaluate(e=>e.getBoundingClientRect().width>=318);})());
  await split.dblclick();
  await page.locator('[data-tab=explorer]').click();await page.waitForTimeout(300);
  const tsplit=page.locator('#panel-explorer .explorer-layout > .v3-splitter');
  const tw=()=>page.locator('#explorerTree').evaluate(e=>e.getBoundingClientRect().width);
  const t0=await tw(),tb=await tsplit.boundingBox();
  await page.mouse.move(tb.x+tb.width/2,tb.y+20);await page.mouse.down();await page.mouse.move(tb.x+tb.width/2+80,tb.y+20,{steps:6});await page.mouse.up();
  ok('Explorer: the folder tree can be made wider with the mouse',Math.abs(await tw()-t0-80)<=3&&await page.evaluate(()=>JSON.parse(localStorage.getItem('pb-cols-explorer')||'{}')['--v3-col-a']>0));
  await tsplit.dblclick();
  await page.locator('[data-tab=search]').click();await page.setViewportSize({width:412,height:860});await page.waitForTimeout(300);
  ok('412px: search field starts high up, filters hidden behind one "Filter" button',await page.evaluate(()=>document.querySelector('#q').getBoundingClientRect().top<160&&getComputedStyle(document.querySelector('#filterbar')).display==='none'&&!!document.querySelector('#v3FilterToggle')));
  await page.locator('#v3FilterToggle').click();
  ok('412px: the Filter button opens the five filters',await page.locator('#filterbar').evaluate(e=>getComputedStyle(e).display!=='none'));
  await page.locator('#v3FilterToggle').click();await page.locator('[data-tab=intake]').click();
  ok('412px: import page without the three explanation points and hints',await page.evaluate(()=>['.native-import-reassurance','#fsHint','[data-i18n=dropDnd]','[data-ws=libraryHelp]'].every(s=>{const n=document.querySelector(s);return !n||getComputedStyle(n).display==='none';})));
  await page.locator('#drop .v3-help').click();
  ok('412px: "?" in the drop box brings the hints and the three points back, and hides them again',await page.locator('.native-import-reassurance').evaluate(e=>getComputedStyle(e).display!=='none')&&await page.locator('#fsHint').evaluate(e=>getComputedStyle(e).display!=='none')&&await (async()=>{await page.locator('#drop .v3-help').click();return page.locator('.native-import-reassurance').evaluate(e=>getComputedStyle(e).display==='none');})());
  await page.locator('#panel-intake .library-setup .v3-help').click();
  ok('412px: "?" in the storage box shows its explanation',await page.locator('[data-ws=libraryHelp]').evaluate(e=>getComputedStyle(e).display!=='none'));
  await page.locator('#panel-intake .library-setup .v3-help').click();
  await page.locator('[data-tab=mail]').click();await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(300);
  for(const width of [1100,1000,768,412,360]){
    await page.setViewportSize({width,height:860});await page.waitForTimeout(300);
    r=await oneRow();
    ok(`${width}px: header ${width>=1100?'holds the navigation in one row':'keeps the navigation below'}, no horizontal overflow`,(width>=1100?r.inside&&r.height<=64:!r.inside)&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(capture&&width===412)for(const look of ['klar','petrol','schiefer','weich']){await page.evaluate(n=>PBLook.set(n),look);await page.waitForTimeout(450);await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${look}-hell-412.png`});
      await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dunkel'));await page.waitForTimeout(450);await page.screenshot({path:`${shots}/${look}-dunkel-412.png`});await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));}
  }
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(300);
  ok('Back to wide: navigation returns into the header',(await oneRow()).inside);
  // Wechsel breit → schmal: das Siegel misst neu und liegt nicht über dem Inhalt (vorher blieb es zu tief stehen).
  await page.setViewportSize({width:320,height:640});await page.waitForTimeout(500);
  ok('320px after wide: the Siegel sits in the header again, not over the content',await page.evaluate(()=>{const s=document.querySelector('#sbkim-widget')?.getBoundingClientRect(),h=document.querySelector('header.top').getBoundingClientRect();return !s||s.bottom<=h.bottom+8;}));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(500);
  ok('No unhandled runtime errors',errors.length===0);
  console.log(`${count} V3 interface checks passed.`);
}finally{await browser?.close();server.close();}
