import type { AudioLines } from './types';

class AudioManager {
  private context: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentSources: AudioBufferSourceNode[] = [];
  private currentLoops: Map<string, AudioBufferSourceNode> = new Map();
  private lines: AudioLines | null = null;
  private currentResolve: ((text: string) => void) | null = null;
  private sharedAudioElement: HTMLAudioElement | null = null;
  private speechToken = 0;
  private finishCurrent: (() => void) | null = null;
  private sfxElements: Map<string, HTMLAudioElement> = new Map();

  async init() {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.loadAudioLines();
  }

  async unlock() {
    if (this.unlocked || !this.context) return;
    
    // Prime shared audio element for iOS (synchronously before any await)
    this.sharedAudioElement = new Audio();
    this.sharedAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    try {
      this.sharedAudioElement.play().catch(() => { /* priming only */ });
      this.sharedAudioElement.pause();
      this.sharedAudioElement.currentTime = 0;
    } catch (e) {
      console.log('Audio element priming (expected)');
    }
    
    // Resume context on user gesture (required for iOS)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    // Play silent buffer to unlock audio on iOS
    const buffer = this.context.createBuffer(1, 1, 22050);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);
    
    this.unlocked = true;
    console.log('Audio unlocked');
  }

  async loadAudioLines() {
    try {
      const response = await fetch('audio/lines.json');
      this.lines = await response.json();
    } catch (error) {
      console.error('Failed to load audio lines:', error);
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

  getText(lineId: string): string {
    if (!this.lines) return '';
    const line = this.lines[lineId];
    return line ? line.text : '';
  }

  private getLineDuration(lineId: string): number {
    const durations: Record<string, number> = {
      'narr-title': 13500,
      'narr-intro': 12500,
      'narr-fairy-arrives': 5500,
      'fairy-intro': 14000,
      'fairy-start': 6500,
      'fairy-found-1': 5500,
      'fairy-found-2': 5500,
      'fairy-found-3': 5500,
      'fairy-found-4': 5500,
      'fairy-found-5': 6000,
      'fairy-door-glow': 7500,
      'narr-unlock': 14500,
      'fairy-final': 9000,
      'curious-kitten': 4500,
      'curious-musicbox': 5500,
      'curious-chest': 4500,
      'curious-dragon': 4500,
      'curious-door-locked': 6500,
    };
    return durations[lineId] || 5000;
  }

  async playSpeech(lineId: string): Promise<string> {
    if (!this.lines) return '';
    
    const line = this.lines[lineId];
    if (!line) return '';

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
