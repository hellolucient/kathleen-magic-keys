import { useState, useEffect, useRef } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
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
  const animationFrameRef = useRef<number | null>(null);
  const introRunningRef = useRef(false);

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
    
    // Create 10 fireflies at random positions
    const newFireflies: FireflyPosition[] = [];
    for (let i = 0; i < 10; i++) {
      newFireflies.push({
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
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

  const handleBabyStart = (e: React.MouseEvent | React.TouchEvent, baby: string) => {
    e.preventDefault();
    if (matchedAnimals.includes(baby)) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setDraggingBaby(baby);
    setDragPosition({ x, y });
    
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');
  };

  const handleBabyMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingBaby) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setDragPosition({ x, y });
  };

  const handleBabyEnd = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingBaby) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const dropX = ((clientX - rect.left) / rect.width) * 100;
    const dropY = ((clientY - rect.top) / rect.height) * 100;
    
    // Check if dropped on correct parent
    const babyIndex = BABIES.indexOf(draggingBaby);
    const parent = ANIMALS[babyIndex];
    
    // Parent positions (right side, vertically distributed)
    const parentY = 25 + (babyIndex * 22);
    const isMatch = dropX >= 70 && dropX <= 95 && dropY >= parentY && dropY <= parentY + 18;
    
    if (isMatch) {
      // Correct match!
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      audioManager.playSound('audio/sfx/sparkle.mp3');
      
      const newMatched = [...matchedAnimals, draggingBaby];
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
      // Wrong match
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');
      
      setFairyText(audioManager.getText('fairy-wrong', 'ch4'));
      await audioManager.playSpeech('fairy-wrong', 'ch4');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');
    }
    
    setDraggingBaby(null);
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

  return (
    <div 
      className="game-scene chapter4-scene"
      ref={containerRef}
      onMouseMove={handleBabyMove}
      onMouseUp={handleBabyEnd}
      onTouchMove={handleBabyMove}
      onTouchEnd={handleBabyEnd}
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
        
        {/* Animals phase */}
        {phase === 'animals' || phase === 'crying' ? (
          <>
            {/* Parent animals on right */}
            {ANIMALS.map((animal, index) => (
              <div
                key={animal}
                className={`parent-animal parent-${animal}`}
                style={{
                  right: '5%',
                  top: `${25 + index * 22}%`,
                }}
              >
                <img src={`ch4/art/sprites/${animal}.png`} alt={animal} />
              </div>
            ))}
            
            {/* Baby animals on left */}
            {babyPositions.map((baby, index) => {
              const isMatched = matchedAnimals.includes(baby);
              const isDragging = draggingBaby === baby;
              const parentIndex = BABIES.indexOf(baby);
              
              if (isMatched && !isDragging) {
                return (
                  <div
                    key={baby}
                    className="baby-animal matched"
                    style={{
                      right: '15%',
                      top: `${28 + parentIndex * 22}%`,
                    }}
                  >
                    <img src={`ch4/art/sprites/${baby}.png`} alt={baby} />
                  </div>
                );
              }
              
              if (isDragging) {
                return (
                  <div
                    key={baby}
                    className="baby-animal dragging"
                    style={{
                      left: `${dragPosition.x}%`,
                      top: `${dragPosition.y}%`,
                      transform: 'translate(-50%, -50%) scale(1.1)',
                    }}
                  >
                    <img src={`ch4/art/sprites/${baby}.png`} alt={baby} />
                  </div>
                );
              }
              
              return (
                <div
                  key={baby}
                  className="baby-animal clickable"
                  style={{
                    left: '10%',
                    top: `${25 + index * 22}%`,
                  }}
                  onMouseDown={(e) => handleBabyStart(e, baby)}
                  onTouchStart={(e) => handleBabyStart(e, baby)}
                >
                  <img src={`ch4/art/sprites/${baby}.png`} alt={baby} />
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
        
        {/* Treasure bar */}
        <div className="treasure-bar">
          {progress.treasures.petal && (
            <div className="treasure-icon">
              <img src="ch4/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />
            </div>
          )}
          {progress.treasures.gem && (
            <div className="treasure-icon">
              <img src="ch4/art/sprites/purple-gem.png" alt="Purple Gem" />
            </div>
          )}
          {progress.treasures.light && (
            <div className="treasure-icon">
              <img src="ch4/art/sprites/firefly.png" alt="Firefly Light" />
            </div>
          )}
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
