import { useState, useEffect, useRef } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import TreasureBar from './TreasureBar';
import './Chapter3Scene.css';

interface Chapter3SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

const LILY_COLORS = ['red', 'yellow', 'blue', 'pink', 'white'];
const LILY_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00]; // C, D, E, G, A

// Easier rounds: 2, 3, 3 notes
const SEQUENCES = [
  [0, 2],
  [1, 3, 0],
  [2, 4, 1],
];

function Chapter3Scene({ progress, setProgress, onComplete }: Chapter3SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [narratorSpeaking, setNarratorSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'waiting' | 'complete'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [frogState, setFrogState] = useState<'closed' | 'singing' | 'happy'>('closed');
  const [glowingPad, setGlowingPad] = useState(-1);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintPad, setHintPad] = useState(-1);
  const [gemRevealed, setGemRevealed] = useState(false);
  const [gemCollected, setGemCollected] = useState(false);
  const [musicNoteVisible, setMusicNoteVisible] = useState(false);
  const [pathTappable, setPathTappable] = useState(false);

  const progressRef = useRef(progress);
  const lastInteractionRef = useRef<number>(Date.now());
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pathResolveRef = useRef<(() => void) | null>(null);
  const treasureExplainedRef = useRef(false);
  const collectingRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(prev => ({
      ...prev,
      chapter3: { round: 0, completedRounds: [] },
    }));

    startIntro();

    return () => {
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const showCaption = async (lineId: string, isNarrator = false) => {
    const text = audioManager.getText(lineId, 'ch3');
    setNarratorSpeaking(isNarrator);
    setFairyText(text);
    await audioManager.playSpeech(lineId, 'ch3');
  };

  const startIntro = async () => {
    if (introRunningRef.current) return;
    introRunningRef.current = true;

    await new Promise(resolve => setTimeout(resolve, 500));
    await showCaption('narr-title', true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showCaption('narr-intro', true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showCaption('fairy-intro');
    await new Promise(resolve => setTimeout(resolve, 300));

    await showCaption('fairy-howto');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    introRunningRef.current = false;
    startRound(0);
  };

  const ensureNoteContext = () => {
    const shared = audioManager.getAudioContext();
    if (shared) {
      audioContextRef.current = shared;
      return;
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const startRound = (round: number) => {
    setCurrentRound(round);
    const seq = SEQUENCES[round];
    setCurrentSequence(seq);
    setPlayerSequence([]);
    setWrongAttempts(0);
    setShowHint(false);
    setHintPad(-1);
    playSequence(seq);
  };

  const playSequence = async (sequence: number[], pulseHint = -1) => {
    setPhase('playing');
    setFrogState('singing');

    await audioManager.resumeContext();
    ensureNoteContext();

    for (let i = 0; i < sequence.length; i++) {
      const padIndex = sequence[i];
      setGlowingPad(padIndex);
      if (pulseHint >= 0 && padIndex === pulseHint) {
        setHintPad(padIndex);
        setShowHint(true);
      }
      playNote(padIndex);
      await new Promise(resolve => setTimeout(resolve, 700));
      setGlowingPad(-1);
      setShowHint(false);
      setHintPad(-1);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setFrogState('closed');
    setPhase('waiting');
    lastInteractionRef.current = Date.now();
    startIdleHint();
  };

  const startIdleHint = () => {
    const checkIdle = () => {
      if (Date.now() - lastInteractionRef.current > 12000 && !showHint && phase === 'waiting') {
        setShowHint(true);
        if (currentSequence.length > playerSequence.length) {
          setHintPad(currentSequence[playerSequence.length]);
        }
      }
    };
    setTimeout(checkIdle, 12000);
  };

  const playNote = (padIndex: number) => {
    if (muted) return;
    ensureNoteContext();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = LILY_NOTES[padIndex];
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const handlePadTap = async (padIndex: number) => {
    if (phase !== 'waiting') return;

    lastInteractionRef.current = Date.now();
    setShowHint(false);
    setHintPad(-1);

    setGlowingPad(padIndex);
    playNote(padIndex);
    await new Promise(resolve => setTimeout(resolve, 300));
    setGlowingPad(-1);

    const newPlayerSeq = [...playerSequence, padIndex];
    setPlayerSequence(newPlayerSeq);

    const currentIndex = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentIndex] !== currentSequence[currentIndex]) {
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');
      setWrongAttempts(prev => prev + 1);

      await showCaption('fairy-tryagain');
      await new Promise(resolve => setTimeout(resolve, 400));
      setFairyText('');

      setPlayerSequence([]);
      // Replay with next correct pad pulsing as hint
      playSequence(currentSequence, currentSequence[0]);
      return;
    }

    if (newPlayerSeq.length === currentSequence.length) {
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      setFrogState('happy');

      const praiseLine = `fairy-good-${currentRound + 1}`;
      await showCaption(praiseLine);
      await new Promise(resolve => setTimeout(resolve, 400));
      setFairyText('');
      setFrogState('closed');

      setProgress(prev => ({
        ...prev,
        chapter3: {
          ...prev.chapter3,
          completedRounds: [...prev.chapter3.completedRounds, currentRound],
        },
      }));

      if (currentRound < 2) {
        await new Promise(resolve => setTimeout(resolve, 800));
        startRound(currentRound + 1);
      } else {
        await completeGame();
      }
    }
  };

  const completeGame = async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    setPhase('complete');
    setFrogState('happy');
    setMusicNoteVisible(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    await new Promise(resolve => setTimeout(resolve, 1200));
    setMusicNoteVisible(false);

    setGemRevealed(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    await showCaption('fairy-gem');
    await new Promise(resolve => setTimeout(resolve, 400));
    // Keep caption until collected; don't clear so child sees the prompt

    setTimeout(() => {
      if (!gemCollected && !collectingRef.current) {
        void collectGem();
      }
    }, 25000);
  };

  const collectGem = async () => {
    if (gemCollected || collectingRef.current) return;
    collectingRef.current = true;

    setGemCollected(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    setProgress(p => ({
      ...p,
      treasures: { ...p.treasures, gem: true },
    }));

    await new Promise(resolve => setTimeout(resolve, 600));

    // One Pip line only — no narrator repeat of the same idea
    if (!treasureExplainedRef.current) {
      treasureExplainedRef.current = true;
      await showCaption('fairy-treasure-gem');
    } else {
      await showCaption('fairy-gem-got');
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    // End action: tap the glowing path → next chapter
    setPathTappable(true);
    await showCaption('fairy-follow-path');
    const tapped = new Promise<void>(resolve => { pathResolveRef.current = resolve; });
    await Promise.race([tapped, new Promise(resolve => setTimeout(resolve, 30000))]);
    pathResolveRef.current = null;
    setFairyText('');
    setPathTappable(false);
    onComplete();
  };

  const toggleMute = () => {
    setMuted(audioManager.toggleMute());
  };

  return (
    <div className="game-scene chapter3-scene" style={{ touchAction: 'none' }}>
      <div className="game-container">
        <img src="ch3/art/raw/bg-river.jpg" alt="Sparkling river" className="game-bg" />

        <div className="lily-pads">
          {LILY_COLORS.map((color, index) => (
            <div
              key={color}
              className={`lily-pad lily-pad-${index} ${glowingPad === index ? 'glowing bounce' : ''} ${
                phase === 'waiting' && !gemRevealed ? 'clickable' : ''
              } ${(showHint || hintPad === index) && (hintPad === index || (wrongAttempts >= 1 && currentSequence[playerSequence.length] === index)) ? 'hint-glow' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault();
                void handlePadTap(index);
              }}
              style={{ touchAction: 'none' }}
            >
              <img src={`ch3/art/sprites/lily-pad-${color}.png`} alt={`${color} lily pad`} />
            </div>
          ))}
        </div>

        <div className="frog-group">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`frog frog-${n}`}>
              <img
                src={`ch3/art/sprites/frog-${frogState === 'singing' ? 'singing' : frogState === 'happy' ? 'happy' : 'closed'}.png`}
                alt="Frog"
              />
            </div>
          ))}
        </div>

        {musicNoteVisible && (
          <div className="music-notes sparkle-burst">
            <img src="ch3/art/sprites/music-note.png" alt="Music" />
          </div>
        )}

        {/* Gem floats IN the river under the bridge — ~5% wide, soft glow + bob */}
        {gemRevealed && !gemCollected && (
          <div
            className="purple-gem in-river fade-in sparkle clickable"
            onPointerDown={(e) => {
              e.preventDefault();
              void collectGem();
            }}
            style={{ touchAction: 'none' }}
          >
            <img src="ch3/art/sprites/purple-gem.png" alt="Purple Dragon Gem" />
          </div>
        )}

        {pathTappable && (
          <div
            className="ch3-path-continue clickable"
            onPointerDown={(e) => {
              e.preventDefault();
              pathResolveRef.current?.();
            }}
            style={{ touchAction: 'none' }}
          />
        )}

        <div className="sprite fairy float">
          <img src="ch3/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
        </div>

        {fairyText && (
          <div className={`speech-bubble ${narratorSpeaking ? 'narrator' : ''}`}>
            {fairyText}
          </div>
        )}

        <TreasureBar treasures={progress.treasures} spriteBase="ch3/art/sprites" />

        <div className="round-counter">
          Round {currentRound + 1} / 3
        </div>

        <button
          className="mute-button"
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}

export default Chapter3Scene;
