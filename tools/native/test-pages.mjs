// Webfassung für GitHub Pages (Klaus 2026-10-24): installierbar, Name und Symbol „V3“, Installieren-Knopf sichtbar,
// Service Worker lädt zuerst aus dem Netz (nie zuerst eine alte Fassung). Baut in eine Wegwerf-Kopie von www.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,cp,rm,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const dir=await mkdtemp(join(tmpdir(),'pb-pages-'));
await cp('www',dir,{recursive:true});
execFileSync('node',['tools/native/prepare-pages.mjs',dir],{stdio:'inherit'});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
let version='A',legacy=false;
const OLD_SW="const C='private-brain-v93';self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'])).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request))));";
const OLD_HTML='<!doctype html><title>Private Brain alt</title><script>navigator.serviceWorker.register("sw.js")</script>';
const server=createServer(async(req,res)=>{
  const path=resolve(dir,'.'+new URL(req.url,'http://x').pathname.replace(/^\/app\//,'/').replace(/\/$/,'/index.html'));
  if(!path.startsWith(dir+sep))return res.writeHead(403).end();
  if(legacy&&path.endsWith('sw.js'))return res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(OLD_SW);
  if(legacy&&path.endsWith('index.html'))return res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'}).end(OLD_HTML);
  try{let data=await readFile(path);if(path.endsWith('index.html'))data=Buffer.from(data.toString().replace('</title>',' '+version+'</title>'));res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/app/`;
let browser,count=0;const ok=(n,v)=>{assert.ok(v,n);console.log('✓ '+n);count++;};
try{
  // Ein echtes Profil (nicht inkognito), sonst meldet Chrome „nicht installierbar“.
  const ctx=browser=await chromium.launchPersistentContext(join(dir,'.profile'),{executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',viewport:{width:1280,height:900}});const page=ctx.pages()[0]||await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>navigator.serviceWorker.controller||new Promise(r=>setTimeout(r,50)).then(()=>false),null,{timeout:15000}).catch(()=>{});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  ok('Title and heading say Private Brain V3',(await page.title()).startsWith('Private Brain V3')&&(await page.locator('.brand h1').textContent()).includes('Private Brain V3'));
  const m=await page.evaluate(async()=>{const l=document.querySelector('link[rel=manifest]');return l&&(await fetch(l.href)).json();});
  ok('Manifest: name Private Brain V3, text under the symbol Private Brain V3, V3 symbols',m&&m.name==='Private Brain V3'&&m.short_name==='Private Brain V3'&&m.icons.every(i=>i.src.startsWith('icon-v3-')));
  ok('Browser tab symbol is the V3 symbol',await page.evaluate(()=>document.querySelector('link[rel=icon]').getAttribute('href')==='icon-v3-192.png'));
  await page.waitForFunction(()=>document.getElementById('installieren')?.closest('header.top .tools'));
  ok('Install button is visible in the header',await page.locator('#installieren').isVisible());
  const cdp=await ctx.newCDPSession(page);const inst=await cdp.send('Page.getInstallabilityErrors');
  ok('Chrome reports no installability errors',inst.installabilityErrors.length===0||console.log(inst.installabilityErrors));
  const keys=await page.evaluate(async()=>{for(let i=0;i<100&&!(await caches.keys()).length;i++)await new Promise(r=>setTimeout(r,100));return caches.keys();});
  ok('Own cache prefix only (pbv3-web-), never the old private-brain- caches',(keys.length>0&&keys.every(x=>x.startsWith('pbv3-web-')))||console.log('caches:',keys));
  version='B';await page.reload();
  ok('With a worker in control, a new version comes from the network first (no old page first)',(await page.title()).endsWith(' B'));
  await ctx.setOffline(true);await page.reload();
  ok('Offline the stored page still opens',(await page.title()).startsWith('Private Brain V3'));
  await ctx.setOffline(false);
  ok('No page errors',errors.length===0||console.log(errors));
  await ctx.close();
  // Ein Gerät mit der alten Fassung (alter Worker liefert aus dem Vorrat): nach dem Wechsel genau einmal neu, dann V3.
  legacy=true;const ctx2=browser=await chromium.launchPersistentContext(join(dir,'.profile2'),{executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium'});
  const old=ctx2.pages()[0]||await ctx2.newPage();await old.goto(url);await old.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await old.reload();ok('Setup: the old worker serves the old page from its store',(await old.title())==='Private Brain alt');
  legacy=false;await old.reload();
  await old.waitForFunction(()=>document.title.startsWith('Private Brain V3'),null,{timeout:20000});
  ok('After the switch the device shows V3 by itself (the old version is replaced)',true);
  ok('The other app store (private-brain-v93) is left untouched',await old.evaluate(async()=>(await caches.keys()).includes('private-brain-v93')));
  console.log(count+' Pages checks passed.');
}finally{await browser?.close();server.close();await rm(dir,{recursive:true,force:true});}
