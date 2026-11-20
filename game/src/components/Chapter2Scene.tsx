import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameProgress, Layout } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import { clientToPercent, hitTestRect, startPointerDrag } from '../pointerDrag';
import LookForPreview from './LookForPreview';
import TreasureBar from './TreasureBar';
import './Chapter2Scene.css';

interface Chapter2SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

// Neat alternating L/R trail along the dirt path toward the river; evenly spaced, smaller into distance
// [x%, y%, heading deg, scale]
const FOOTPRINT_TRAIL: [number, number, number, number][] = [
  [52.0, 88, 8, 1.0],
  [54.0, 82, 14, 0.95],
  [56.5, 76, 22, 0.90],
  [59.5, 71, 32, 0.85],
  [63.0, 66.5, 42, 0.80],
  [67.0, 62.5, 52, 0.75],
  [71.0, 59.0, 58, 0.70],
  [75.0, 56.0, 62, 0.65],
  [79.0, 53.5, 66, 0.60],
  [83.0, 51.5, 68, 0.55],
];

function Chapter2Scene({ progress, setProgress, onComplete }: Chapter2SceneProps) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [fairyText, setFairyText] = useState('');
  const [showButterflyPreview, setShowButterflyPreview] = useState(false);
  const [fairyVisible, setFairyVisible] = useState(false);
  const [narratorSpeaking, setNarratorSpeaking] = useState(false);
  const [fairyCheer, setFairyCheer] = useState(false);
  const [muted, setMuted] = useState(false);
  const [draggingButterfly, setDraggingButterfly] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [butterflyFlapping, setButterflyFlapping] = useState<Record<string, boolean>>({});
  const [petalRevealed, setPetalRevealed] = useState(false);
  const [petalTappable, setPetalTappable] = useState(false);
  const [petalCollected, setPetalCollected] = useState(false);
  const petalResolveRef = useRef<(() => void) | null>(null);
  const collectPetal = () => {
    setPetalTappable(false);
    setPetalCollected(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setProgress(p => ({ ...p, treasures: { ...p.treasures, petal: true } }));
  };
  const [backgroundSolved, setBackgroundSolved] = useState(false);
  const [sneezePuffVisible, setSneezePuffVisible] = useState(true);
  const [gardenFullColour, setGardenFullColour] = useState(true);
  const [sneezeGust, setSneezeGust] = useState(false);
  const [pathTappable, setPathTappable] = useState(false);
  const [pipAlongTrail, setPipAlongTrail] = useState(false);
  const pathResolveRef = useRef<(() => void) | null>(null);
  const treasureExplainedRef = useRef(false);
  
  const progressRef = useRef(progress);
  const lastInteractionRef = useRef<number>(Date.now());
  const hintTimerRef = useRef<number | null>(null);
  const hintIndexRef = useRef<number>(0);
  const introAbortedRef = useRef(false);
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const flowerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wrongAttemptCountRef = useRef(0);
  const matchingRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    loadLayout();
    startIntro();

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
    
    if (progress.chapter2.matchedFlowers.length === 6 && !completedRef.current) {
      completedRef.current = true;
      triggerCompletion();
    }
  }, [progress]);

  const loadLayout = async () => {
    const response = await fetch('ch2/layout.json');
    const data = await response.json();
    setLayout(data);
  };

  const startIntro = async () => {
    if (progressRef.current.chapter2.matchedFlowers.length > 0) {
      setFairyVisible(true);
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    introRunningRef.current = true;
    setFairyVisible(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    // Start in full colour; sneeze gust blows colour away during dragon-sneeze line
    setGardenFullColour(true);
    setNarratorSpeaking(true);
    setFairyText(audioManager.getText('narr-intro', 'ch2'));
    await audioManager.playSpeech('narr-intro', 'ch2');
    setNarratorSpeaking(false);
    setFairyText('');
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }

    // Dragon-sneeze line: gust sweeps colour away → grey garden with flower hints
    setFairyText(audioManager.getText('fairy-intro', 'ch2'));
    const sneezeLine = audioManager.playSpeech('fairy-intro', 'ch2');
    setSneezeGust(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    setGardenFullColour(false);
    await sneezeLine;
    setSneezeGust(false);
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setFairyText(audioManager.getText('fairy-start', 'ch2'));
    setShowButterflyPreview(true);
    await audioManager.playSpeech('fairy-start', 'ch2');
    setShowButterflyPreview(false);
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
    introRunningRef.current = false;
    
    lastInteractionRef.current = Date.now();
    startHintSystem();
  };

  const startHintSystem = () => {
    const checkHints = () => {
      const currentProgress = progressRef.current;
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      
      if (currentProgress.chapter2.matchedFlowers.length === 6) {
        return;
      }
      
      if (timeSinceInteraction > 25000 && hintIndexRef.current === 0) {
        giveHint();
        hintIndexRef.current = 1;
      }
      
      hintTimerRef.current = window.setTimeout(checkHints, 5000);
    };
    
    checkHints();
  };

  const giveHint = async () => {
    if (fairyText) return;
    
    const hints = ['hint-1', 'hint-2', 'hint-3'];
    const hintId = hints[Math.min(wrongAttemptCountRef.current, hints.length - 1)];
    
    setFairyText(audioManager.getText(hintId, 'ch2'));
    await audioManager.playSpeech(hintId, 'ch2');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const recordInteraction = () => {
    lastInteractionRef.current = Date.now();
    hintIndexRef.current = 0;
    introAbortedRef.current = true;
  };

  const triggerCompletion = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    audioManager.playSound('ch2/audio/sfx/colour-burst.mp3');
    setBackgroundSolved(true);
    setSneezePuffVisible(false);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setNarratorSpeaking(true);
    setFairyText(audioManager.getText('narr-burst', 'ch2'));
    await audioManager.playSpeech('narr-burst', 'ch2');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');
    setNarratorSpeaking(false);
    
    setPetalRevealed(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-footprints', 'ch2'));
    setPetalTappable(true);
    // Pip flies along the footprint trail while the line plays
    setPipAlongTrail(true);
    const tapped = new Promise<void>(resolve => { petalResolveRef.current = resolve; });
    await audioManager.playSpeech('fairy-footprints', 'ch2');
    const wasTapped = await Promise.race([tapped.then(() => true), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 25000))]);
    petalResolveRef.current = null;
    if (!wasTapped) collectPetal();
    setFairyCheer(true);
    await new Promise(resolve => setTimeout(resolve, wasTapped ? 300 : 900));

    // First treasure explain
    if (!treasureExplainedRef.current) {
      treasureExplainedRef.current = true;
      setFairyText(audioManager.getText('fairy-treasure-petal', 'ch2'));
      await audioManager.playSpeech('fairy-treasure-petal', 'ch2');
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      setFairyText(audioManager.getText('fairy-petal-got', 'ch2'));
      await audioManager.playSpeech('fairy-petal-got', 'ch2');
    }
    setFairyCheer(false);
    setFairyText('');
    await new Promise(resolve => setTimeout(resolve, 300));

    // End action: tap the glowing footprints → next chapter
    setPathTappable(true);
    setFairyText(audioManager.getText('fairy-follow-path', 'ch2'));
    const pathTapped = new Promise<void>(resolve => { pathResolveRef.current = resolve; });
    await audioManager.playSpeech('fairy-follow-path', 'ch2');
    await Promise.race([pathTapped, new Promise(resolve => setTimeout(resolve, 30000))]);
    pathResolveRef.current = null;
    setFairyText('');
    setPathTappable(false);
    onComplete();
  };

  const finishButterflyDrop = async (color: string, clientX: number, clientY: number) => {
    if (matchingRef.current) return;
    matchingRef.current = true;

    const flowerEl = flowerRefs.current[color];
    const isMatch = hitTestRect(flowerEl ?? null, clientX, clientY, 50);

    setDraggingButterfly(null);
    setButterflyFlapping(prev => ({ ...prev, [color]: false }));

    if (isMatch) {
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      audioManager.playSound('audio/sfx/sparkle.mp3');

      setProgress(p => ({
        ...p,
        chapter2: {
          ...p.chapter2,
          matchedFlowers: [...p.chapter2.matchedFlowers, color],
        },
      }));

      setFairyCheer(true);
      const matchLineId = `fairy-match-${color}`;
      setFairyText(audioManager.getText(matchLineId, 'ch2'));
      await audioManager.playSpeech(matchLineId, 'ch2');
      await new Promise(resolve => setTimeout(resolve, 400));
      setFairyCheer(false);
      setFairyText('');
    } else {
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');

      wrongAttemptCountRef.current++;
      setProgress(p => ({
        ...p,
        chapter2: {
          ...p.chapter2,
          wrongAttempts: p.chapter2.wrongAttempts + 1,
        },
      }));

      if (wrongAttemptCountRef.current <= 3) {
        const wrongLineId = `fairy-wrong-${wrongAttemptCountRef.current}`;
        setFairyText(audioManager.getText(wrongLineId, 'ch2'));
        await audioManager.playSpeech(wrongLineId, 'ch2');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setFairyText('');
      }
    }

    matchingRef.current = false;
  };

  const handleButterflyPointerDown = (e: ReactPointerEvent, color: string) => {
    if (progress.chapter2.matchedFlowers.includes(color) || matchingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    recordInteraction();

    const pct = clientToPercent(container, e.clientX, e.clientY);
    const butterfly = layout?.objects.find(obj => obj.id === `butterfly-${color}`);
    if (butterfly) {
      setDragOffset({
        x: pct.x - butterfly.x,
        y: pct.y - butterfly.y,
      });
    }

    setDraggingButterfly(color);
    setDragPosition(pct);
    setButterflyFlapping(prev => ({ ...prev, [color]: true }));
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');

    startPointerDrag(e, {
      onMove: (cx, cy) => {
        setDragPosition(clientToPercent(container, cx, cy));
      },
      onEnd: (cx, cy) => {
        void finishButterflyDrop(color, cx, cy);
      },
    });
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  if (!layout) {
    return <div className="game-scene">Loading...</div>;
  }

  const getObjectStyle = (obj: any) => {
    return {
      position: 'absolute' as const,
      left: `${obj.x}%`,
      top: `${obj.y}%`,
      width: `${obj.w}%`,
      height: `${obj.h}%`,
      zIndex: obj.z || 0,
    };
  };

  const getButterflyStyle = (color: string) => {
    if (draggingButterfly === color) {
      return {
        position: 'absolute' as const,
        left: `${dragPosition.x - dragOffset.x}%`,
        top: `${dragPosition.y - dragOffset.y}%`,
        width: `${layout.objects.find(o => o.id === `butterfly-${color}`)?.w}%`,
        height: `${layout.objects.find(o => o.id === `butterfly-${color}`)?.h}%`,
        zIndex: 100,
        cursor: 'grabbing',
        transform: 'scale(1.1)',
      };
    }
    
    const butterfly = layout.objects.find(o => o.id === `butterfly-${color}`);
    return butterfly ? getObjectStyle(butterfly) : {};
  };

  return (
    <div 
      className="game-scene chapter2-scene"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        {/* Base layer: always keep a solid bg underneath so fades never reveal a black void */}
        <img
          src="ch2/art/bg-garden-grey.jpg"
          alt=""
          className="game-bg"
          aria-hidden
        />
        {/* Full-colour layer: visible at open, after sneeze drains, and again when restored */}
        <img
          src="ch2/art/bg-garden-colour-full.jpg"
          alt="Garden"
          className={`game-bg colour-layer ${gardenFullColour || backgroundSolved ? 'colour-visible' : 'colour-hidden'}`}
        />

        {sneezeGust && (
          <div className="sneeze-gust" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`gust-puff gust-puff-${i}`} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`s${i}`} className={`gust-streak gust-streak-${i}`} />
            ))}
          </div>
        )}

        {sneezePuffVisible && !sneezeGust && (
          <div 
            className="sprite sneeze-puff fade-out-slow"
            style={getObjectStyle(layout.objects.find(o => o.id === 'sneeze-puff'))}
          >
            <img src="ch2/art/sprites/sneeze-puff.png" alt="" />
          </div>
        )}
        
        {COLORS.map(color => {
          const isMatched = progress.chapter2.matchedFlowers.includes(color);
          
          return (
            <div key={color}>
              {isMatched && (
                <div
                  className="sprite flower-color fade-in sparkle-burst"
                  style={getObjectStyle(layout.objects.find(o => o.id === `flower-${color}`))}
                >
                  <img src={`ch2/art/sprites/flower-${color}-colour.png`} alt="" />
                </div>
              )}
              
              {!isMatched && !gardenFullColour && (
                <div
                  ref={(el) => { flowerRefs.current[color] = el; }}
                  className={`sprite flower-hint flower-hint-${color}`}
                  style={getObjectStyle(layout.objects.find(o => o.id === `flower-${color}`))}
                >
                  <img src={`ch2/art/sprites/flower-${color}-colour.png`} alt="" />
                </div>
              )}
              {/* Keep flower hit targets even before colour drains (invisible) */}
              {!isMatched && gardenFullColour && (
                <div
                  ref={(el) => { flowerRefs.current[color] = el; }}
                  style={{ ...getObjectStyle(layout.objects.find(o => o.id === `flower-${color}`)), opacity: 0, pointerEvents: 'none' }}
                />
              )}

              {!isMatched && (
                <div
                  className={`sprite butterfly clickable ${draggingButterfly === color ? '' : 'float'}`}
                  style={{ ...getButterflyStyle(color), touchAction: 'none' }}
                  onPointerDown={(e) => handleButterflyPointerDown(e, color)}
                >
                  <img 
                    src={`ch2/art/sprites/butterfly-${color}${draggingButterfly === color || butterflyFlapping[color] ? '-flap' : ''}.png`} 
                    alt={`${color} butterfly`}
                    draggable={false}
                  />
                </div>
              )}
              
              {isMatched && (
                <div
                  className="sprite butterfly-settled flutter"
                  style={{
                    position: 'absolute',
                    left: `${(layout.objects.find(o => o.id === `flower-${color}`)?.x || 0) + (layout.objects.find(o => o.id === `flower-${color}`)?.w || 0) / 2 - 4}%`,
                    top: `${(layout.objects.find(o => o.id === `flower-${color}`)?.y || 0) - 3}%`,
                    width: `${(layout.objects.find(o => o.id === `flower-${color}`)?.w || 0) * 0.33}%`,
                    height: 'auto',
                    zIndex: (layout.objects.find(o => o.id === `flower-${color}`)?.z || 0) + 5,
                  }}
                >
                  <img src={`ch2/art/sprites/butterfly-${color}-flap.png`} alt="" style={{ width: '100%', height: 'auto' }} />
                </div>
              )}
            </div>
          );
        })}
        
        {petalRevealed && (
          <>
            {FOOTPRINT_TRAIL.map((pt, i) => {
              const side = i % 2 === 0 ? -1.1 : 1.1;
              return (
                <img
                  key={i}
                  className={`footprint-step ${pathTappable ? 'path-glow' : ''}`}
                  src="ch2/art/sprites/footprint-single.png"
                  alt=""
                  style={{
                    left: `${pt[0] + side}%`,
                    top: `${pt[1]}%`,
                    width: `${3.2 * pt[3]}%`,
                    transform: `translate(-50%, -50%) rotate(${pt[2] - 48}deg) scaleX(${i % 2 === 0 ? 1 : -1})`,
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              );
            })}

            {pathTappable && (
              <div
                className="path-continue-hit clickable"
                style={{ touchAction: 'none' }}
                onPointerDown={() => {
                  if (pathResolveRef.current) pathResolveRef.current();
                }}
                onClick={() => {
                  if (pathResolveRef.current) pathResolveRef.current();
                }}
              />
            )}

            <div
              className={`sprite rainbow-petal fade-in sparkle ${petalTappable ? 'tappable' : ''} ${petalCollected ? 'collected' : ''}`}
              style={getObjectStyle(layout.objects.find(o => o.id === 'rainbow-petal'))}
              onPointerDown={() => {
                if (petalTappable && petalResolveRef.current) { collectPetal(); petalResolveRef.current(); }
              }}
            >
              <img src="ch2/art/sprites/rainbow-petal.png" alt="Rainbow petal" />
            </div>
          </>
        )}

        {fairyVisible && (
          <div 
            className={`sprite fairy ${fairyCheer ? 'cheer' : 'float'} ${pipAlongTrail ? 'pip-along-trail' : ''}`}
            style={pipAlongTrail ? undefined : getObjectStyle(layout.objects.find(o => o.id === 'fairy'))}
          >
            <img 
              src={fairyCheer 
                ? 'ch2/art/sprites/fairy-cheer.png' 
                : 'ch2/art/sprites/fairy-talk.png'
              } 
              alt="Pip the Fairy" 
            />
          </div>
        )}
        
        {fairyText && (
          <div className={`speech-bubble ${narratorSpeaking ? 'narrator' : ''} ${
            // Footprints and petal sit bottom right at the end, so keep words off them
            narratorSpeaking || petalRevealed ? 'pos-top-left' :
            progress.chapter2.matchedFlowers.length >= 4 ? 'pos-bottom-right' : 'pos-top-left'
          }`}>
            {fairyText}
          </div>
        )}
        
        {showButterflyPreview && (
          <LookForPreview 
            imageSrc="ch2/art/sprites/butterfly-purple.png" 
            alt="A colorful butterfly"
          />
        )}
        
        <TreasureBar treasures={progress.treasures} spriteBase="ch2/art/sprites" />

        <div className="flower-counter">
          <div className="flower-icons">
            {COLORS.map((color) => (
              <div 
                key={color} 
                className={`flower-icon ${progress.chapter2.matchedFlowers.includes(color) ? 'matched' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flower-count">{progress.chapter2.matchedFlowers.length} / 6</div>
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

export default Chapter2Scene;
