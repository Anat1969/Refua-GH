"""Narration for demo.cjs via Gemini TTS (through the musicprompt-tts edge function of the portfolio project).
Copy over the recorder's tts.py. The token is NOT in the repo: export MP_TTS_TOKEN (it is in the function source).
The free quota is about three requests a minute and a small number a day: this script spaces calls, retries after 429,
and caches every line by text, so a second recording asks for nothing. Eleven lines take about ten minutes.
usage: python3 -I tts.py <voice> <out.mp3> <text> [rate]   (same interface as the Edge tts.py)"""
import base64, json, subprocess, sys, time, urllib.request, urllib.error, os, ssl, hashlib, shutil
URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co/functions/v1/musicprompt-tts'
STYLE = 'קראי בעברית, בהתלהבות אמיתית ובקול חם וחי, כמו קריינית של סרט תדמית קצר שמתרגשת ממה שהיא מספרת. קצב שיחה זורם, חיוך בקול, בלי הטעמה מוגזמת:'
CACHE = '/tmp/claude-0/tts-cache'
LAST = '/tmp/claude-0/tts-last-call'
os.makedirs(CACHE, exist_ok=True)


def pace(gap=22):
    """The free Gemini TTS quota is about three requests a minute: leave a gap between calls."""
    try: last = float(open(LAST).read())
    except Exception: last = 0
    wait = last + gap - time.time()
    if wait > 0: time.sleep(wait)
    open(LAST, 'w').write(str(time.time()))


def main(voice, out, text, rate='+0%'):
    key = hashlib.sha1((voice + STYLE + text).encode()).hexdigest()
    cached = os.path.join(CACHE, key + '.mp3')
    if os.path.exists(cached) and os.path.getsize(cached) > 1000:
        shutil.copy(cached, out); return
    ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt') if os.path.exists('/root/.ccr/ca-bundle.crt') else None
    last = ''
    for attempt in range(8):
        try:
            pace()
            req = urllib.request.Request(URL, data=json.dumps({'token': os.environ.get('MP_TTS_TOKEN', ''), 'text': text, 'voice': voice, 'style': STYLE}).encode(), headers={'Content-Type': 'application/json'})
            j = json.loads(urllib.request.urlopen(req, timeout=120, context=ctx).read())
            pcm = base64.b64decode(j['audio'])
            sr = '24000'
            for part in j.get('mime', '').split(';'):
                if 'rate=' in part: sr = part.split('=')[1]
            p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', sr, '-ac', '1', '-i', 'pipe:0', '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-b:a', '128k', out], input=pcm)
            if p.returncode == 0 and os.path.getsize(out) > 1000:
                shutil.copy(out, cached); return
            last = 'ffmpeg failed'
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code}'
            time.sleep(40 if e.code in (429, 502, 503) else 5)  # over the quota: wait out the minute
        except Exception as e:
            last = str(e)
            time.sleep(5)
    sys.exit('tts failed: ' + last)
if __name__ == '__main__': main(*sys.argv[1:5])
