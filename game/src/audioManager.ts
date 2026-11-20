import type { AudioLines } from './types';

class AudioManager {
  private context: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentSources: AudioBufferSourceNode[] = [];
  private currentLoops: Map<string, AudioBufferSourceNode> = new Map();
  private lines: AudioLines | null = null;
  private ch2Lines: AudioLines | null = null;
  private ch3Lines: AudioLines | null = null;
  private ch4Lines: AudioLines | null = null;
  private ch5Lines: AudioLines | null = null;
  private currentResolve: ((text: string) => void) | null = null;
  private sharedAudioElement: HTMLAudioElement | null = null;
  private speechToken = 0;
  private finishCurrent: (() => void) | null = null;
  private sfxElements: Map<string, HTMLAudioElement> = new Map();

  async init() {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.loadAudioLines();
    await this.loadCh2AudioLines();
    await this.loadCh3AudioLines();
    await this.loadCh4AudioLines();
    await this.loadCh5AudioLines();
  }

  async unlock() {
    if (!this.context) {
      await this.init();
    }
    if (!this.context) return;

    // Always (re)prime inside a user gesture for iOS — even if already unlocked
    if (!this.sharedAudioElement) {
      this.sharedAudioElement = new Audio();
      this.sharedAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    }
    try {
      this.sharedAudioElement.play().catch(() => { /* priming only */ });
      this.sharedAudioElement.pause();
      this.sharedAudioElement.currentTime = 0;
    } catch {
      /* expected on some browsers */
    }

    // Resume context on user gesture (required for iOS)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Play silent buffer to unlock Web Audio on iOS
    const buffer = this.context.createBuffer(1, 1, 22050);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);

