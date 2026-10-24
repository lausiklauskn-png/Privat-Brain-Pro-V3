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
  for(const width of [1100,1000,768,412,360]){
    await page.setViewportSize({width,height:860});await page.waitForTimeout(300);
    r=await oneRow();
    ok(`${width}px: header ${width>=1100?'holds the navigation in one row':'keeps the navigation below'}, no horizontal overflow`,(width>=1100?r.inside&&r.height<=64:!r.inside)&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(capture&&width===412)for(const look of ['klar','petrol','schiefer','weich']){await page.evaluate(n=>PBLook.set(n),look);await page.waitForTimeout(450);await page.mouse.move(2,2);await page.screenshot({path:`${shots}/${look}-hell-412.png`});
      await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dunkel'));await page.waitForTimeout(450);await page.screenshot({path:`${shots}/${look}-dunkel-412.png`});await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));}
  }
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(300);
  ok('Back to wide: navigation returns into the header',(await oneRow()).inside);
  ok('No unhandled runtime errors',errors.length===0);
  console.log(`${count} V3 interface checks passed.`);
}finally{await browser?.close();server.close();}
