import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const timeline=JSON.parse(fs.readFileSync('src/voice-timeline.json','utf8'));
const out=path.join(root,'out');fs.mkdirSync(out,{recursive:true});
const browserExecutable='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public')});
const browser=await openBrowser('chrome',{browserExecutable});
try {
 const composition=await selectComposition({serveUrl,id:'ContextEngineering',puppeteerInstance:browser});
 let start=0;const checks=[];
 for(const [key,s] of Object.entries(timeline)){
  for(const frame of [start,start+Math.floor(s.duration/2),start+s.duration-1]){
   const output=path.join(out,`check-${key}-${frame}.png`);
   await renderStill({serveUrl,composition,frame,output,puppeteerInstance:browser,scale:0.5});
   checks.push({scene:key,frame,output});
  }
  start+=s.duration;console.log('Visual smoke check: '+key, true);
 }
 fs.writeFileSync(path.join(out,'visual-smoke-checks.json'),JSON.stringify(checks,null,2));
 if(process.argv.includes('--check-only'))process.exitCode=0;
 else {
  let last=-1;
  await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(out,'chapter2-voiced.mp4'),puppeteerInstance:browser,concurrency:4,onProgress:p=>{
   const percent=Math.floor(p.progress*100);if(percent!==last){last=percent;console.log(`Chapter render: ${percent}%`);fs.writeFileSync(path.join(out,'render-progress.json'),JSON.stringify({percent,updatedAt:new Date().toISOString()}))}
  }});
  const probe=path.join(root,'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe');
  const info=JSON.parse(execFileSync(probe,['-v','error','-show_format','-show_streams','-of','json',path.join(out,'chapter2-voiced.mp4')],{encoding:'utf8'}));
  if(!info.streams.some(s=>s.codec_type==='audio')||!info.streams.some(s=>s.codec_type==='video'))throw new Error('Missing audio/video stream');
  if(Math.abs(Number(info.format.duration)-composition.durationInFrames/30)>0.1)throw new Error('Final media duration mismatch');
  fs.writeFileSync(path.join(out,'render-validation.json'),JSON.stringify(info,null,2));
  console.log('COMPLETE: '+path.join(out,'chapter2-voiced.mp4'));
 }
} finally {await browser.close({silent:true});}