    this.unlocked = true;
  }

  /** Ensure AudioContext is running (call before synth notes / playSequence). */
  async resumeContext(): Promise<void> {
    if (!this.context) {
      await this.init();
    }
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  getAudioContext(): AudioContext | null {
    return this.context;
  }

  async loadAudioLines() {
    try {
      const response = await fetch('audio/lines.json');
      this.lines = await response.json();
    } catch (error) {
      console.error('Failed to load audio lines:', error);
    }
  }

  async loadCh2AudioLines() {
    try {
      const response = await fetch('ch2/audio/lines.json');
      this.ch2Lines = await response.json();
    } catch (error) {
      console.error('Failed to load ch2 audio lines:', error);
    }
  }

  async loadCh3AudioLines() {
    try {
      const response = await fetch('ch3/audio/lines.json');
      this.ch3Lines = await response.json();
    } catch (error) {
      console.error('Failed to load ch3 audio lines:', error);
    }
  }

  async loadCh4AudioLines() {
    try {
      const response = await fetch('ch4/audio/lines.json');
      this.ch4Lines = await response.json();
    } catch (error) {
      console.error('Failed to load ch4 audio lines:', error);
    }
  }

  async loadCh5AudioLines() {
    try {
      const response = await fetch('ch5/audio/lines.json');
      this.ch5Lines = await response.json();
    } catch (error) {
      console.error('Failed to load ch5 audio lines:', error);
    }
  }

  async preloadAudio(urls: string[]): Promise<void> {
    if (!this.context) await this.init();
    if (!this.context) return;

    const promises = urls.map(async (url) => {
      if (this.audioBuffers.has(url)) return;
      
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(url, audioBuffer);
      } catch (error) {
        console.error(`Failed to load audio: ${url}`, error);
      }
    });

    await Promise.all(promises);
  }

  playSound(url: string, loop = false): void {
    if (!this.context || !this.unlocked || this.muted) return;
    
    const buffer = this.audioBuffers.get(url);
    if (!buffer) {
      console.warn(`Audio not preloaded: ${url}`);
      return;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.context.destination);
    source.start(0);
    
    if (loop) {
      this.currentLoops.set(url, source);
    } else {
      this.currentSources.push(source);
      source.onended = () => {
        const index = this.currentSources.indexOf(source);
        if (index > -1) this.currentSources.splice(index, 1);
      };
    }
  }

  stopLoop(url: string): void {
    const source = this.currentLoops.get(url);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.currentLoops.delete(url);
    }
  }

  async playSoundEffect(url: string): Promise<void> {
    if (this.muted) return;
    
    // Create or reuse audio element for this SFX
    let audio = this.sfxElements.get(url);
    if (!audio) {
      audio = new Audio(url);
      this.sfxElements.set(url, audio);
    }
    
    audio.volume = 1.0;
    audio.currentTime = 0;
    
    try {
      await audio.play();
      
      // Wait for audio to complete
      return new Promise((resolve) => {
        const onEnded = () => {
          audio!.removeEventListener('ended', onEnded);
          resolve();
        };
        audio!.addEventListener('ended', onEnded);
      });
    } catch (error) {
      console.error('Failed to play sound effect:', url, error);
    }
  }

  fadeOutSoundEffect(url: string, durationMs = 200): void {
    const audio = this.sfxElements.get(url);
    if (!audio || audio.paused) return;
    
    const startVolume = audio.volume;
    const startTime = Date.now();
    
    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      audio.volume = startVolume * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        audio.pause();
        audio.volume = 1.0;
      }
    };
    
    requestAnimationFrame(fade);
  }

  stopAllSounds(): void {
    this.currentSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.currentSources = [];
    
    this.currentLoops.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.currentLoops.clear();

    if (this.sharedAudioElement) {
      this.sharedAudioElement.pause();
    }
    
    if (this.finishCurrent) {
      this.finishCurrent();
    }
    
    this.speechToken++;
  }

  getText(lineId: string, chapter: 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' = 'ch1'): string {
    let lines = this.lines;
    if (chapter === 'ch2') lines = this.ch2Lines;
    else if (chapter === 'ch3') lines = this.ch3Lines;
    else if (chapter === 'ch4') lines = this.ch4Lines;
    else if (chapter === 'ch5') lines = this.ch5Lines;
    
    if (!lines) return '';
    const line = lines[lineId];
    return line ? line.text : '';
  }

  private getLineDuration(lineId: string): number {
    const durations: Record<string, number> = {
      // Chapter 1
      'narr-title': 13500,
      'narr-intro': 12500,
      'narr-fairy-arrives': 5500,
      'fairy-intro': 14000,
      'fairy-start': 6500,
      'fairy-found-1': 4500,
      'fairy-found-2': 4500,
      'fairy-found-3': 4500,
      'fairy-found-4': 4500,
      'fairy-found-5': 4500,
      'fairy-door-glow': 7500,
      'narr-unlock': 6500,
      'fairy-final': 6500,
      'curious-kitten': 4500,
      'curious-musicbox': 5500,
      'curious-chest': 4500,
      'curious-dragon': 4500,
      'curious-door-locked': 6500,
      // Chapter 3
      'fairy-good-1': 4000,
      'fairy-good-2': 4500,
      'fairy-good-3': 3500,
      'fairy-tryagain': 4500,
      'fairy-gem': 8000,
      'fairy-gem-got': 9000,
      'fairy-howto': 5000,
      // Chapter 4
      'count-1': 2000, 'count-2': 2000, 'count-3': 2000, 'count-4': 2000, 'count-5': 2000,
      'count-6': 2000, 'count-7': 2000, 'count-8': 2000, 'count-9': 2000, 'count-10': 2000,
      'fairy-ten': 5000,
      'fairy-animals': 7500,
      'fairy-match-owl': 5000,
      'fairy-match-rabbit': 3500,
      'fairy-match-deer': 4000,
      'fairy-wrong': 5500,
      'narr-cry': 8500,
      'fairy-light': 6500,
      'fairy-light-got': 6500,
      // Chapter 5
      'smudge-cry': 5000,
      'smudge-sorry': 10000,
      'smudge-happy': 7000,
      'smudge-ride': 4000,
      'fairy-crown': 6500,
      'fairy-place-petal': 2500,
      'fairy-place-gem': 3000,
      'fairy-place-light': 2500,
      'fairy-friends': 4500,
      'narr-rainbow': 7000,
      'narr-end': 10500,
    };
    return durations[lineId] || 5000;
  }

  async playSpeech(lineId: string, chapter: 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' = 'ch1'): Promise<string> {
    let lines = this.lines;
    if (chapter === 'ch2') lines = this.ch2Lines;
    else if (chapter === 'ch3') lines = this.ch3Lines;
    else if (chapter === 'ch4') lines = this.ch4Lines;
    else if (chapter === 'ch5') lines = this.ch5Lines;
    
    if (!lines) return '';
    
    const line = lines[lineId];
    if (!line) {
      console.warn(`Audio line not found: ${lineId} in ${chapter}`);
      return '';
    }

    // Finish any current speech
    if (this.finishCurrent) {
      this.finishCurrent();
    }

    if (this.muted) return line.text;

    // Use shared audio element (iOS-compatible)
    const audio = this.sharedAudioElement || new Audio();
    const token = ++this.speechToken;
    
    audio.pause();
    audio.src = line.file;
    
    let timeoutId: number | null = null;
    
    // Return promise that resolves when speech ends
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      
      const finish = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (this.finishCurrent === finish) {
          this.finishCurrent = null;
        }
        if (this.currentResolve === resolve) {
          this.currentResolve = null;
        }
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('playing', onLoaded);
        resolve(line.text);
      };
      
      this.finishCurrent = finish;
      
      const onEnded = () => {
        if (token === this.speechToken) {
          finish();
        }
      };
      
      const onError = (error: Event) => {
        console.error('Failed to play speech:', lineId, error);
        if (token === this.speechToken) {
          finish();
        }
      };

      // Safety timeout, (re)armed whenever playback actually starts, so slow
      // loading never cuts the end of a line. Falls back to a fixed cap.
      const arm = (ms: number) => {
        if (timeoutId !== null) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          if (token === this.speechToken) {
            audio.pause();
            finish();
          }
        }, ms);
      };
      const onLoaded = () => {
        const d = audio.duration > 0 ? audio.duration : this.getLineDuration(lineId) / 1000;
        arm(Math.max(0, d - audio.currentTime) * 1000 + 1500);
      };
      arm(this.getLineDuration(lineId) + 8000);
      
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('playing', onLoaded);
      
      audio.play().catch(() => finish());
    });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopAllSounds();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const audioManager = new AudioManager();
