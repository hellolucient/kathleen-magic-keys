import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import { clientToPercent, hitTestRect, startPointerDrag } from '../pointerDrag';
import './Chapter4Scene.css';

interface Chapter4SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

interface FireflyPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const ANIMALS = ['owl', 'rabbit', 'deer'];
const BABIES = ['owlet', 'bunny', 'fawn'];

function Chapter4Scene({ progress, setProgress, onComplete }: Chapter4SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'fireflies' | 'animals' | 'crying' | 'complete'>('intro');
  const [fireflies, setFireflies] = useState<FireflyPosition[]>([]);
  const [firefliesCaught, setFirefliesCaught] = useState(0);
  const [darkness, setDarkness] = useState(0.6);
  const [babyPositions, setBabyPositions] = useState<string[]>([]);
  const [draggingBaby, setDraggingBaby] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [matchedAnimals, setMatchedAnimals] = useState<string[]>([]);
  const [lightRevealed, setLightRevealed] = useState(false);
  const [lightCollected, setLightCollected] = useState(false);
  const [caveGlowing, setCaveGlowing] = useState(false);
  const [showNumber, setShowNumber] = useState('');
  
  const progressRef = useRef(progress);
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const introRunningRef = useRef(false);
  const matchingRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    // Reset chapter state
    setProgress(prev => ({
      ...prev,
      chapter4: { firefliesCaught: 0, matchedAnimals: [] },
    }));
    
    startIntro();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (phase === 'fireflies' && fireflies.length > 0) {
      animateFireflies();
    }
  }, [phase, fireflies]);

  const startIntro = async () => {
    if (introRunningRef.current) return;
    introRunningRef.current = true;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await audioManager.playSpeech('narr-title', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('narr-intro', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-intro', 'ch4'));
    await audioManager.playSpeech('fairy-intro', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    introRunningRef.current = false;
    startFireflyPhase();
  };

  const startFireflyPhase = () => {
    setPhase('fireflies');
    
    // Create 10 fireflies at random positions spread across the clearing
    const newFireflies: FireflyPosition[] = [];
    for (let i = 0; i < 10; i++) {
      newFireflies.push({
        x: Math.random() * 70 + 15,  // x: 15-85%
        y: Math.random() * 50 + 25,  // y: 25-75%
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      });
    }
    setFireflies(newFireflies);
  };

  const animateFireflies = () => {
    setFireflies(prev => {
      return prev.map(ff => {
        let newX = ff.x + ff.vx;
        let newY = ff.y + ff.vy;
        let newVx = ff.vx;
        let newVy = ff.vy;
        
        // Bounce off edges
        if (newX < 5 || newX > 90) {
          newVx = -newVx;
          newX = Math.max(5, Math.min(90, newX));
        }
        if (newY < 15 || newY > 75) {
          newVy = -newVy;
          newY = Math.max(15, Math.min(75, newY));
        }
        
        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    });
    
    animationFrameRef.current = requestAnimationFrame(animateFireflies);
  };

  const catchFirefly = async (index: number) => {
    if (phase !== 'fireflies') return;
    
    const newFireflies = fireflies.filter((_, i) => i !== index);
    setFireflies(newFireflies);
    
    const newCount = firefliesCaught + 1;
    setFirefliesCaught(newCount);
    
    // Play chime and speak number
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setShowNumber(`${newCount}`);
    await audioManager.playSpeech(`count-${newCount}`, 'ch4');
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowNumber('');
    
    // Lighten scene
    const newDarkness = Math.max(0, 0.6 - (newCount * 0.06));
    setDarkness(newDarkness);
    
    setProgress(prev => ({
      ...prev,
      chapter4: { ...prev.chapter4, firefliesCaught: newCount },
    }));
    
    if (newCount === 10) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFairyText(audioManager.getText('fairy-ten', 'ch4'));
      await audioManager.playSpeech('fairy-ten', 'ch4');
      await new Promise(resolve => setTimeout(resolve, 800));
      setFairyText('');
      
      startAnimalPhase();
    }
  };

  const startAnimalPhase = async () => {
    setPhase('animals');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Shuffle babies
    const shuffled = [...BABIES].sort(() => Math.random() - 0.5);
    setBabyPositions(shuffled);
    
    setFairyText(audioManager.getText('fairy-animals', 'ch4'));
    await audioManager.playSpeech('fairy-animals', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
  };

  const finishBabyDrop = async (baby: string, clientX: number, clientY: number) => {
    if (matchingRef.current) return;
    matchingRef.current = true;

    const babyIndex = BABIES.indexOf(baby);
    const parent = ANIMALS[babyIndex];
    const parentEl = parentRefs.current[parent];
    const isMatch = hitTestRect(parentEl ?? null, clientX, clientY, 50);

    setDraggingBaby(null);

    if (isMatch) {
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      audioManager.playSound('audio/sfx/sparkle.mp3');

      const newMatched = [...matchedAnimals, baby];
      setMatchedAnimals(newMatched);

      setProgress(prev => ({
        ...prev,
        chapter4: { ...prev.chapter4, matchedAnimals: newMatched },
      }));

      const matchLine = `fairy-match-${parent}`;
      setFairyText(audioManager.getText(matchLine, 'ch4'));
      await audioManager.playSpeech(matchLine, 'ch4');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');

      if (newMatched.length === 3) {
        await completeanimalPhase();
      }
    } else {
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');

      setFairyText(audioManager.getText('fairy-wrong', 'ch4'));
      await audioManager.playSpeech('fairy-wrong', 'ch4');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');
    }

    matchingRef.current = false;
  };

  const handleBabyPointerDown = (e: ReactPointerEvent, baby: string) => {
    if (matchedAnimals.includes(baby) || matchingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const pct = clientToPercent(container, e.clientX, e.clientY);
    setDraggingBaby(baby);
    setDragPosition(pct);
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');

    startPointerDrag(e, {
      onMove: (cx, cy) => {
        setDragPosition(clientToPercent(container, cx, cy));
      },
      onEnd: (cx, cy) => {
        void finishBabyDrop(baby, cx, cy);
      },
    });
  };

  const completeanimalPhase = async () => {
    setPhase('crying');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCaveGlowing(true);
    await audioManager.playSpeech('narr-cry', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCaveGlowing(false);
    setLightRevealed(true);
    
    setFairyText(audioManager.getText('fairy-light', 'ch4'));
    await audioManager.playSpeech('fairy-light', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    // Auto-collect after 25s
    setTimeout(() => {
      if (!lightCollected) {
        collectLight();
      }
    }, 25000);
  };

  const collectLight = async () => {
    if (lightCollected) return;
    
    setLightCollected(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    setProgress(p => ({
      ...p,
      treasures: { ...p.treasures, light: true },
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFairyText(audioManager.getText('fairy-light-got', 'ch4'));
    await audioManager.playSpeech('fairy-light-got', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFairyText('');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('narr-complete', 'ch4');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onComplete();
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  // Natural spots for mums around the forest
  const PARENT_SPOTS: Record<string, { left: string; top: string }> = {
    owl: { left: '8%', top: '58%' },      // left by tree roots
    rabbit: { left: '42%', top: '62%' },  // middle by the path
    deer: { left: '72%', top: '55%' },    // right by mushrooms
  };

  const BABY_HIDE_SPOTS = [
    { left: '18%', top: '38%' },
    { left: '55%', top: '42%' },
    { left: '78%', top: '35%' },
  ];

  return (
    <div 
      className="game-scene chapter4-scene"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img src="ch4/art/raw/bg-forest.jpg" alt="Twinkle Forest" className="game-bg" />
        
        {/* Darkness overlay */}
        <div 
          className="darkness-overlay" 
          style={{ opacity: darkness, transition: 'opacity 0.5s' }}
        />
        
        {/* Fireflies */}
        {phase === 'fireflies' && fireflies.map((ff, index) => (
          <div
            key={index}
            className="firefly clickable"
            style={{
              left: `${ff.x}%`,
              top: `${ff.y}%`,
            }}
            onClick={() => catchFirefly(index)}
            onTouchStart={(e) => { e.preventDefault(); catchFirefly(index); }}
          >
            <img src="ch4/art/sprites/firefly.png" alt="Firefly" />
          </div>
        ))}
        
        {/* Lantern */}
        <div className={`lantern ${firefliesCaught >= 10 ? 'glowing' : ''} ${lightRevealed && !lightCollected ? 'clickable' : ''}`}
             onClick={lightRevealed && !lightCollected ? collectLight : undefined}
             onTouchStart={lightRevealed && !lightCollected ? (e) => { e.preventDefault(); collectLight(); } : undefined}>
          <img src="ch4/art/sprites/lantern.png" alt="Lantern" />
          <div className="lantern-glow" style={{ opacity: Math.min(1, firefliesCaught / 10) }} />
        </div>
        
        {/* Number display */}
        {showNumber && (
          <div className="number-display">
            {showNumber}
          </div>
        )}
        
        {/* Animals phase — mums in natural spots; babies hide until revealed by lantern light */}
        {phase === 'animals' || phase === 'crying' ? (
          <>
            {ANIMALS.map((animal) => {
              const spot = PARENT_SPOTS[animal];
              const baby = BABIES[ANIMALS.indexOf(animal)];
              const matched = matchedAnimals.includes(baby);
              return (
                <div
                  key={animal}
                  ref={(el) => { parentRefs.current[animal] = el; }}
                  className={`parent-animal parent-${animal}`}
                  style={{ left: spot.left, top: spot.top }}
                >
                  <img src={`ch4/art/sprites/${animal}.png`} alt={animal} />
                  {matched && draggingBaby !== baby && (
                    <div className="baby-animal matched snuggled">
                      <img src={`ch4/art/sprites/${baby}.png`} alt={baby} />
                    </div>
                  )}
                </div>
              );
            })}

            {babyPositions.map((baby, index) => {
              const isMatched = matchedAnimals.includes(baby);
              const isDragging = draggingBaby === baby;
              if (isMatched && !isDragging) return null;

              const hide = BABY_HIDE_SPOTS[index % BABY_HIDE_SPOTS.length];
              return (
                <div
                  key={baby}
                  className={`baby-animal clickable ${isDragging ? 'dragging' : ''}`}
                  style={
                    isDragging
                      ? {
                          left: `${dragPosition.x}%`,
                          top: `${dragPosition.y}%`,
                          transform: 'translate(-50%, -50%) scale(1.1)',
                          touchAction: 'none',
                        }
                      : { left: hide.left, top: hide.top, touchAction: 'none' }
                  }
                  onPointerDown={(e) => handleBabyPointerDown(e, baby)}
                >
                  <img src={`ch4/art/sprites/${baby}.png`} alt={baby} draggable={false} />
                </div>
              );
            })}
          </>
        ) : null}
        
        {/* Cave glow */}
        {caveGlowing && (
          <div className="cave-glow" />
        )}
        
        {/* Pip */}
        <div className="sprite fairy float">
          <img src="ch4/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
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
            {progress.treasures.petal && <img src="ch4/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />}
          </div>
          <div className={`treasure-slot ${progress.treasures.gem ? 'filled' : 'empty'}`}>
            {progress.treasures.gem && <img src="ch4/art/sprites/purple-gem.png" alt="Purple Gem" />}
          </div>
          <div className={`treasure-slot ${progress.treasures.light ? 'filled' : 'empty'}`}>
            {progress.treasures.light && <img src="ch4/art/sprites/firefly.png" alt="Firefly Light" />}
          </div>
        </div>
        
        {/* Firefly counter */}
        {phase === 'fireflies' && (
          <div className="firefly-counter">
            {firefliesCaught} / 10
          </div>
        )}
        
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

export default Chapter4Scene;
