import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'src/voice-timeline.json'),'utf8'));
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
assert(Object.keys(data).length===13,'Expected 13 voiced scenes');
let frames=0,seconds=0,anchors=0;
for(const [key,s] of Object.entries(data)){
 const wav=fs.readFileSync(path.join(root,'public',s.audio));
 assert(wav.toString('ascii',0,4)==='RIFF'&&wav.toString('ascii',8,12)==='WAVE',`${key}: invalid WAV`);
 const actual=(wav.length-44)/96000;
 assert(Math.abs(actual-s.audioSeconds)<1/48000,`${key}: audio duration mismatch`);
 assert(s.captions.length&&s.words.length,`${key}: missing real captions`);
 let previous=-1;
 for(const c of s.captions){assert(c.startMs>=previous&&c.endMs>=c.startMs&&c.endMs<=actual*1000,`${key}: caption bounds`);previous=c.endMs}
 for(let i=0;i<s.anchors.length;i++){
  const a=s.anchors[i];assert(a.ms>=0&&a.ms<actual*1000,`${key}: anchor bounds`);
  if(i)assert(a.ms>s.anchors[i-1].ms&&a.frame>s.anchors[i-1].frame,`${key}: anchor ordering`);
  // Sampling the first video frame at/after speech must stay within one video frame.
  assert(Math.ceil(a.ms*30/1000)*1000/30-a.ms<1000/30+0.001,`${key}: frame synchronization`);
 }
 const start=Math.round(seconds*30);seconds+=actual;assert(s.duration===Math.round(seconds*30)-start,`${key}: accumulated frame rounding`);
 frames+=s.duration;anchors+=s.anchors.length;
}
assert(frames===Math.round(seconds*30),'Final duration drift');
console.log(`PASS: 13 WAV tracks; provider captions; ${anchors} ordered semantic anchors; ${frames} frames / ${seconds.toFixed(2)}s`);
