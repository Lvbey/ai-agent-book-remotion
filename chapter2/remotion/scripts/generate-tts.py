"""Audition only. Python standard library; never logs credentials or server bodies."""
import base64, hashlib, json, os, time, uuid, wave
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parents[1]
URL='https://openspeech.bytedance.com/api/v3/tts/unidirectional'

def decode(events):
    audio=bytearray(); words=[]; complete=False
    for event in events:
        code=event.get('code',0)
        if code not in (0,20000000): raise ValueError('Provider error code: '+str(code))
        if event.get('data'): audio.extend(base64.b64decode(event['data'],validate=True))
        sentence=event.get('sentence')
        if sentence:
            if isinstance(sentence,str): sentence=json.loads(sentence)
            words.extend(sentence.get('words',[]))
        complete=complete or code==20000000
    if not complete or not audio or len(audio)%2: raise ValueError('Incomplete or invalid PCM response')
    return bytes(audio),words

def captions(words,duration):
    result=[]; previous=0
    for w in words:
        start=float(w['startTime']); end=float(w['endTime'])
        if not 0<=start<=end<=duration+0.05 or start<previous: raise ValueError('Invalid subtitle timestamps')
        previous=start
        result.append(dict(text=w['word'],startMs=round(start*1000),endMs=round(end*1000),timestampMs=round((start+end)*500),confidence=w.get('confidence')))
    if not result: raise ValueError('No real subtitle timestamps returned; alignment required')
    return result

def main():
    config=json.loads((ROOT/'narration/voice-config.json').read_text(encoding='utf-8'))
    text=(ROOT/'narration/audition.txt').read_text(encoding='utf-8').strip()
    if not 100<=len(text)<=230: raise ValueError('Audition text must contain 100–230 characters')
    body={'user':{'uid':'chapter2-audition'},'req_params':{'text':text,'speaker':config['speaker'],'audio_params':{'format':'pcm','sample_rate':config['sample_rate'],'speech_rate':config['speech_rate'],'enable_subtitle':True},'context_texts':[config['instruction']]}}
    digest=hashlib.sha256(json.dumps({'body':body,'resource':config['resource'],'pronunciation':{}},sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    output=ROOT/'narration/segments'/digest
    if (output/'manifest.json').exists(): print('Cached audition:',output); return
    key=os.environ.get('DOUBAO_TTS_API_KEY')
    if not key: raise ValueError('DOUBAO_TTS_API_KEY is unavailable in this process')
    for attempt in range(3):
        request=Request(URL,data=json.dumps(body).encode(),headers={'X-Api-Key':key,'X-Api-Resource-Id':config['resource'],'X-Api-Request-Id':str(uuid.uuid4()),'Content-Type':'application/json'})
        try:
            with urlopen(request,timeout=90) as response:
                events=[json.loads(line) for line in response if line.strip()]
            break
        except HTTPError as exc:
            if exc.code not in (429,500,502,503,504) or attempt==2: raise ValueError('TTS HTTP status '+str(exc.code)) from None
        except (URLError,TimeoutError):
            if attempt==2: raise ValueError('TTS connection failed after bounded retries') from None
        time.sleep(2**attempt)
    pcm,words=decode(events); duration=len(pcm)/(config['sample_rate']*2)
    output.mkdir(parents=True,exist_ok=True)
    with wave.open(str(output/'audition.wav'),'wb') as wav:
        wav.setparams((1,2,config['sample_rate'],0,'NONE','not compressed')); wav.writeframes(pcm)
    (output/'timestamps.raw.json').write_text(json.dumps(words,ensure_ascii=False,indent=2),encoding='utf-8')
    subs=captions(words,duration)
    (output/'captions.json').write_text(json.dumps(subs,ensure_ascii=False,indent=2),encoding='utf-8')
    status='ready-for-listening' if 30<=duration<=45 else 'duration-review-required'
    (output/'manifest.json').write_text(json.dumps({'hash':digest,'durationSeconds':duration,'status':status,'timestampSource':'provider','config':config},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'output':str(output),'durationSeconds':duration,'status':status,'words':len(subs)},ensure_ascii=False))

if __name__=='__main__':
    try: main()
    except Exception as exc:
        # Only controlled messages; never serialize requests, headers or raw server errors.
        print(str(exc) if isinstance(exc,ValueError) else 'Audition failed: '+type(exc).__name__)
        raise SystemExit(1)
