import numpy as np, subprocess, wave
SR=44100
def bell(f,d,amp=0.5,decay=3.0):
    t=np.arange(int(SR*d))/SR
    s=sum(a*np.sin(2*np.pi*f*m*t)*np.exp(-decay*m**0.5*t) for m,a in [(1,1),(2.0,.45),(3.01,.25),(4.2,.12),(5.4,.06)])
    s*=np.minimum(1,t/0.004); return amp*s
def mix(parts,total):
    out=np.zeros(int(SR*total))
    for st,s in parts:
        i=int(st*SR); n=min(len(s),len(out)-i); out[i:i+n]+=s[:n]
    return out
def save(name,x,loop=False):
    x=x/ (np.abs(x).max()+1e-9)*0.85
    pcm=(x*32767).astype(np.int16)
    with wave.open(f'/tmp/{name}.wav','wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'/tmp/{name}.wav','-b:a','128k',f'{name}.mp3'],check=True)
n=lambda k:440*2**((k-69)/12)
rng=np.random.default_rng(3)
# sparkle chime: fast rising high bell run with shimmer
parts=[(i*0.055,bell(n(84+[0,4,7,11,12,16,19,24][i]),1.2,0.4,4)) for i in range(8)]
parts+= [(0.05+rng.random()*0.6,bell(n(rng.integers(96,104)),0.4,0.12,9)) for _ in range(14)]
save('sparkle',mix(parts,1.6))
# key found ding: bright two-note bell
save('key-found',mix([(0,bell(n(88),1.6,0.6,2.5)),(0.12,bell(n(95),1.8,0.6,2.2)),(0.12,bell(n(100),1.5,0.2,4))],2.0))
# tap / pop soft
t=np.arange(int(SR*.18))/SR; pop=np.sin(2*np.pi*(500+900*np.exp(-30*t))*t)*np.exp(-22*t); save('tap-pop',pop)
# wiggle boing
t=np.arange(int(SR*.5))/SR; f=300+120*np.sin(2*np.pi*9*t)*np.exp(-4*t); ph=2*np.pi*np.cumsum(f)/SR; save('wiggle-boing',np.sin(ph)*np.exp(-5*t)*np.minimum(1,t/0.01))
# curtain swish: filtered noise sweep
t=np.arange(int(SR*.8))/SR; nz=rng.standard_normal(len(t)); 
from numpy.fft import rfft,irfft
env=np.sin(np.pi*t/t[-1])**2
k=np.ones(40)/40; sw=np.convolve(nz,k,'same')*env; save('curtain-swish',sw)
# lid open / click
save('lid-click',mix([(0,bell(n(76),0.25,0.5,25)),(0.07,bell(n(83),0.3,0.4,20))],0.45))
# lock click (for each key going in)
t=np.arange(int(SR*.12))/SR; clk=rng.standard_normal(len(t))*np.exp(-60*t)+0.6*np.sin(2*np.pi*1800*t)*np.exp(-40*t)
save('lock-click',mix([(0,clk),(0.05,bell(n(91),0.5,0.35,6))],0.6))
# door magic open: low swell + rising shimmer glissando
t=np.arange(int(SR*3.0))/SR
swell=sum(np.sin(2*np.pi*n(k)*t) for k in (48,55,60,64))*np.minimum(1,t/1.2)*np.exp(-0.6*np.maximum(0,t-1.4))
gl=[(0.6+i*0.07,bell(n(72+[0,2,4,7,9,12,14,16,19,21,24,26,28,31][i]),1.0,0.35,4)) for i in range(14)]
save('door-open-magic',mix([(0,0.25*swell)]+gl,3.2))
# door glow hum (loopable 2s)
t=np.arange(int(SR*2.0))/SR; hum=sum(np.sin(2*np.pi*n(k)*t+0.5*np.sin(2*np.pi*0.5*t)) for k in (72,76,79))*(0.7+0.3*np.sin(2*np.pi*0.5*t)); save('door-glow-loop',hum)
# fanfare: bell arpeggio + chord
mel=[(0,67),(0.15,72),(0.3,76),(0.45,79),(0.7,84)]
p=[(st,bell(n(k),1.8,0.5,2)) for st,k in mel]+[(0.95,bell(n(k),2.5,0.35,1.2)) for k in (72,76,79,84,88)]
p+=[(1.0+rng.random()*1.2,bell(n(rng.integers(91,103)),0.4,0.1,8)) for _ in range(20)]
save('celebration-fanfare',mix(p,3.6))
# star tap notes (3 ascending) + wrong (soft)
for i,k in enumerate((81,85,88),1): save(f'star-{i}',bell(n(k),1.2,0.5,3))
save('star-reset',mix([(0,bell(n(79),0.6,0.4,5)),(0.12,bell(n(76),0.8,0.4,5))],1.0))
# music box loop: Twinkle Twinkle (public domain melody), music-box timbre, 0.42s/beat
tw=[60,60,67,67,69,69,67,None,65,65,64,64,62,62,60,None,67,67,65,65,64,64,62,None,67,67,65,65,64,64,62,None,60,60,67,67,69,69,67,None,65,65,64,64,62,62,60,None]
b=0.42; parts=[]
for i,k in enumerate(tw):
    if k: parts.append((i*b,bell(n(k+12),1.6,0.45,3.2)))
    if i%4==0: parts.append((i*b,bell(n([48,53,48,55][(i//4)%4]+12),1.6,0.18,3)))
L=len(tw)*b; x=mix(parts,L+1.6); tail=x[int(L*SR):]; x=x[:int(L*SR)]; x[:len(tail)]+=tail  # wrap tail for seamless loop
save('music-box-loop',x)
print('ok')
