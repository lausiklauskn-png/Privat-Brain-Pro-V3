// Übersetzung beim Lesen (Klaus 2026-10-24): Knopf im Lesebereich, Zielsprache, nur auf Tipp und nach Bestätigung,
// verdeckt vor dem Senden. Mistral gestellt; kein Netz.
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
  const errors=[],dialogs=[];let answerDialog=true;page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{dialogs.push(d.message());return answerDialog?d.accept():d.dismiss();});
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
          text:'Guten Tag,\n\nwir bestätigen Ihren Termin am Dienstag, 4. November, um 9:30 Uhr. Bitte bringen Sie Ihre Versichertenkarte mit. Rückfragen unter Tel. 0761 123456 oder post@example.invalid.\n\nFreundliche Grüße\nIhre Praxis Dr. Weiß',attachments:[]};},
        async action(){return{ok:true};},async actions(a){return{ok:true,done:a.uids.length,missing:0};},
        async saved(){return{items:[]};},async savedDraft(){return null;},async saveDraft(){return{ok:true};},
        async openAttachment(){return{ok:true};},async openOriginal(){return{ok:true};},async removeAccount(){return{ok:true};}
      }
    }};
  },MAILS);
  await page.goto(url);
  await page.waitForFunction(()=>window.PBTranslate&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const connect=page.locator('#mailWorkspace [data-live-text="connect"]');if(await connect.isVisible().catch(()=>false))await connect.click();
  await page.locator('#mailWorkspace [data-live-uid="99"]').click();
  const btn=page.locator('#mailWorkspace .v3-translate-btn');await btn.waitFor();
  ok('The reader has a "Übersetzen" button with a line symbol',await btn.getAttribute('aria-label')==='Übersetzen'&&await btn.locator('svg').count()===1);
  await btn.click();
  const panel=page.locator('#mailWorkspace .v3-translate');
  ok('It opens a translation field below the actions; target language defaults to the app language',await panel.isVisible()&&await panel.locator('select').inputValue()==='de'&&await btn.getAttribute('aria-expanded')==='true');
  await panel.locator('select').selectOption('en');
  ok('The chosen target language is remembered',await page.evaluate(()=>localStorage.getItem('pb-translate-to')==='en'));
  await page.evaluate(()=>{for(const k of ['Translator','LanguageDetector'])Object.defineProperty(self,k,{value:undefined,configurable:true,writable:true});window.mistralCalls=[];window.mistralChat=async(system,user)=>{mistralCalls.push({system,user});return 'EN: '+user.split('\n').slice(1,-1).join('\n');};});
  await panel.locator('.mail-primary').click();
  ok('Without a Mistral key nothing is sent and the field says what is needed',await page.evaluate(()=>mistralCalls.length===0)&&(await panel.locator('.v3-translate-status').textContent()).includes('Mistral-Schlüssel'));
  await page.evaluate(()=>{AI.provider='mistral';AI.key='test-key';});
  answerDialog=false;await panel.locator('.mail-primary').click();await page.waitForTimeout(200);
  ok('Declining the confirmation sends nothing',await page.evaluate(()=>mistralCalls.length===0)&&dialogs.at(-1).includes('Mistral (EU)'));
  answerDialog=true;await panel.locator('.mail-primary').click();
  await panel.locator('.v3-translate-out').waitFor({state:'visible'});
  const sent=await page.evaluate(()=>mistralCalls[0]);
  ok('Only after confirming, exactly one request goes out, into English',await page.evaluate(()=>mistralCalls.length===1)&&sent.system.includes('ins English')&&sent.system.includes('DATEN'));
  ok('Address and phone number are hidden before sending',!sent.user.includes('post@example.invalid')&&!sent.user.includes('0761 123456')&&sent.user.includes('⟦'));
  ok('The translation comes back with the real address and number',(await panel.locator('.v3-translate-out').textContent()).includes('post@example.invalid')&&(await panel.locator('.v3-translate-out').textContent()).includes('0761 123456'));
  await panel.getByRole('button',{name:'Ausblenden',exact:true}).click();
  ok('"Ausblenden" closes the field again',await panel.count()===0&&await btn.getAttribute('aria-expanded')==='false');
  // Stufe 1: kann das Gerät selbst übersetzen, geht nichts hinaus, keine Rückfrage.
  await page.evaluate(()=>{window.localCalls=[];self.LanguageDetector={create:async()=>({detect:async()=>[{detectedLanguage:'de'}]})};
    self.Translator={availability:async()=>'available',create:async o=>({translate:async x=>{localCalls.push(o);return 'LOCAL '+o.targetLanguage+': '+x;}})};mistralCalls.length=0;});
  const before=dialogs.length;await btn.click();await panel.locator('.mail-primary').click();
  await panel.locator('.v3-translate-out').waitFor({state:'visible'});
  ok('Built-in translation on the device is used first: nothing to Mistral, no confirmation, real text',await page.evaluate(()=>mistralCalls.length===0&&localCalls.length===1&&localCalls[0].sourceLanguage==='de'&&localCalls[0].targetLanguage==='en')&&dialogs.length===before&&(await panel.locator('.v3-translate-out').textContent()).includes('post@example.invalid')&&(await panel.locator('.v3-translate-status').textContent()).includes('Auf dem Gerät'));
  await page.evaluate(()=>{self.Translator={availability:async()=>'unavailable',create:async()=>{throw new Error('no');}};});
  await panel.locator('.mail-primary').click();await page.waitForFunction(()=>mistralCalls.length===1);
  ok('If the device cannot translate this pair, the KI path follows (with confirmation)',dialogs.length===before+1);
  await panel.getByRole('button',{name:'Ausblenden',exact:true}).click();
  ok('No unhandled runtime errors',errors.length===0);
  console.log(`${count} translation checks passed (Mistral simulated; no network).`);
}finally{await browser?.close();server.close();}
