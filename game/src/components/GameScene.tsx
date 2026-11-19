import { useState, useEffect, useRef } from 'react';
import type { GameProgress, Layout } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress, resetProgress } from '../gameState';
import './GameScene.css';

interface GameSceneProps {
  progress: GameProgress;
  setProgress: (progress: GameProgress) => void;
  onComplete: () => void;
}

const KEY_PUZZLES = ['key-teddy', 'key-jewellery', 'key-curtain', 'key-wardrobe', 'key-mirror'];

function GameScene({ progress, setProgress, onComplete }: GameSceneProps) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [fairyText, setFairyText] = useState('');
  const [fairyVisible, setFairyVisible] = useState(false);
  const [fairyCheer, setFairyCheer] = useState(false);
  const [doorGlowing, setDoorGlowing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [kittenPlaying, setKittenPlaying] = useState(false);
  const [toyChestOpen, setToyChestOpen] = useState(false);
  const [musicBoxPlaying, setMusicBoxPlaying] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const hintTimerRef = useRef<number | null>(null);
  const hintIndexRef = useRef<number>(0);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<number>(0);

  useEffect(() => {
    loadLayout();
    startIntro();
    startHintSystem();

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
    
    // Check if all keys found
    if (progress.keysFound.length === 5 && !doorGlowing && !unlocking) {
      triggerDoorGlow();
    }
  }, [progress]);

  const loadLayout = async () => {
    const response = await fetch('/layout.json');
    const data = await response.json();
    setLayout(data);
  };

  const startIntro = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await audioManager.playSpeech('narr-intro');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await audioManager.playSpeech('narr-fairy-arrives');
    
    setFairyVisible(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const text3 = await audioManager.playSpeech('fairy-intro');
    setFairyText(text3);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const text4 = await audioManager.playSpeech('fairy-start');
    setFairyText(text4);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    setFairyText('');
  };

  const startHintSystem = () => {
    const checkHints = () => {
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      
      if (timeSinceInteraction > 25000 && !unlocking && progress.keysFound.length < 5) {
        giveHint();
      }
      
      hintTimerRef.current = window.setTimeout(checkHints, 5000);
    };
    
    checkHints();
  };

  const giveHint = async () => {
    const missingKeys = KEY_PUZZLES.filter(key => !progress.keysFound.includes(key));
    
    if (missingKeys.length === 0) return;
    
    const targetKey = missingKeys[0];
    const puzzleName = targetKey.replace('key-', '');
    
    const hints = [
      `hint-${puzzleName}-1`,
      `hint-${puzzleName}-2`,
      `hint-${puzzleName}-3`,
      `hint-${puzzleName}-4`,
    ];
    
    const hintId = hints[Math.min(hintIndexRef.current, hints.length - 1)];
    hintIndexRef.current++;
    
    const text = await audioManager.playSpeech(hintId);
    setFairyText(text);
    
    setTimeout(() => setFairyText(''), 4000);
  };

  const recordInteraction = () => {
    lastInteractionRef.current = Date.now();
    hintIndexRef.current = 0;
  };

  const collectKey = async (keyId: string) => {
    if (progress.keysFound.includes(keyId)) return;
    
    recordInteraction();
    
    audioManager.playSound('/audio/sfx/sparkle.mp3');
    audioManager.playSound('/audio/sfx/key-found.mp3');
    
    const newKeysFound = [...progress.keysFound, keyId];
    setProgress({ ...progress, keysFound: newKeysFound });
    
    setFairyCheer(true);
    const foundLineId = `fairy-found-${newKeysFound.length}`;
    const text = await audioManager.playSpeech(foundLineId);
    setFairyText(text);
    
    setTimeout(() => {
      setFairyCheer(false);
      setFairyText('');
    }, 3000);
  };

  const triggerDoorGlow = async () => {
    setDoorGlowing(true);
    audioManager.playSound('/audio/sfx/door-glow-loop.mp3', true);
    
    const text = await audioManager.playSpeech('fairy-door-glow');
    setFairyText(text);
    
    setTimeout(() => setFairyText(''), 4000);
  };

  const unlockDoor = async () => {
    if (progress.keysFound.length < 5 || unlocking) return;
    
    setUnlocking(true);
    audioManager.stopLoop('/audio/sfx/door-glow-loop.mp3');
    
    const text = await audioManager.playSpeech('narr-unlock');
    setFairyText(text);
    
    // Animate keys flying to locks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (let i = 0; i < 5; i++) {
      audioManager.playSound('/audio/sfx/lock-click.mp3');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    audioManager.playSound('/audio/sfx/door-open-magic.mp3');
    audioManager.playSound('/audio/sfx/celebration-fanfare.mp3');
    setDoorOpen(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFairyCheer(true);
    const finalText = await audioManager.playSpeech('fairy-final');
    setFairyText(finalText);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    onComplete();
  };

  // Puzzle handlers
  const handleTeddyClick = () => {
    recordInteraction();
    
    if (!progress.puzzleStates.teddyWiggled) {
      audioManager.playSound('/audio/sfx/wiggle-boing.mp3');
      setProgress({
        ...progress,
        puzzleStates: { ...progress.puzzleStates, teddyWiggled: true }
      });
    } else if (!progress.puzzleStates.teddyMoved) {
      audioManager.playSound('/audio/sfx/wiggle-boing.mp3');
      setProgress({
        ...progress,
        puzzleStates: { ...progress.puzzleStates, teddyMoved: true }
      });
      setTimeout(() => collectKey('key-teddy'), 500);
    }
  };

  const handleJewelleryBoxClick = () => {
    if (progress.puzzleStates.jewelleryOpen) return;
    
    recordInteraction();
    audioManager.playSound('/audio/sfx/lid-click.mp3');
    setProgress({
      ...progress,
      puzzleStates: { ...progress.puzzleStates, jewelleryOpen: true }
    });
    setTimeout(() => collectKey('key-jewellery'), 500);
  };

  const handleCurtainClick = () => {
    if (progress.puzzleStates.curtainOpen) return;
    
    recordInteraction();
    audioManager.playSound('/audio/sfx/curtain-swish.mp3');
    setProgress({
      ...progress,
      puzzleStates: { ...progress.puzzleStates, curtainOpen: true }
    });
    setTimeout(() => collectKey('key-curtain'), 500);
  };

  const handleWardrobeClick = () => {
    recordInteraction();
    
    if (!progress.puzzleStates.wardrobeOpen) {
      audioManager.playSound('/audio/sfx/tap-pop.mp3');
      setProgress({
        ...progress,
        puzzleStates: { ...progress.puzzleStates, wardrobeOpen: true }
      });
    }
  };

  const handleDressClick = () => {
    if (!progress.puzzleStates.wardrobeOpen) return;
    
    recordInteraction();
    audioManager.playSound('/audio/sfx/sparkle.mp3');
    setTimeout(() => collectKey('key-wardrobe'), 300);
  };

  const handleMirrorClick = () => {
    if (progress.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    audioManager.playSound('/audio/sfx/sparkle.mp3');
    setProgress({
      ...progress,
      puzzleStates: { ...progress.puzzleStates, mirrorGlow: true, mirrorSequence: [] }
    });
  };

  const handleStarClick = (order: number) => {
    if (!progress.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    
    const sequence = [...progress.puzzleStates.mirrorSequence, order];
    
    if (order === sequence.length) {
      // Correct!
      audioManager.playSound(`/audio/sfx/star-${order}.mp3`);
      
      if (sequence.length === 3) {
        // All stars tapped correctly
        setTimeout(() => collectKey('key-mirror'), 500);
      } else {
        setProgress({
          ...progress,
          puzzleStates: { ...progress.puzzleStates, mirrorSequence: sequence }
        });
      }
    } else {
      // Wrong order
      audioManager.playSound('/audio/sfx/star-reset.mp3');
      audioManager.playSpeech('hint-mirror-5');
      setProgress({
        ...progress,
        puzzleStates: { ...progress.puzzleStates, mirrorSequence: [] }
      });
    }
  };

  // Fun interactive elements
  const handleKittenClick = async () => {
    recordInteraction();
    const meow = Math.random() > 0.5 ? '/audio/sfx/kitten-meow-1.mp3' : '/audio/sfx/kitten-meow-2.mp3';
    audioManager.playSound(meow);
    
    setKittenPlaying(true);
    setTimeout(() => setKittenPlaying(false), 2000);
    
    const text = await audioManager.playSpeech('curious-kitten');
    setFairyText(text);
    setTimeout(() => setFairyText(''), 3000);
  };

  const handleMusicBoxClick = async () => {
    recordInteraction();
    
    if (musicBoxPlaying) {
      audioManager.stopLoop('/audio/sfx/music-box-loop.mp3');
      setMusicBoxPlaying(false);
    } else {
      audioManager.playSound('/audio/sfx/music-box-loop.mp3', true);
      setMusicBoxPlaying(true);
      
      const text = await audioManager.playSpeech('curious-musicbox');
      setFairyText(text);
      setTimeout(() => setFairyText(''), 3000);
    }
  };

  const handleToyChestClick = async () => {
    recordInteraction();
    audioManager.playSound('/audio/sfx/tap-pop.mp3');
    
    setToyChestOpen(!toyChestOpen);
    
    if (!toyChestOpen) {
      const text = await audioManager.playSpeech('curious-chest');
      setFairyText(text);
      setTimeout(() => setFairyText(''), 3000);
    }
  };

  const handleDragonClick = async () => {
    recordInteraction();
    audioManager.playSound('/audio/sfx/sparkle.mp3');
    
    const text = await audioManager.playSpeech('curious-dragon');
    setFairyText(text);
    setTimeout(() => setFairyText(''), 3000);
  };

  const handleDoorClick = async () => {
    recordInteraction();
    
    if (progress.keysFound.length === 5) {
      await unlockDoor();
    } else {
      const text = await audioManager.playSpeech('curious-door-locked');
      setFairyText(text);
      setTimeout(() => setFairyText(''), 3000);
    }
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  const handleLongPressStart = () => {
    longPressStartRef.current = Date.now();
    longPressTimerRef.current = window.setTimeout(() => {
      if (confirm('Reset game progress? This will clear all found keys and restart the adventure.')) {
        resetProgress();
        window.location.reload();
      }
    }, 3000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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
      transform: obj.rotate ? `rotate(${obj.rotate}deg)` : undefined,
    };
  };

  return (
    <div className="game-scene">
      <div className="game-container">
        <img src="/art/bg-bedroom.jpg" alt="Princess's Bedroom" className="game-bg" />
        
        {/* Curtain overlay */}
        {!progress.puzzleStates.curtainOpen && (
          <div 
            className="sprite curtain-closed clickable"
            style={getObjectStyle(layout.objects.find(o => o.id === 'curtain-closed'))}
            onClick={handleCurtainClick}
          >
            <img src="/art/sprites/curtain-closed-overlay.png" alt="" />
          </div>
        )}
        
        {/* Key behind curtain */}
        {progress.puzzleStates.curtainOpen && !progress.keysFound.includes('key-curtain') && (
          <div 
            className="sprite key key-curtain clickable sparkle"
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-curtain'))}
            onClick={() => collectKey('key-curtain')}
          >
            <img src="/art/sprites/key.png" alt="Key" />
          </div>
        )}
        
        {/* Mirror and stars puzzle */}
        <div 
          className="sprite mirror-hitbox clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'mirror-glow'))}
          onClick={handleMirrorClick}
        >
          {progress.puzzleStates.mirrorGlow && (
            <>
              <img src="/art/sprites/mirror-glow.png" alt="" className="mirror-glow" />
              
              {!progress.keysFound.includes('key-mirror') && (
                <>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '20%',
                      top: '15%',
                      width: '33%',
                      height: '18%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(1);
                    }}
                  >
                    <img src="/art/sprites/star.png" alt="Star" />
                  </div>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '57%',
                      top: '40%',
                      width: '33%',
                      height: '18%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(2);
                    }}
                  >
                    <img src="/art/sprites/star.png" alt="Star" />
                  </div>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '22%',
                      top: '65%',
                      width: '33%',
                      height: '18%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(3);
                    }}
                  >
                    <img src="/art/sprites/star.png" alt="Star" />
                  </div>
                </>
              )}
              
              {progress.puzzleStates.mirrorSequence.length === 3 && !progress.keysFound.includes('key-mirror') && (
                <div 
                  className="sprite key key-mirror clickable sparkle"
                  style={{
                    position: 'absolute',
                    left: '35%',
                    top: '35%',
                    width: '27%',
                    height: '30%',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    collectKey('key-mirror');
                  }}
                >
                  <img src="/art/sprites/key.png" alt="Key" />
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Jewellery box */}
        <div 
          className="sprite jewellery-box clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'jewellery-box-closed'))}
          onClick={handleJewelleryBoxClick}
        >
          <img 
            src={progress.puzzleStates.jewelleryOpen 
              ? '/art/sprites/jewellery-box-open.png' 
              : '/art/sprites/jewellery-box-closed.png'
            } 
            alt="Jewellery Box" 
            className={progress.puzzleStates.jewelleryOpen ? 'pop-in' : ''}
          />
        </div>
        
        {progress.puzzleStates.jewelleryOpen && !progress.keysFound.includes('key-jewellery') && (
          <div 
            className="sprite key key-jewellery clickable sparkle rise"
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-jewellery'))}
            onClick={() => collectKey('key-jewellery')}
          >
            <img src="/art/sprites/key.png" alt="Key" />
          </div>
        )}
        
        {/* Music box */}
        <div 
          className="sprite music-box clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'music-box'))}
          onClick={handleMusicBoxClick}
        >
          <img 
            src="/art/sprites/music-box.png" 
            alt="Music Box" 
            className={musicBoxPlaying ? 'spinning' : ''}
          />
        </div>
        
        {/* Wardrobe */}
        <div 
          className="sprite wardrobe-hitbox clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'wardrobe-open'))}
          onClick={handleWardrobeClick}
        >
          {progress.puzzleStates.wardrobeOpen && (
            <>
              <img src="/art/sprites/wardrobe-open.png" alt="" className="wardrobe-open scale-in" />
              
              {!progress.keysFound.includes('key-wardrobe') && (
                <div 
                  className="dress-pocket-hitbox clickable"
                  style={{
                    position: 'absolute',
                    left: '45%',
                    top: '50%',
                    width: '10%',
                    height: '15%',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDressClick();
                  }}
                >
                  <div className="sprite key key-wardrobe sparkle">
                    <img src="/art/sprites/key.png" alt="Key" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Teddy */}
        <div 
          className={`sprite teddy clickable ${progress.puzzleStates.teddyWiggled && !progress.puzzleStates.teddyMoved ? 'wiggle' : ''}`}
          style={{
            ...getObjectStyle(layout.objects.find(o => o.id === 'teddy')),
            left: progress.puzzleStates.teddyMoved ? '34%' : '27%',
            transition: 'left 0.5s ease',
          }}
          onClick={handleTeddyClick}
        >
          <img src="/art/sprites/teddy.png" alt="Teddy Bear" />
        </div>
        
        {progress.puzzleStates.teddyMoved && !progress.keysFound.includes('key-teddy') && (
          <div 
            className="sprite key key-teddy clickable sparkle"
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-teddy'))}
            onClick={() => collectKey('key-teddy')}
          >
            <img src="/art/sprites/key.png" alt="Key" />
          </div>
        )}
        
        {/* Toy chest */}
        <div 
          className="sprite toy-chest clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'toy-chest-closed'))}
          onClick={handleToyChestClick}
        >
          <img 
            src={toyChestOpen 
              ? '/art/sprites/toy-chest-open.png' 
              : '/art/sprites/toy-chest-closed.png'
            } 
            alt="Toy Chest" 
            className={toyChestOpen ? 'bounce' : ''}
          />
        </div>
        
        {/* Dragon toy */}
        <div 
          className="sprite dragon clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'dragon-toy'))}
          onClick={handleDragonClick}
        >
          <img src="/art/sprites/dragon.png" alt="Dragon" />
        </div>
        
        {/* Kitten */}
        <div 
          className="sprite kitten clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'kitten-sit'))}
          onClick={handleKittenClick}
        >
          <img 
            src={kittenPlaying 
              ? '/art/sprites/kitten-play.png' 
              : '/art/sprites/kitten-sit.png'
            } 
            alt="Kitten" 
          />
        </div>
        
        {/* Door */}
        <div 
          className={`sprite door-hitbox clickable ${doorGlowing ? 'glow-pulse' : ''}`}
          style={getObjectStyle(layout.objects.find(o => o.id === 'door'))}
          onClick={handleDoorClick}
        >
          {doorOpen && (
            <img src="/art/sprites/door-open-overlay.png" alt="" className="door-open fade-in" />
          )}
        </div>
        
        {/* Fairy */}
        {fairyVisible && (
          <div 
            className={`sprite fairy ${fairyCheer ? 'cheer' : 'float'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'fairy'))}
          >
            <img 
              src={fairyCheer 
                ? '/art/sprites/fairy-cheer.png' 
                : '/art/sprites/fairy-talk.png'
              } 
              alt="Fairy" 
            />
            {fairyText && (
              <div className="speech-bubble">
                {fairyText}
              </div>
            )}
          </div>
        )}
        
        {/* Key counter */}
        <div className="key-counter">
          <div className="key-slots">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`key-slot ${i < progress.keysFound.length ? 'filled' : ''}`}
              >
                {i < progress.keysFound.length && (
                  <img src="/art/sprites/key.png" alt="Key" className="key-icon" />
                )}
              </div>
            ))}
          </div>
          <div className="key-count">{progress.keysFound.length} / 5</div>
        </div>
        
        {/* Mute button */}
        <button 
          className="mute-button"
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        
        {/* Reset button (long press) */}
        <button 
          className="reset-button"
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          title="Long press to reset"
        >
          ↻
        </button>
      </div>
    </div>
  );
}

export default GameScene;
