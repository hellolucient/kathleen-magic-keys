import { useState, useEffect, useRef } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import './Chapter3Scene.css';

interface Chapter3SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

const LILY_COLORS = ['red', 'yellow', 'blue', 'pink', 'white'];
const LILY_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00]; // C, D, E, G, A

// Round sequences — easier: 2, 3, 3 notes
const SEQUENCES = [
  [0, 2],          // Round 1: 2 notes (red, blue)
  [1, 3, 0],       // Round 2: 3 notes (yellow, pink, red)
  [2, 4, 1],       // Round 3: 3 notes (blue, white, yellow)
];

function Chapter3Scene({ progress, setProgress, onComplete }: Chapter3SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'waiting' | 'complete'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [frogState, setFrogState] = useState<'closed' | 'singing' | 'happy'>('closed');
  const [glowingPad, setGlowingPad] = useState(-1);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gemRevealed, setGemRevealed] = useState(false);
  const [gemCollected, setGemCollected] = useState(false);
  const [musicNoteVisible, setMusicNoteVisible] = useState(false);
  
  const progressRef = useRef(progress);
  const lastInteractionRef = useRef<number>(Date.now());
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    // Reset chapter state on mount
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

  const startIntro = async () => {
    if (introRunningRef.current) return;
    introRunningRef.current = true;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await audioManager.playSpeech('narr-title', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('narr-intro', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-intro', 'ch3'));
    await audioManager.playSpeech('fairy-intro', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setFairyText(audioManager.getText('fairy-howto', 'ch3'));
    await audioManager.playSpeech('fairy-howto', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    introRunningRef.current = false;
    startRound(0);
  };

  const startRound = (round: number) => {
    setCurrentRound(round);
    const seq = SEQUENCES[round];
    setCurrentSequence(seq);
    setPlayerSequence([]);
    setWrongAttempts(0);
    setShowHint(false);
    playSequence(seq);
  };

  const playSequence = async (sequence: number[], hintPad = -1) => {
    setPhase('playing');
    setFrogState('singing');

    // Resume AudioContext before every sequence (iOS may suspend between gestures)
    await audioManager.resumeContext();
    ensureNoteContext();

    for (let i = 0; i < sequence.length; i++) {
      const padIndex = sequence[i];
      setGlowingPad(padIndex);
      // After a wrong try, pulse the next correct pad as a hint on replay
      if (hintPad >= 0 && padIndex === hintPad) {
        setShowHint(true);
      }
      playNote(padIndex);
      await new Promise(resolve => setTimeout(resolve, 700));
      setGlowingPad(-1);
      setShowHint(false);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setFrogState('closed');
    setPhase('waiting');
    lastInteractionRef.current = Date.now();
    startIdleHint();
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

  const startIdleHint = () => {
    const checkIdle = () => {
      if (Date.now() - lastInteractionRef.current > 12000 && !showHint && phase === 'waiting') {
        setShowHint(true);
      }
    };
    const timer = setTimeout(checkIdle, 12000);
    return () => clearTimeout(timer);
  };

  const playNote = (padIndex: number) => {
    if (muted) return;

    ensureNoteContext();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Fire-and-forget resume if suspended mid-gesture
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

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
    
    setGlowingPad(padIndex);
    playNote(padIndex);
    await new Promise(resolve => setTimeout(resolve, 300));
    setGlowingPad(-1);
    
    const newPlayerSeq = [...playerSequence, padIndex];
    setPlayerSequence(newPlayerSeq);
    
    // Check if correct
    const currentIndex = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentIndex] !== currentSequence[currentIndex]) {
      // Wrong tap
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');
      setWrongAttempts(prev => prev + 1);
      
      setFairyText(audioManager.getText('fairy-tryagain', 'ch3'));
      await audioManager.playSpeech('fairy-tryagain', 'ch3');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');
      
      // Replay sequence with next correct pad pulsing as a hint
      setPlayerSequence([]);
      const nextCorrect = currentSequence[0];
      playSequence(currentSequence, nextCorrect);
      return;
    }
    
    // Correct so far
    if (newPlayerSeq.length === currentSequence.length) {
      // Round complete!
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      setFrogState('happy');
      
      const praiseLine = `fairy-good-${currentRound + 1}`;
      setFairyText(audioManager.getText(praiseLine, 'ch3'));
      await audioManager.playSpeech(praiseLine, 'ch3');
      await new Promise(resolve => setTimeout(resolve, 500));
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
        // Next round
        await new Promise(resolve => setTimeout(resolve, 1000));
        startRound(currentRound + 1);
      } else {
        // All rounds complete!
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
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMusicNoteVisible(false);
    
    // Reveal gem
    setGemRevealed(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-gem', 'ch3'));
    await audioManager.playSpeech('fairy-gem', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    // Auto-collect after 25s
    setTimeout(() => {
      if (!gemCollected) {
        collectGem();
      }
    }, 25000);
  };

  const collectGem = async () => {
    if (gemCollected) return;
    
    setGemCollected(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    setProgress(p => ({
      ...p,
      treasures: { ...p.treasures, gem: true },
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFairyText(audioManager.getText('fairy-gem-got', 'ch3'));
    await audioManager.playSpeech('fairy-gem-got', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFairyText('');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('narr-complete', 'ch3');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onComplete();
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  return (
    <div className="game-scene chapter3-scene">
      <div className="game-container">
        <img src="ch3/art/raw/bg-river.jpg" alt="Sparkling river" className="game-bg" />
        
        {/* Lily pads - floating in the open water */}
        <div className="lily-pads">
          {LILY_COLORS.map((color, index) => (
            <div
              key={color}
              className={`lily-pad lily-pad-${index} ${glowingPad === index ? 'glowing bounce' : ''} ${
                phase === 'waiting' && !gemRevealed ? 'clickable' : ''
              } ${showHint && wrongAttempts >= 2 && playerSequence.length < currentSequence.length && currentSequence[playerSequence.length] === index ? 'hint-glow' : ''}`}
              onClick={() => handlePadTap(index)}
              onTouchStart={(e) => { e.preventDefault(); handlePadTap(index); }}
            >
              <img src={`ch3/art/sprites/lily-pad-${color}.png`} alt={`${color} lily pad`} />
            </div>
          ))}
        </div>
        
        {/* Three frogs on the near bank */}
        <div className="frog-group">
          <div className="frog frog-1">
            <img 
              src={`ch3/art/sprites/frog-${frogState === 'singing' ? 'singing' : frogState === 'happy' ? 'happy' : 'closed'}.png`}
              alt="Frog" 
            />
          </div>
          <div className="frog frog-2">
            <img 
              src={`ch3/art/sprites/frog-${frogState === 'singing' ? 'singing' : frogState === 'happy' ? 'happy' : 'closed'}.png`}
              alt="Frog" 
            />
          </div>
          <div className="frog frog-3">
            <img 
              src={`ch3/art/sprites/frog-${frogState === 'singing' ? 'singing' : frogState === 'happy' ? 'happy' : 'closed'}.png`}
              alt="Frog" 
            />
          </div>
        </div>
        
        {/* Music notes when complete */}
        {musicNoteVisible && (
          <div className="music-notes sparkle-burst">
            <img src="ch3/art/sprites/music-note.png" alt="Music" />
          </div>
        )}
        
        {/* Purple gem */}
        {gemRevealed && !gemCollected && (
          <div
            className="purple-gem fade-in sparkle clickable"
            onClick={collectGem}
            onTouchStart={(e) => { e.preventDefault(); collectGem(); }}
          >
            <img src="ch3/art/sprites/purple-gem.png" alt="Purple Dragon Gem" />
          </div>
        )}
        
        {/* Pip the fairy */}
        <div className="sprite fairy float">
          <img src="ch3/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
        </div>
        
        {/* Speech bubble */}
        {fairyText && (
          <div className="speech-bubble">
            {fairyText}
          </div>
        )}
        
        {/* Treasure bar with slots */}
        <div className="treasure-bar">
          <div className={`treasure-slot ${progress.treasures.petal ? 'filled' : 'empty'}`}>
            {progress.treasures.petal && <img src="ch3/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />}
          </div>
          <div className={`treasure-slot ${progress.treasures.gem ? 'filled' : 'empty'}`}>
            {progress.treasures.gem && <img src="ch3/art/sprites/purple-gem.png" alt="Purple Gem" />}
          </div>
          <div className="treasure-slot empty">
            {/* Firefly light slot - not yet collected */}
          </div>
        </div>
        
        {/* Round counter */}
        <div className="round-counter">
          Round {currentRound + 1} / 3
        </div>
        
        {/* Mute button */}
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
