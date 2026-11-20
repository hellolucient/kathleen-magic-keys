import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import { clientToPercent, hitTestRect, startPointerDrag } from '../pointerDrag';
import TreasureBar from './TreasureBar';
import './Chapter4Scene.css';

interface Chapter4SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

interface FireflyState {
  id: number;
  cx: number;
  cy: number;
  ampX: number;
  ampY: number;
  period: number;
  phase: number;
  caught: boolean;
}

const ANIMALS = ['owl', 'rabbit', 'deer'];
const BABIES = ['owlet', 'bunny', 'fawn'];

const PARENT_SPOTS: Record<string, { left: string; top: string }> = {
  owl: { left: '8%', top: '58%' },
  rabbit: { left: '42%', top: '62%' },
  deer: { left: '72%', top: '55%' },
};

const BABY_HIDE_SPOTS = [
  { left: '22%', top: '32%' },  // near left bushes, above owl mum
  { left: '48%', top: '36%' },  // mid clearing
  { left: '68%', top: '30%' },  // above path, left of deer
];

function Chapter4Scene({ progress, setProgress, onComplete }: Chapter4SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [narratorSpeaking, setNarratorSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'fireflies' | 'animals' | 'crying' | 'complete'>('intro');
  const [fireflies, setFireflies] = useState<FireflyState[]>([]);
  const [firefliesCaught, setFirefliesCaught] = useState(0);
  const [draggingBaby, setDraggingBaby] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [matchedAnimals, setMatchedAnimals] = useState<string[]>([]);
  const [babyPositions, setBabyPositions] = useState<string[]>([]);
  const [lightRevealed, setLightRevealed] = useState(false);
  const [lightCollected, setLightCollected] = useState(false);
  const [caveGlowing, setCaveGlowing] = useState(false);
  const [showNumber, setShowNumber] = useState('');
  const [pathTappable, setPathTappable] = useState(false);
  const [tick, setTick] = useState(0);

  const progressRef = useRef(progress);
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const introRunningRef = useRef(false);
  const matchingRef = useRef(false);
  const catchingRef = useRef(false);
  const pathResolveRef = useRef<(() => void) | null>(null);
  const treasureExplainedRef = useRef(false);
  const collectingRef = useRef(false);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(prev => ({
      ...prev,
      chapter4: { firefliesCaught: 0, matchedAnimals: [] },
    }));

    startIntro();

    return () => {
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Slow CSS-driven drift via rAF updating a tick (positions computed from sine)
  useEffect(() => {
    if (phase !== 'fireflies') return;
    let raf = 0;
    const loop = () => {
      setTick(t => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const showCaption = async (lineId: string, isNarrator = false) => {
    const text = audioManager.getText(lineId, 'ch4');
    setNarratorSpeaking(isNarrator);
    setFairyText(text);
    await audioManager.playSpeech(lineId, 'ch4');
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
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    introRunningRef.current = false;
    startFireflyPhase();
  };

  const startFireflyPhase = () => {
    setPhase('fireflies');
    startTimeRef.current = performance.now();
    const list: FireflyState[] = [];
    for (let i = 0; i < 10; i++) {
      list.push({
        id: i,
        cx: 18 + (i % 5) * 14 + Math.random() * 4,
        cy: 28 + Math.floor(i / 5) * 22 + Math.random() * 6,
        ampX: 2 + Math.random() * 3,
        ampY: 1.5 + Math.random() * 2.5,
        period: 6 + Math.random() * 4, // 6–10s loops
        phase: Math.random() * Math.PI * 2,
        caught: false,
      });
    }
    setFireflies(list);
  };

  const fireflyPos = (ff: FireflyState) => {
    const t = (performance.now() - startTimeRef.current) / 1000;
    const ang = (t / ff.period) * Math.PI * 2 + ff.phase;
    // ease-in-out-ish via sine
    return {
      x: ff.cx + Math.sin(ang) * ff.ampX,
      y: ff.cy + Math.sin(ang * 0.85 + 1.2) * ff.ampY,
    };
  };

  const catchFirefly = async (id: number) => {
    if (phase !== 'fireflies' || catchingRef.current) return;
    const ff = fireflies.find(f => f.id === id && !f.caught);
    if (!ff) return;
    catchingRef.current = true;

    setFireflies(prev => prev.map(f => (f.id === id ? { ...f, caught: true } : f)));
    const newCount = firefliesCaught + 1;
    setFirefliesCaught(newCount);

    audioManager.playSound('audio/sfx/sparkle.mp3');
    setShowNumber(`${newCount}`);
    await audioManager.playSpeech(`count-${newCount}`, 'ch4');
    setShowNumber('');

    setProgress(prev => ({
      ...prev,
      chapter4: { ...prev.chapter4, firefliesCaught: newCount },
    }));

    catchingRef.current = false;

    if (newCount === 10) {
      await new Promise(resolve => setTimeout(resolve, 400));
      await showCaption('fairy-ten');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');
      startAnimalPhase();
    }
  };

  const startAnimalPhase = async () => {
    setPhase('animals');
    await new Promise(resolve => setTimeout(resolve, 400));
    setBabyPositions([...BABIES].sort(() => Math.random() - 0.5));
    await showCaption('fairy-animals');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');
  };

  const finishBabyDrop = async (baby: string, clientX: number, clientY: number) => {
    if (matchingRef.current) return;
    matchingRef.current = true;

    const babyIndex = BABIES.indexOf(baby);
    const parent = ANIMALS[babyIndex];
    const isMatch = hitTestRect(parentRefs.current[parent] ?? null, clientX, clientY, 50);
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
      await showCaption(`fairy-match-${parent}`);
      await new Promise(resolve => setTimeout(resolve, 400));
      setFairyText('');
      if (newMatched.length === 3) await completeAnimalPhase();
    } else {
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');
      await showCaption('fairy-wrong');
      await new Promise(resolve => setTimeout(resolve, 400));
      setFairyText('');
    }
    matchingRef.current = false;
  };

  const handleBabyPointerDown = (e: ReactPointerEvent, baby: string) => {
    if (matchedAnimals.includes(baby) || matchingRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    setDraggingBaby(baby);
    setDragPosition(clientToPercent(container, e.clientX, e.clientY));
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');
    startPointerDrag(e, {
      onMove: (cx, cy) => setDragPosition(clientToPercent(container, cx, cy)),
      onEnd: (cx, cy) => { void finishBabyDrop(baby, cx, cy); },
    });
  };

  const completeAnimalPhase = async () => {
    setPhase('crying');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mountain/cave glow pulse while the cry line plays
    setCaveGlowing(true);
    await showCaption('narr-cry', true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');
    setCaveGlowing(false);

    setLightRevealed(true);
    await showCaption('fairy-light');
    await new Promise(resolve => setTimeout(resolve, 400));

    setTimeout(() => {
      if (!lightCollected && !collectingRef.current) void collectLight();
    }, 25000);
  };

  const collectLight = async () => {
    if (lightCollected || collectingRef.current) return;
    collectingRef.current = true;
    setLightCollected(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    setProgress(p => ({
      ...p,
      treasures: { ...p.treasures, light: true },
    }));

    await new Promise(resolve => setTimeout(resolve, 600));

    // No repeated "A magic Firefly Light"
    if (!treasureExplainedRef.current) {
      treasureExplainedRef.current = true;
      await showCaption('fairy-treasure-light');
    } else {
      await showCaption('fairy-light-got');
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    setPathTappable(true);
    setCaveGlowing(true);
    await showCaption('fairy-follow-path');
    const tapped = new Promise<void>(resolve => { pathResolveRef.current = resolve; });
    await Promise.race([tapped, new Promise(resolve => setTimeout(resolve, 30000))]);
    pathResolveRef.current = null;
    setFairyText('');
    setPathTappable(false);
    onComplete();
  };

  const toggleMute = () => setMuted(audioManager.toggleMute());

  // Lantern glow: faint at 0, full at 10
  const lanternGlow = Math.min(1, 0.12 + (firefliesCaught / 10) * 0.88);
  const darkness = Math.max(0, 0.62 - firefliesCaught * 0.055);

  // silence unused tick warning by reading it
  void tick;

  return (
    <div
      className="game-scene chapter4-scene"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img src="ch4/art/raw/bg-forest.jpg" alt="Twinkle Forest" className="game-bg" />

        <div className="darkness-overlay" style={{ opacity: darkness, transition: 'opacity 0.5s' }} />

        {phase === 'fireflies' && fireflies.filter(f => !f.caught).map((ff) => {
          const pos = fireflyPos(ff);
          return (
            <div
              key={ff.id}
              className="firefly clickable"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'none' }}
              onPointerDown={(e) => {
                e.preventDefault();
                void catchFirefly(ff.id);
              }}
            >
              <img src="ch4/art/sprites/firefly.png" alt="Firefly" draggable={false} />
            </div>
          );
        })}

        <div
          className={`lantern ${firefliesCaught >= 10 ? 'glowing' : ''} ${lightRevealed && !lightCollected ? 'clickable' : ''}`}
          onPointerDown={
            lightRevealed && !lightCollected
              ? (e) => { e.preventDefault(); void collectLight(); }
              : undefined
          }
          onClick={
            lightRevealed && !lightCollected
              ? () => { void collectLight(); }
              : undefined
          }
          style={{ touchAction: 'none' }}
        >
          <img src="ch4/art/sprites/lantern.png" alt="Lantern" />
          <div className="lantern-glow" style={{ opacity: lanternGlow }} />
        </div>

        {showNumber && <div className="number-display">{showNumber}</div>}

        {(phase === 'animals' || phase === 'crying' || phase === 'complete') && (
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
              if (matchedAnimals.includes(baby) && draggingBaby !== baby) return null;
              const isDragging = draggingBaby === baby;
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
        )}

        {caveGlowing && <div className="cave-glow mountain-pulse" />}

        {pathTappable && (
          <div
            className="ch4-path-continue clickable"
            onPointerDown={(e) => {
              e.preventDefault();
              pathResolveRef.current?.();
            }}
            onClick={() => pathResolveRef.current?.()}
            style={{ touchAction: 'none' }}
          />
        )}

        <div className="sprite fairy float">
          <img src="ch4/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
        </div>

        {fairyText && (
          <div className={`speech-bubble ${narratorSpeaking ? 'narrator' : ''}`}>
            {fairyText}
          </div>
        )}

        <TreasureBar
          treasures={progress.treasures}
          spriteBase="ch4/art/sprites"
          lightSrc="firefly.png"
        />

        {phase === 'fireflies' && (
          <div className="firefly-counter">{firefliesCaught} / 10</div>
        )}

        <button className="mute-button" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}

export default Chapter4Scene;
