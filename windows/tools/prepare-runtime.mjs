import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const windows=fileURLToPath(new URL('../',import.meta.url)),root=join(windows,'..'),runtime=join(windows,'runtime');
if(process.platform!=='win32')throw Error('The bundled Windows runtime must be built on Windows.');
execFileSync(process.execPath,[join(windows,'engine/build.mjs')],{stdio:'inherit'});
await rm(runtime,{recursive:true,force:true});await mkdir(join(runtime,'engine'),{recursive:true});
for(const name of ['classes','lib','shared-source.json'])await cp(join(windows,'engine/build',name),join(runtime,'engine',name),{recursive:true});
for(const [from,to] of [['windows/gmail-desktop.json','gmail-desktop.json'],['tools/native/semantic-model.json','semantic-model.json']])await cp(join(root,from),join(runtime,to));
execFileSync(join(process.env.JAVA_HOME,'bin/jlink.exe'),['--add-modules','java.base,java.logging,java.desktop,java.naming,java.security.sasl,jdk.crypto.ec,jdk.charsets','--strip-debug','--no-header-files','--no-man-pages','--compress=2','--output',join(runtime,'jre')],{stdio:'inherit'});
execFileSync('python',[join(windows,'tools/licenses.py')],{cwd:root,stdio:'inherit'});
// V3 symbol (tools/native/icon/make-v3-icons.py): the multi-size ICO is used unchanged.
const ico=await readFile(join(root,'icon-v3-windows.ico'));
if(ico.readUInt16LE(0)!==0||ico.readUInt16LE(2)!==1||ico.readUInt16LE(4)<1)throw Error('Review Windows icon file.');
const sizes=Array.from({length:ico.readUInt16LE(4)},(_,i)=>ico[6+i*16]||256);
if(!sizes.includes(256)||!sizes.includes(16))throw Error('Review Windows icon sizes.');
await mkdir(join(windows,'src-tauri/icons'),{recursive:true});await writeFile(join(windows,'src-tauri/icons/icon.ico'),ico);
console.log('Private Windows runtime prepared; no Java installation required on the recipient computer.');
