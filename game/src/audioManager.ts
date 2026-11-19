import type { AudioLines } from './types';

class AudioManager {
  private context: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentSources: AudioBufferSourceNode[] = [];
  private currentLoops: Map<string, AudioBufferSourceNode> = new Map();
  private lines: AudioLines | null = null;
  private currentSpeech: HTMLAudioElement | null = null;

  async init() {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.loadAudioLines();
  }

  async unlock() {
    if (this.unlocked || !this.context) return;
    
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
      const response = await fetch('/audio/lines.json');
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

    if (this.currentSpeech) {
      this.currentSpeech.pause();
      this.currentSpeech = null;
    }
  }

  async playSpeech(lineId: string, onComplete?: () => void): Promise<string> {
    if (!this.lines || this.muted) return '';
    
    const line = this.lines[lineId];
    if (!line) return '';

    // Stop any current speech
    if (this.currentSpeech) {
      this.currentSpeech.pause();
    }

    // Use HTML5 Audio for speech (easier to manage and doesn't need preload)
    const audio = new Audio(line.file);
    this.currentSpeech = audio;
    
    audio.addEventListener('ended', () => {
      if (this.currentSpeech === audio) {
        this.currentSpeech = null;
      }
      if (onComplete) onComplete();
    });

    try {
      await audio.play();
    } catch (error) {
      console.error('Failed to play speech:', error);
    }

    return line.text;
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
