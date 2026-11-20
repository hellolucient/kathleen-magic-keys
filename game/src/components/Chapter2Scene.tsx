import { useState, useEffect, useRef } from 'react';
import type { GameProgress, Layout } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import LookForPreview from './LookForPreview';
import './Chapter2Scene.css';

interface Chapter2SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function Chapter2Scene({ progress, setProgress, onComplete }: Chapter2SceneProps) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [fairyText, setFairyText] = useState('');
  const [showButterflyPreview, setShowButterflyPreview] = useState(false);
  const [fairyVisible, setFairyVisible] = useState(false);
  const [fairyCheer, setFairyCheer] = useState(false);
  const [muted, setMuted] = useState(false);
  const [draggingButterfly, setDraggingButterfly] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [butterflyFlapping, setButterflyFlapping] = useState<Record<string, boolean>>({});
  const [petalRevealed, setPetalRevealed] = useState(false);
  const [backgroundSolved, setBackgroundSolved] = useState(false);
  const [sneezePuffVisible, setSneezePuffVisible] = useState(true);
  
  const progressRef = useRef(progress);
  const lastInteractionRef = useRef<number>(Date.now());
  const hintTimerRef = useRef<number | null>(null);
  const hintIndexRef = useRef<number>(0);
  const introAbortedRef = useRef(false);
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrongAttemptCountRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    loadLayout();
    startIntro();

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
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
    
    await audioManager.playSpeech('narr-intro', 'ch2');
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
    
    setFairyText(audioManager.getText('fairy-intro', 'ch2'));
    await audioManager.playSpeech('fairy-intro', 'ch2');
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
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
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFairyText(audioManager.getText('narr-burst', 'ch2'));
    await audioManager.playSpeech('narr-burst', 'ch2');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFairyText('');
    
    setPetalRevealed(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-footprints', 'ch2'));
    await audioManager.playSpeech('fairy-footprints', 'ch2');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFairyText(audioManager.getText('narr-complete', 'ch2'));
    await audioManager.playSpeech('narr-complete', 'ch2');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete();
  };

  const handleButterflyStart = (e: React.MouseEvent | React.TouchEvent, color: string) => {
    e.preventDefault();
    if (progress.chapter2.matchedFlowers.includes(color)) return;
    
    recordInteraction();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    const butterfly = layout?.objects.find(obj => obj.id === `butterfly-${color}`);
    if (butterfly) {
      setDragOffset({
        x: x - butterfly.x,
        y: y - butterfly.y,
      });
    }
    
    setDraggingButterfly(color);
    setDragPosition({ x, y });
    setButterflyFlapping(prev => ({ ...prev, [color]: true }));
    
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');
  };

  const handleButterflyMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingButterfly) return;
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

  const handleButterflyEnd = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingButterfly) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container || !layout) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const dropX = ((clientX - rect.left) / rect.width) * 100;
    const dropY = ((clientY - rect.top) / rect.height) * 100;
    
    const matchingFlower = layout.objects.find(obj => 
      obj.id.startsWith('flower-') && 
      obj.id.includes('-grey') &&
      obj.color === draggingButterfly &&
      dropX >= obj.x && dropX <= obj.x + obj.w &&
      dropY >= obj.y && dropY <= obj.y + obj.h
    );
    
    if (matchingFlower) {
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      audioManager.playSound('audio/sfx/sparkle.mp3');
      
      setProgress(p => ({
        ...p,
        chapter2: {
          ...p.chapter2,
          matchedFlowers: [...p.chapter2.matchedFlowers, draggingButterfly],
        },
      }));
      
      setFairyCheer(true);
      const matchLineId = `fairy-match-${draggingButterfly}`;
      setFairyText(audioManager.getText(matchLineId, 'ch2'));
      await audioManager.playSpeech(matchLineId, 'ch2');
      await new Promise(resolve => setTimeout(resolve, 1500));
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
    
    setDraggingButterfly(null);
    setButterflyFlapping(prev => ({ ...prev, [draggingButterfly]: false }));
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
      onMouseMove={handleButterflyMove}
      onMouseUp={handleButterflyEnd}
      onTouchMove={handleButterflyMove}
      onTouchEnd={handleButterflyEnd}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img 
          src={backgroundSolved ? 'ch2/art/bg-garden-colour.jpg' : 'ch2/art/bg-garden-grey.jpg'}
          alt="Garden" 
          className={`game-bg ${backgroundSolved ? 'fade-in' : ''}`}
        />
        
        {sneezePuffVisible && (
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
              
              {!isMatched && draggingButterfly !== color && (
                <div
                  className="sprite butterfly float clickable"
                  style={getButterflyStyle(color)}
                  onMouseDown={(e) => handleButterflyStart(e, color)}
                  onTouchStart={(e) => handleButterflyStart(e, color)}
                >
                  <img 
                    src={`ch2/art/sprites/butterfly-${color}${butterflyFlapping[color] ? '-flap' : ''}.png`} 
                    alt={`${color} butterfly`}
                  />
                </div>
              )}
              
              {!isMatched && draggingButterfly === color && (
                <div
                  className="sprite butterfly"
                  style={getButterflyStyle(color)}
                >
                  <img 
                    src={`ch2/art/sprites/butterfly-${color}-flap.png`} 
                    alt={`${color} butterfly`}
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
            <div
              className="sprite footprints fade-in"
              style={getObjectStyle(layout.objects.find(o => o.id === 'footprints'))}
            >
              <img src="ch2/art/sprites/footprints.png" alt="Dragon footprints" />
            </div>
            
            <div
              className="sprite rainbow-petal fade-in sparkle"
              style={getObjectStyle(layout.objects.find(o => o.id === 'rainbow-petal'))}
            >
              <img src="ch2/art/sprites/rainbow-petal.png" alt="Rainbow petal" />
            </div>
          </>
        )}
        
        {fairyVisible && (
          <div 
            className={`sprite fairy ${fairyCheer ? 'cheer' : 'float'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'fairy'))}
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
          <div className={`speech-bubble ${
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
