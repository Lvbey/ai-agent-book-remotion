const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/sceneTiming.ts');
const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,resolveJsonModule:true}}).outputText;
const context={exports:{},require:createRequire(file)};
vm.runInNewContext(output,context);
const {getStoryFrame,SCENE_TIMING}=context.exports;
const voice=require('../src/voice-timeline.json');
let checks=0;
for(const [key,s] of Object.entries(voice)){
 for(const anchor of s.anchors){
  const actual=getStoryFrame(key,anchor.ms*30/1000);
  if(Math.abs(actual-anchor.frame)>1e-6)throw Error(`${key}: semantic anchor mismatch`);
  checks++;
 }
 let previous=-1;
 for(let frame=0;frame<s.duration;frame++){
  const f=getStoryFrame(key,frame);
  if(!Number.isFinite(f)||f<previous||f>SCENE_TIMING[key].authoredEnd)throw Error(`${key}: invalid story clock at frame ${frame}`);
  previous=f;
 }
}
console.log(`PASS: ${checks} exact speech-to-animation anchors; every frame is monotonic and within bounds`);
