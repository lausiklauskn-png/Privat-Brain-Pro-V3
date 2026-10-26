// Explorer: newest on top by default, ↕ turns the order, "auch im Inhalt" searches the file text,
// "Alle Konten" mails stay out. Browser UI with seeded catalog entries; no files are written.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
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
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.evaluate(async()=>{
    const day=864e5,now=Date.now();
    const add=async(name,age,size,text,extra={})=>{const toks=tokens(name+' '+text);const r={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Unterlagen/'+name,type:'application/pdf',ext:'pdf',date:now-age*day,size,snippet:text.slice(0,600),summary:'',vector:buildVector(toks),tf:termFreq(toks),category:'Dokument',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);};
    await add('Gehaltsabrechnung-September.pdf',30,120000,'Bruttolohn 3.200 Euro, Lohnsteuer, Sozialversicherung');
    await add('Arztbrief-Orthopaedie.pdf',200,80000,'Diagnose: Bandscheibenvorfall, Physiotherapie empfohlen');
    await add('Rechnung-Stadtwerke.pdf',5,40000,'Rechnungsbetrag 54,20 Euro, Zählerstand');
    await add('Aldi-Newsletter',1,3000,'Angebote der Woche',{mail:{from:'news@aldi.invalid',subject:'Angebote'},mailBody:'Angebote der Woche',mailIndex:1,path:'Mail/Aldi/Angebote'});
    rebuildIndex();refreshAll();
  });
  await page.locator('[data-tab="explorer"]').click();
  const names=()=>page.locator('#explorerFiles .explorer-row strong').allTextContents().then(a=>a.map(x=>x.replace(/^\S+\s/,'')));
  ok('Newest file is on top by default',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke.pdf','Gehaltsabrechnung-September.pdf','Arztbrief-Orthopaedie.pdf']));
  ok('Mails from "Alle Konten" do not appear in the explorer',!(await names()).some(n=>n.includes('Aldi'))&&!(await page.locator('#explorerTree').textContent()).includes('Mail'));
  // Klaus 2026-10-24: one sorting control. Sitzung 2 (2026-10-26): it shows its choice on the button, „D ↓“.
  const sortBox=page.locator('#explorerSort'),menu=page.locator('#pb-explorer-sort'),summary=menu.locator(':scope>summary');
  const choose=async selector=>{if(!await menu.evaluate(e=>e.open))await summary.click();await menu.locator(selector).click();};
  const short=()=>summary.innerText().then(s=>s.trim());
  ok('Sorting is one button showing „D ↓“ (date, newest on top); the old field stays hidden as state holder',await page.locator('#explorerOrder').count()===0&&await short()==='D ↓'&&await summary.getAttribute('aria-label')==='Sortieren: Datum · Neueste oben'&&!await sortBox.isVisible()&&await sortBox.inputValue()==='date');
  ok('The tooltip explains the letters and arrows',(await summary.getAttribute('title')).includes('D Datum · N Name · G Größe · T Typ'));
  await choose('[data-sort-reverse="true"]');
  ok('„D ↑“ puts the oldest on top',JSON.stringify(await names())===JSON.stringify(['Arztbrief-Orthopaedie.pdf','Gehaltsabrechnung-September.pdf','Rechnung-Stadtwerke.pdf'])&&await short()==='D ↑'&&await sortBox.inputValue()==='date-r');
  await choose('[data-sort-key="name"]');
  ok('„N ↑“: name A → Z',(await names())[0]==='Arztbrief-Orthopaedie.pdf'&&await short()==='N ↑');
  await choose('[data-sort-reverse="true"]');
  ok('„N ↓“: name Z → A',(await names())[0]==='Rechnung-Stadtwerke.pdf'&&await short()==='N ↓');
  await choose('[data-sort-key="size"]');
  ok('„G ↓“: largest on top',(await names())[0]==='Gehaltsabrechnung-September.pdf'&&await short()==='G ↓');
  await choose('[data-sort-key="type"]');
  ok('„T ↑“: type is offered too',await short()==='T ↑'&&(await page.evaluate(()=>PBWorkspace.explorerState().sort))==='type');
  await choose('[data-sort-key="date"]');
  await page.fill('#explorerFilter','bandscheibe');
  ok('Without the content switch only names are searched',(await names()).length===0);
  await page.locator('#explorerContent').check();
  ok('"auch im Inhalt" finds the doctor\'s letter by its text',JSON.stringify(await names())===JSON.stringify(['Arztbrief-Orthopaedie.pdf']));
  await page.fill('#explorerFilter','lohnsteuer brutto');
  ok('All words must occur in the content',JSON.stringify(await names())===JSON.stringify(['Gehaltsabrechnung-September.pdf']));
  await page.fill('#explorerFilter','zahlerstand');
  ok('Umlauts do not matter',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke.pdf']));
  const state=await page.evaluate(()=>PBWorkspace.explorerState());
  ok('Back navigation keeps order and content switch',state.content===true&&state.reverse===false&&state.sort==='date');
  await page.evaluate(()=>PBWorkspace.restoreExplorer({path:'',filter:'',sort:'date',reverse:true,content:false}));
  await page.waitForFunction(()=>document.querySelector('#pb-explorer-sort .pb-sort-short').textContent==='D ↑');
  ok('Restoring a state restores the order, the button and the switch',(await names())[0]==='Arztbrief-Orthopaedie.pdf'&&await sortBox.inputValue()==='date-r'&&!(await page.locator('#explorerContent').isChecked()));
  await page.evaluate(()=>{document.documentElement.lang='en';PBWorkspace.refresh();});
  await page.waitForFunction(()=>document.querySelector('#pb-explorer-sort>summary').getAttribute('aria-label')==='Sort: Date · Oldest first');
  ok('English labels',await short()==='D ↑'&&(await page.locator('.explorer-content').textContent()).includes('also in content'));
  await page.setViewportSize({width:360,height:740});
  ok('Toolbar fits a phone without sideways scrolling',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  ok('Sort button and switch are flat but easy to tap (26–44 px)',await page.evaluate(()=>['#pb-explorer-sort>summary','.explorer-content'].every(s=>{const h=document.querySelector(s).getBoundingClientRect().height;return h>=26&&h<=44;})));
  ok('No runtime errors',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} explorer order checks passed (seeded catalog; no files written).`);
