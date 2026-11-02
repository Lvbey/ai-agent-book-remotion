"""Generate approved chapter narration, real captions and semantic animation anchors."""
import base64,hashlib,importlib.util,json,os,re,time,uuid,wave
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('tts',ROOT/'scripts/generate-tts.py');tts=importlib.util.module_from_spec(spec);spec.loader.exec_module(tts)
def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def normal(s): return re.sub(r'[^\w\u4e00-\u9fff]','',s).lower()
def synth(text,config):
    body={'user':{'uid':'chapter2'},'req_params':{'text':text,'speaker':config['speaker'],'audio_params':{'format':'pcm','sample_rate':48000,'speech_rate':0,'enable_subtitle':True},'context_texts':[config['instruction']]}}
    digest=hashlib.sha256(json.dumps([body,config['resource']],sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    cache=ROOT/'narration/segments'/digest
    if (cache/'audio.pcm').exists() and (cache/'words.json').exists(): return (cache/'audio.pcm').read_bytes(),json.loads((cache/'words.json').read_text(encoding='utf-8')),digest
    key=os.environ.get('DOUBAO_TTS_API_KEY');assert key,'Missing DOUBAO_TTS_API_KEY'
    for attempt in range(3):
        req=Request(tts.URL,data=json.dumps(body).encode(),headers={'X-Api-Key':key,'X-Api-Resource-Id':config['resource'],'X-Api-Request-Id':str(uuid.uuid4()),'Content-Type':'application/json'})
        try:
            with urlopen(req,timeout=120) as response: events=[json.loads(line) for line in response if line.strip()]
            break
        except HTTPError as e:
            if e.code not in (429,500,502,503,504) or attempt==2: raise RuntimeError('Provider HTTP '+str(e.code)) from None
        except (URLError,TimeoutError):
            if attempt==2: raise RuntimeError('Provider connection failed') from None
        time.sleep(2**attempt)
    pcm,words=tts.decode(events);tts.captions(words,len(pcm)/96000)
    cache.mkdir(parents=True,exist_ok=True);(cache/'audio.pcm').write_bytes(pcm);write(cache/'words.json',words)
    return pcm,words,digest

def build():
    script=json.loads((ROOT/'narration/script.json').read_text(encoding='utf-8'))
    config=json.loads((ROOT/'narration/voice-config.json').read_text(encoding='utf-8'))
    result={};cursor=0;global_captions=[]
    for number,scene in enumerate(script['scenes'],1):
        text=''.join(u['text'] for u in scene['units']);pcm,words,digest=synth(text,config)
        duration=len(pcm)/96000;raw=tts.captions(words,duration)
        chars=[]
        for w in raw:
            chars.extend((c,w['startMs'],w['endMs']) for c in normal(w['text']))
        spoken=''.join(c[0] for c in chars)
        # Exact normalized matching: no guessed or evenly distributed timestamps.
        if spoken!=normal(text):
            write(ROOT/f'narration/review-{number:02}.json',{'expected':normal(text),'actual':spoken})
            raise ValueError(f'Scene {number}: transcript mismatch, review required')
        cues=[]
        for cue in scene['anchors']:
            idx=spoken.index(normal(cue['phrase']));cues.append({'phrase':cue['phrase'],'frame':cue['frame'],'ms':chars[idx][1]})
        assert all(a['ms']<b['ms'] and a['frame']<b['frame'] for a,b in zip(cues,cues[1:])),scene['sceneKey']
        phrases=[];pos=0
        for phrase in re.findall(r'[^，。！？；、]+[，。！？；、]?',text):
            length=len(normal(phrase))
            if not length: continue
            # Break long phrases only at provider word boundaries, preserving exact times.
            for offset in range(0,length,22):
                end=min(length,offset+22)
                positions=[i for i,c in enumerate(phrase) if normal(c)]
                display=phrase[positions[offset]:(positions[end] if end<length else len(phrase))]
                phrases.append({'text':display,'startMs':chars[pos+offset][1],'endMs':chars[pos+end-1][2],'timestampMs':(chars[pos+offset][1]+chars[pos+end-1][2])/2,'confidence':None})
            pos+=length
        assert pos==len(chars)
        # Actual samples plus a one-second closing pause. Cumulative absolute rounding.
        pcm+=bytes(96000);seconds=len(pcm)/96000
        start=round(cursor*30);cursor+=seconds;frames=round(cursor*30)-start
        target=ROOT/f'public/audio/narration/{number:02}.wav';target.parent.mkdir(parents=True,exist_ok=True)
        with wave.open(str(target),'wb') as w:w.setparams((1,2,48000,0,'NONE','not compressed'));w.writeframes(pcm)
        result[scene['sceneKey']]={'number':number,'duration':frames,'audioSeconds':seconds,'audio':f'audio/narration/{number:02}.wav','captions':phrases,'words':raw,'anchors':cues,'hash':digest}
        write(ROOT/f'public/captions/{number:02}.json',phrases)
        for cap in phrases:global_captions.append({**cap,'startMs':cap['startMs']+(cursor-seconds)*1000,'endMs':cap['endMs']+(cursor-seconds)*1000})
        print(f'Scene {number:02}: {seconds:.2f}s, {len(raw)} words, {len(cues)} anchors',flush=True)
    write(ROOT/'src/voice-timeline.json',result);write(ROOT/'narration/generated-manifest.json',{'totalFrames':round(cursor*30),'durationSeconds':cursor,'timestampSource':'doubao-provider','scenes':result})
    def stamp(ms):
        ms=round(ms);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
    (ROOT/'public/captions/chapter2.srt').write_text('\n\n'.join(f'{i}\n{stamp(c["startMs"])} --> {stamp(c["endMs"])}\n{c["text"]}' for i,c in enumerate(global_captions,1)),encoding='utf-8')
if __name__=='__main__':build()
