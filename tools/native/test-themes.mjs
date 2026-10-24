// Wählbare Themen (Klaus 2026-10-24): Knopf oben, vier Themen je Hell/Dunkel, Wahl bleibt nach Neustart.
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
const capture=process.env.PB_CAPTURE_DESIGN==='1',shots='docs/design/themen-2026-10-24';
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
  await page.waitForFunction(()=>window.PBLook&&document.querySelector('#pbLookBtn')&&typeof db!=='undefined'&&db);
  const look=()=>page.evaluate(()=>document.documentElement.getAttribute('data-look'));
  const acc=()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--acc').trim().toLowerCase());

  ok('Without a choice the app keeps its previous look (no data-look, gold accent)',await look()===null&&await acc()==='#b08d57');
  const btn=page.locator('#pbLookBtn');
  ok('The design button sits visibly right after the gear in the navigation',await btn.isVisible()&&await btn.evaluate(b=>b.previousElementSibling?.dataset.tab==='settings'));
  ok('It carries a line symbol, not an emoji',await btn.evaluate(b=>!!b.querySelector('svg path')&&!/\p{Extended_Pictographic}/u.test(b.textContent)));
  ok('German name as tooltip and for screen readers',await btn.getAttribute('aria-label')==='Design wählen');
  await btn.click();
  const items=page.locator('#pbLookMenu .pb-look-item');
  ok('The button opens a choice of five: previous look plus the four designs',await page.locator('#pbLookMenu').isVisible()&&await items.count()===5);
  ok('Names in German, no word broken',await items.allTextContents().then(t=>t.join('|')==='Bisher|Klar|Petrol warm|Schiefer kompakt|Weich und luftig')&&await items.evaluateAll(n=>n.every(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().height<48)));
  ok('The current look is marked',await page.locator('#pbLookMenu [aria-checked=true]').getAttribute('data-look')==='bisher');
  await page.keyboard.press('Escape');
  ok('Escape closes the choice',await page.locator('#pbLookMenu').isHidden());

  await page.locator('[data-tab="mail"]').click();
  const connect=page.locator('#mailWorkspace [data-live-text="connect"]');if(await connect.isVisible().catch(()=>false))await connect.click();
  await page.locator('#mailWorkspace [data-live-uid="99"]').waitFor({state:'visible',timeout:15000}).catch(()=>{});
  const live=await page.locator('#mailWorkspace [data-live-uid="99"]').isVisible();
  if(live){await page.locator('#mailWorkspace [data-live-uid="99"]').click();await page.waitForTimeout(400);}
  if(capture){await mkdir(shots,{recursive:true});await page.waitForTimeout(300);await page.mouse.move(2,2);await page.screenshot({path:`${shots}/bisher-hell-1280.png`});}

  for(const name of ['klar','petrol','schiefer','weich']){
    await btn.click();await page.locator(`#pbLookMenu [data-look=${name}]`).click();
    ok(`${name}: choosing it sets the look and its accent`,await look()===name&&await acc()===EXPECT[name][0]);
    ok(`${name}: the choice is remembered`,await page.evaluate(n=>localStorage.getItem('pb-look')===n,name));
    ok(`${name}: the mail page follows the design (its own petrol is replaced)`,await page.locator('#mailWorkspace .mail-app').first().evaluate(e=>getComputedStyle(e).getPropertyValue('--mail-accent').trim().toLowerCase())===EXPECT[name][0]);
    ok(`${name}: the main button is the only solid one in the mail list bar`,await page.locator('#mailWorkspace .mail-app').first().evaluate(e=>{const solid=[...e.querySelectorAll('.mail-button')].filter(b=>b.offsetParent&&getComputedStyle(b).backgroundImage.includes('gradient'));return solid.every(b=>b.classList.contains('mail-primary'));}));
    if(capture){await page.waitForTimeout(500);await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${name}-hell-1280.png`});}
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dunkel'));await page.waitForTimeout(500);
    ok(`${name}: dark mode works inside the design`,await acc()===EXPECT[name][1]&&await page.evaluate(()=>{const c=getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);return c[0]+c[1]+c[2]<120;}));
    if(capture)await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${name}-dunkel-1280.png`});
    await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));
  }
  // Handy: Knopf passt in die eine Kopfzeile, kein Querlaufen.
  await page.setViewportSize({width:412,height:860});
  for(const name of ['bisher','klar','petrol','schiefer','weich']){
    await page.evaluate(n=>PBLook.set(n),name);await page.waitForTimeout(500);
    ok(`412px ${name}: no horizontal page overflow, the button stays on screen and clear of the Siegel`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&(()=>{const b=document.querySelector('#pbLookBtn').getBoundingClientRect();const s=document.querySelector('#sbkim-widget')?.getBoundingClientRect();const clear=!s||b.right<=s.left||b.left>=s.right||b.bottom<=s.top||b.top>=s.bottom;return b.right<=innerWidth&&b.width>0&&clear;})()));
    if(capture&&name!=='bisher'){await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${name}-hell-412.png`});await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dunkel'));await page.waitForTimeout(500);await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${name}-dunkel-412.png`});await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));}
    if(capture&&name==='bisher')await page.mouse.move(2,2);await page.screenshot({path:`${shots}/bisher-hell-412.png`});
  }
  await page.evaluate(()=>PBLook.set('weich'));
  await page.reload();await page.waitForFunction(()=>window.PBLook&&document.querySelector('#pbLookBtn'));
  ok('After a restart the chosen design is back before anything is drawn',await look()==='weich'&&await page.evaluate(()=>!!document.querySelector('link[href="assets/themes.css"]')));
  await page.locator('.native-options>summary').click();await page.locator('[data-lang=en]').click();
  ok('English: tooltip and names follow the language',await btn.getAttribute('aria-label')==='Choose design'&&await (async()=>{await btn.click();const t=await items.allTextContents();await page.keyboard.press('Escape');return t[4]==='Soft and airy';})());
  await page.locator('.native-options>summary').click();await page.locator('[data-lang=ru]').click();
  ok('Russian and Polish labels exist',await btn.getAttribute('aria-label')==='Выбрать оформление'&&await (async()=>{await page.locator('.native-options>summary').click();await page.locator('[data-lang=pl]').click();return await btn.getAttribute('aria-label')==='Wybierz wygląd';})());
  await page.locator('.native-options>summary').click();await page.locator('[data-lang=de]').click();
  await btn.click();await page.locator('#pbLookMenu [data-look=bisher]').click();
  ok('"Bisher" brings back the previous look and forgets the choice',await look()===null&&await acc()==='#b08d57'&&await page.evaluate(()=>localStorage.getItem('pb-look')===null));
  await page.evaluate(()=>localStorage.setItem('pb-look','<b>falsch</b>'));await page.reload();await page.waitForFunction(()=>window.PBLook);
  ok('An unknown stored value falls back to the previous look',await look()===null);
  ok('No unhandled runtime errors',errors.length===0);
  if(!live)console.log('(Hinweis: gestelltes Postfach nicht geöffnet; Mail-Bilder zeigen die lokale Ansicht)');
  console.log(`${count} theme checks passed.`);
}finally{await browser?.close();server.close();}
