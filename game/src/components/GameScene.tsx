import { useState, useEffect, useRef } from 'react';
import type { GameProgress, Layout } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress, resetProgress } from '../gameState';
import './GameScene.css';

interface GameSceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
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
  const [dragonWiggling, setDragonWiggling] = useState(false);
  const [flyingKeysToLocks, setFlyingKeysToLocks] = useState<number[]>([]);
  const [collectingKey, setCollectingKey] = useState<string | null>(null);
  
  const progressRef = useRef(progress);
  const lastInteractionRef = useRef<number>(Date.now());
  const hintTimerRef = useRef<number | null>(null);
  const hintIndexRef = useRef<number>(0);
  const hintCountRef = useRef<number>(0);
  const longPressTimerRef = useRef<number | null>(null);
  const introAbortedRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    loadLayout();
    startIntro();

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
    const response = await fetch('layout.json');
    const data = await response.json();
    setLayout(data);
  };

  const startIntro = async () => {
    // Skip intro if progress already exists (after refresh)
    if (progressRef.current.keysFound.length > 0) {
      setFairyVisible(true);
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setFairyVisible(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await audioManager.playSpeech('narr-intro');
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await audioManager.playSpeech('narr-fairy-arrives');
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setFairyText(audioManager.getText('fairy-intro'));
    await audioManager.playSpeech('fairy-intro');
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setFairyText(audioManager.getText('fairy-start'));
    await audioManager.playSpeech('fairy-start');
    if (introAbortedRef.current) {
      setFairyText('');
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
    
    // Start hint system after intro completes
    lastInteractionRef.current = Date.now();
    startHintSystem();
  };

  const startHintSystem = () => {
    const checkHints = () => {
      const currentProgress = progressRef.current;
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      
      // Stop hints if all keys found or unlocking
      if (currentProgress.keysFound.length === 5 || unlocking) {
        return;
      }
      
      // Give hint after 25s, max once per 25s
      if (timeSinceInteraction > 25000 && hintCountRef.current === 0) {
        giveHint();
        hintCountRef.current = 1;
      }
      
      hintTimerRef.current = window.setTimeout(checkHints, 5000);
    };
    
    checkHints();
  };

  const giveHint = async () => {
    const currentProgress = progressRef.current;
    const missingKeys = KEY_PUZZLES.filter(key => !currentProgress.keysFound.includes(key));
    
    if (missingKeys.length === 0) return;
    if (fairyText) return; // Skip if fairy is already speaking
    
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
    
    setFairyText(audioManager.getText(hintId));
    await audioManager.playSpeech(hintId, 5000);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const recordInteraction = () => {
    lastInteractionRef.current = Date.now();
    hintIndexRef.current = 0;
    hintCountRef.current = 0;
    introAbortedRef.current = true;
  };

  const collectKey = async (keyId: string) => {
    const currentProgress = progressRef.current;
    if (currentProgress.keysFound.includes(keyId)) return;
    
    recordInteraction();
    
    audioManager.playSound('audio/sfx/sparkle.mp3');
    audioManager.playSound('audio/sfx/key-found.mp3');
    
    // Show fly animation
    setCollectingKey(keyId);
    await new Promise(resolve => setTimeout(resolve, 600));
    setCollectingKey(null);
    
    // Update progress with functional update
    setProgress(p => {
      const newKeysFound = [...p.keysFound, keyId];
      return { ...p, keysFound: newKeysFound };
    });
    
    const newLength = currentProgress.keysFound.length + 1;
    
    setFairyCheer(true);
    const foundLineId = `fairy-found-${newLength}`;
    setFairyText(audioManager.getText(foundLineId));
    await audioManager.playSpeech(foundLineId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFairyCheer(false);
    setFairyText('');
  };

  const triggerDoorGlow = async () => {
    // Wait for 5th key praise to finish (~3s)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setDoorGlowing(true);
    audioManager.playSound('audio/sfx/door-glow-loop.mp3', true);
    
    setFairyText(audioManager.getText('fairy-door-glow'));
    await audioManager.playSpeech('fairy-door-glow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const unlockDoor = async () => {
    if (progressRef.current.keysFound.length < 5 || unlocking) return;
    
    setUnlocking(true);
    setDoorGlowing(false); // Remove glow while unlocking
    audioManager.stopLoop('audio/sfx/door-glow-loop.mp3');
    
    // Start narration (with timeout race)
    setFairyText(audioManager.getText('narr-unlock'));
    const narrationPromise = audioManager.playSpeech('narr-unlock');
    
    // Animate keys flying to locks (starts immediately, runs alongside narration)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 0; i < 5; i++) {
      setFlyingKeysToLocks(prev => [...prev, i]);
      audioManager.playSound('audio/sfx/lock-click.mp3');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Wait a bit, then open door
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    audioManager.playSound('audio/sfx/door-open-magic.mp3');
    audioManager.playSound('audio/sfx/celebration-fanfare.mp3');
    setDoorOpen(true);
    
    // Wait for narration or continue after timeout
    await narrationPromise;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyCheer(true);
    setFairyText(audioManager.getText('fairy-final'));
    await audioManager.playSpeech('fairy-final');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFairyText('');
    onComplete();
  };

  // Puzzle handlers
  const handleTeddyClick = () => {
    recordInteraction();
    
    const currentProgress = progressRef.current;
    if (!currentProgress.puzzleStates.teddyWiggled) {
      audioManager.playSound('audio/sfx/wiggle-boing.mp3');
      setProgress(p => ({
        ...p,
        puzzleStates: { ...p.puzzleStates, teddyWiggled: true }
      }));
    } else if (!currentProgress.puzzleStates.teddyMoved) {
      audioManager.playSound('audio/sfx/wiggle-boing.mp3');
      setProgress(p => ({
        ...p,
        puzzleStates: { ...p.puzzleStates, teddyMoved: true }
      }));
      setTimeout(() => collectKey('key-teddy'), 500);
    }
  };

  const handleJewelleryBoxClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.puzzleStates.jewelleryOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/lid-click.mp3');
    setProgress(p => ({
      ...p,
      puzzleStates: { ...p.puzzleStates, jewelleryOpen: true }
    }));
    setTimeout(() => collectKey('key-jewellery'), 500);
  };

  const handleCurtainClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.puzzleStates.curtainOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/curtain-swish.mp3');
    setProgress(p => ({
      ...p,
      puzzleStates: { ...p.puzzleStates, curtainOpen: true }
    }));
    setTimeout(() => collectKey('key-curtain'), 500);
  };

  const handleWardrobeClick = () => {
    recordInteraction();
    
    const currentProgress = progressRef.current;
    if (!currentProgress.puzzleStates.wardrobeOpen) {
      audioManager.playSound('audio/sfx/tap-pop.mp3');
      setProgress(p => ({
        ...p,
        puzzleStates: { ...p.puzzleStates, wardrobeOpen: true }
      }));
    }
  };

  const handleDressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentProgress = progressRef.current;
    if (!currentProgress.puzzleStates.wardrobeOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setTimeout(() => collectKey('key-wardrobe'), 300);
  };

  const handleMirrorClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setProgress(p => ({
      ...p,
      puzzleStates: { ...p.puzzleStates, mirrorGlow: true, mirrorSequence: [] }
    }));
    
    // Demo the sequence
    setTimeout(() => {
      [1, 2, 3].forEach((n, i) => {
        setTimeout(() => {
          audioManager.playSound(`audio/sfx/star-${n}.mp3`);
        }, i * 400);
      });
    }, 500);
  };

  const handleStarClick = (order: number) => {
    const currentProgress = progressRef.current;
    if (!currentProgress.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    
    const sequence = currentProgress.puzzleStates.mirrorSequence;
    
    if (order === sequence.length + 1) {
      // Correct!
      audioManager.playSound(`audio/sfx/star-${order}.mp3`);
      
      const newSequence = [...sequence, order];
      setProgress(p => ({
        ...p,
        puzzleStates: { ...p.puzzleStates, mirrorSequence: newSequence }
      }));
      
      if (newSequence.length === 3) {
        // Show key after completing sequence
        setTimeout(() => {
          // Key appears, wait for tap
        }, 500);
      }
    } else {
      // Wrong order - replay demo
      audioManager.playSound('audio/sfx/star-reset.mp3');
      audioManager.playSpeech('hint-mirror-5');
      setProgress(p => ({
        ...p,
        puzzleStates: { ...p.puzzleStates, mirrorSequence: [] }
      }));
      
      // Replay demo
      setTimeout(() => {
        [1, 2, 3].forEach((n, i) => {
          setTimeout(() => {
            audioManager.playSound(`audio/sfx/star-${n}.mp3`);
          }, i * 400);
        });
      }, 1000);
    }
  };

  const handleMirrorKeyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordInteraction();
    collectKey('key-mirror');
  };

  const handleFloatingKeyClick = (keyId: string) => {
    collectKey(keyId);
  };

  // Fun interactive elements
  const handleKittenClick = async () => {
    recordInteraction();
    const meow = Math.random() > 0.5 ? 'audio/sfx/kitten-meow-1.mp3' : 'audio/sfx/kitten-meow-2.mp3';
    audioManager.playSound(meow);
    
    setKittenPlaying(true);
    setTimeout(() => setKittenPlaying(false), 2000);
    
    setFairyText(audioManager.getText('curious-kitten'));
    await audioManager.playSpeech('curious-kitten', 4000);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const handleMusicBoxClick = async () => {
    recordInteraction();
    
    if (musicBoxPlaying) {
      audioManager.stopLoop('audio/sfx/music-box-loop.mp3');
      setMusicBoxPlaying(false);
    } else {
      audioManager.playSound('audio/sfx/music-box-loop.mp3', true);
      setMusicBoxPlaying(true);
      
      setFairyText(audioManager.getText('curious-musicbox'));
      await audioManager.playSpeech('curious-musicbox', 5000);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyText('');
    }
  };

  const handleToyChestClick = async () => {
    recordInteraction();
    audioManager.playSound('audio/sfx/tap-pop.mp3');
    
    setToyChestOpen(!toyChestOpen);
    
    if (!toyChestOpen) {
      setFairyText(audioManager.getText('curious-chest'));
      await audioManager.playSpeech('curious-chest', 4000);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyText('');
    }
  };

  const handleDragonClick = async () => {
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    setDragonWiggling(true);
    setTimeout(() => setDragonWiggling(false), 500);
    
    setFairyText(audioManager.getText('curious-dragon'));
    await audioManager.playSpeech('curious-dragon', 4000);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const handleDoorClick = async () => {
    recordInteraction();
    
    if (progressRef.current.keysFound.length === 5) {
      await unlockDoor();
    } else {
      setFairyText(audioManager.getText('curious-door-locked'));
      await audioManager.playSpeech('curious-door-locked', 6000);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyText('');
    }
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  const handleLongPressStart = () => {
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
        <img src="art/bg-bedroom.jpg" alt="Princess's Bedroom" className="game-bg" />
        
        {/* Curtain overlay */}
        {!progress.puzzleStates.curtainOpen && (
          <div 
            className="sprite curtain-closed clickable"
            style={getObjectStyle(layout.objects.find(o => o.id === 'curtain-closed'))}
            onClick={handleCurtainClick}
          >
            <img src="art/sprites/curtain-closed-overlay.png" alt="" />
          </div>
        )}
        
        {/* Key behind curtain */}
        {progress.puzzleStates.curtainOpen && !progress.keysFound.includes('key-curtain') && (
          <div 
            className={`sprite key key-curtain clickable sparkle ${collectingKey === 'key-curtain' ? 'collecting' : 'float-up'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-curtain'))}
            onClick={() => handleFloatingKeyClick('key-curtain')}
          >
            <img src="art/sprites/key.png" alt="Key" style={{ rotate: '-10deg' }} />
          </div>
        )}
        
        {/* Mirror and stars puzzle */}
        <div 
          className="sprite mirror-hitbox clickable"
          style={{
            ...getObjectStyle(layout.objects.find(o => o.id === 'mirror-glow')),
            zIndex: progress.puzzleStates.mirrorGlow ? 35 : 25,
          }}
          onClick={handleMirrorClick}
        >
          {progress.puzzleStates.mirrorGlow && (
            <>
              <img src="art/sprites/mirror-glow.png" alt="" className="mirror-glow" />
              
              {!progress.keysFound.includes('key-mirror') && progress.puzzleStates.mirrorSequence.length < 3 && (
                <>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '27%',
                      top: '22%',
                      width: '45%',
                      height: '20%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(1);
                    }}
                  >
                    <img src="art/sprites/star.png" alt="Star 1" />
                  </div>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '27%',
                      top: '45%',
                      width: '45%',
                      height: '20%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(2);
                    }}
                  >
                    <img src="art/sprites/star.png" alt="Star 2" />
                  </div>
                  <div 
                    className="sprite star clickable twinkle"
                    style={{
                      position: 'absolute',
                      left: '27%',
                      top: '68%',
                      width: '45%',
                      height: '20%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(3);
                    }}
                  >
                    <img src="art/sprites/star.png" alt="Star 3" />
                  </div>
                </>
              )}
              
              {progress.puzzleStates.mirrorSequence.length === 3 && !progress.keysFound.includes('key-mirror') && (
                <div 
                  className={`sprite key key-mirror clickable sparkle ${collectingKey === 'key-mirror' ? 'collecting' : 'float-up'}`}
                  style={{
                    position: 'absolute',
                    left: '35%',
                    top: '35%',
                    width: '30%',
                    height: '30%',
                  }}
                  onClick={handleMirrorKeyClick}
                >
                  <img src="art/sprites/key.png" alt="Key" />
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
              ? 'art/sprites/jewellery-box-open.png' 
              : 'art/sprites/jewellery-box-closed.png'
            } 
            alt="Jewellery Box" 
            className={progress.puzzleStates.jewelleryOpen ? 'pop-in' : ''}
          />
        </div>
        
        {progress.puzzleStates.jewelleryOpen && !progress.keysFound.includes('key-jewellery') && (
          <div 
            className={`sprite key key-jewellery clickable sparkle ${collectingKey === 'key-jewellery' ? 'collecting' : 'float-up'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-jewellery'))}
            onClick={() => handleFloatingKeyClick('key-jewellery')}
          >
            <img src="art/sprites/key.png" alt="Key" style={{ rotate: '70deg' }} />
          </div>
        )}
        
        {/* Music box */}
        <div 
          className="sprite music-box clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'music-box'))}
          onClick={handleMusicBoxClick}
        >
          <img 
            src="art/sprites/music-box.png" 
            alt="Music Box" 
            className={musicBoxPlaying ? 'sway' : ''}
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
              <img src="art/sprites/wardrobe-open.png" alt="" className="wardrobe-open scale-in" />
              
              {!progress.keysFound.includes('key-wardrobe') && (
                <div 
                  className="dress-pocket-hitbox clickable"
                  style={{
                    position: 'absolute',
                    left: '33%',
                    top: '40%',
                    width: '34%',
                    height: '40%',
                  }}
                  onClick={handleDressClick}
                >
                  <div 
                    className={`sprite key key-wardrobe sparkle ${collectingKey === 'key-wardrobe' ? 'collecting' : 'float-up'}`}
                    style={{
                      position: 'absolute',
                      left: '39%',
                      top: '29%',
                      width: '22%',
                      height: '30%',
                    }}
                  >
                    <img src="art/sprites/key.png" alt="Key" style={{ rotate: '15deg' }} />
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
          <img src="art/sprites/teddy.png" alt="Teddy Bear" />
        </div>
        
        {progress.puzzleStates.teddyMoved && !progress.keysFound.includes('key-teddy') && (
          <div 
            className={`sprite key key-teddy clickable sparkle ${collectingKey === 'key-teddy' ? 'collecting' : 'float-up'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'key-teddy'))}
            onClick={() => handleFloatingKeyClick('key-teddy')}
          >
            <img src="art/sprites/key.png" alt="Key" style={{ rotate: '80deg' }} />
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
              ? 'art/sprites/toy-chest-open.png' 
              : 'art/sprites/toy-chest-closed.png'
            } 
            alt="Toy Chest" 
            className={toyChestOpen ? 'bounce' : ''}
          />
        </div>
        
        {/* Dragon toy */}
        <div 
          className={`sprite dragon clickable ${dragonWiggling ? 'wiggle' : ''}`}
          style={getObjectStyle(layout.objects.find(o => o.id === 'dragon-toy'))}
          onClick={handleDragonClick}
        >
          <img src="art/sprites/dragon.png" alt="Dragon" />
        </div>
        
        {/* Kitten */}
        <div 
          className="sprite kitten clickable"
          style={getObjectStyle(layout.objects.find(o => o.id === 'kitten-sit'))}
          onClick={handleKittenClick}
        >
          <img 
            src={kittenPlaying 
              ? 'art/sprites/kitten-play.png' 
              : 'art/sprites/kitten-sit.png'
            } 
            alt="Kitten" 
          />
        </div>
        
        {/* Door */}
        <div 
          className={`sprite door-hitbox clickable ${doorGlowing ? 'glow-pulse' : ''}`}
          style={getObjectStyle(layout.objects.find(o => o.id === 'door'))}
          onClick={handleDoorClick}
        />
        
        {/* Door open overlay */}
        {doorOpen && (
          <div 
            className="sprite door-open-overlay fade-in"
            style={getObjectStyle(layout.objects.find(o => o.id === 'door-open'))}
          >
            <img src="art/sprites/door-open-overlay.png" alt="" />
          </div>
        )}
        
        {/* Fairy */}
        {fairyVisible && (
          <div 
            className={`sprite fairy ${fairyCheer ? 'cheer' : 'float'}`}
            style={getObjectStyle(layout.objects.find(o => o.id === 'fairy'))}
          >
            <img 
              src={fairyCheer 
                ? 'art/sprites/fairy-cheer.png' 
                : 'art/sprites/fairy-talk.png'
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
                  <img src="art/sprites/key.png" alt="Key" className="key-icon" />
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
        
        {/* Flying keys to locks animation */}
        {!doorOpen && flyingKeysToLocks.map((lockIndex) => {
          const lock = layout.objects.find(o => o.id === `door-lock-${lockIndex + 1}`);
          if (!lock || !lock.d) return null;
          
          const keyWidth = lock.d * 1.4;
          const keyHeight = lock.d * 1.4 * (16 / 9);
          
          return (
            <div
              key={`flying-key-${lockIndex}`}
              className="flying-key-to-lock"
              style={{
                '--start-x': '50%',
                '--start-y': '6%',
                '--end-x': `${lock.cx}%`,
                '--end-y': `${lock.cy}%`,
                position: 'absolute',
                width: `${keyWidth}%`,
                height: `${keyHeight}%`,
                zIndex: 100,
              } as React.CSSProperties}
            >
              <img src="art/sprites/key.png" alt="" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameScene;
