import { useState, useEffect, useRef } from 'react';
import type { GameProgress, Layout } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress, resetProgress } from '../gameState';
import LookForPreview from './LookForPreview';
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
  const [showKeyPreview, setShowKeyPreview] = useState(false);
  const [fairyVisible, setFairyVisible] = useState(false);
  const [fairyArriving, setFairyArriving] = useState(false);
  const [narratorSpeaking, setNarratorSpeaking] = useState(false);
  const [fairyCheer, setFairyCheer] = useState(false);
  const [fairyFlyingToDoor, setFairyFlyingToDoor] = useState(false);
  const [fairyAtDoor, setFairyAtDoor] = useState(false);
  const [doorGlowing, setDoorGlowing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [waitingForFollow, setWaitingForFollow] = useState(false);
  const followTappedRef = useRef(false);
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
  const introRunningRef = useRef(false);
  const unlockingRef = useRef(false);
  const completedRef = useRef(false);
  const pendingDoorRef = useRef(false);
  const keysInFlightRef = useRef(0);
  const doorGlowStartedRef = useRef(false);

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
    if (progress.chapter1.keysFound.length === 5 && !doorGlowStartedRef.current) {
      doorGlowStartedRef.current = true;
      triggerDoorGlow();
      // Door tapped while the 5th key was still flying to the counter
      if (pendingDoorRef.current) {
        pendingDoorRef.current = false;
        unlockDoor();
      }
    }
  }, [progress]);

  const loadLayout = async () => {
    const response = await fetch('layout.json');
    const data = await response.json();
    setLayout(data);
  };

  const startIntro = async () => {
    // Skip intro if progress already exists (after refresh)
    if (progressRef.current.chapter1.keysFound.length > 0) {
      setFairyVisible(true);
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    introRunningRef.current = true;
    // Pip stays hidden until the narrator says she appears
    setFairyVisible(false);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (introAbortedRef.current) {
      setFairyVisible(true);
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setNarratorSpeaking(true);
    setFairyText(audioManager.getText('narr-intro'));
    await audioManager.playSpeech('narr-intro');
    if (introAbortedRef.current) {
      setNarratorSpeaking(false);
      setFairyVisible(true);
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
    
    setFairyText(audioManager.getText('narr-fairy-arrives'));
    const arrivesLine = audioManager.playSpeech('narr-fairy-arrives');
    // Big arrival on "with a twinkle and a shimmer"
    await new Promise(resolve => setTimeout(resolve, 1400));
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setFairyArriving(true);
    setFairyVisible(true);
    window.setTimeout(() => setFairyArriving(false), 2600);
    await Promise.race([arrivesLine, new Promise(resolve => setTimeout(resolve, 6000))]);
    setNarratorSpeaking(false);
    setFairyText('');
    // Let the entrance finish before Pip speaks
    await new Promise(resolve => setTimeout(resolve, 900));
    if (introAbortedRef.current) {
      setFairyVisible(true);
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    if (introAbortedRef.current) {
      setFairyText('');
      introRunningRef.current = false;
      lastInteractionRef.current = Date.now();
      startHintSystem();
      return;
    }
    
    setFairyText(audioManager.getText('fairy-intro'));
    await audioManager.playSpeech('fairy-intro');
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
    
    setFairyText(audioManager.getText('fairy-start'));
    setShowKeyPreview(true);
    await audioManager.playSpeech('fairy-start');
    setShowKeyPreview(false);
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
    
    // Start hint system after intro completes
    lastInteractionRef.current = Date.now();
    startHintSystem();
  };

  const startHintSystem = () => {
    const checkHints = () => {
      const currentProgress = progressRef.current;
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      
      // Stop hints if all keys found or unlocking
      if (currentProgress.chapter1.keysFound.length === 5 || unlocking) {
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
    const missingKeys = KEY_PUZZLES.filter(key => !currentProgress.chapter1.keysFound.includes(key));
    
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
    await audioManager.playSpeech(hintId);
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
    if (currentProgress.chapter1.keysFound.includes(keyId)) return;
    
    recordInteraction();
    
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    // Play key-found chime (don't await - let it play alongside)
    audioManager.playSoundEffect('audio/sfx/key-found.mp3');
    
    // Wait for chime to mostly finish, then small delay before narration
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Show fly animation
    keysInFlightRef.current++;
    setCollectingKey(keyId);
    await new Promise(resolve => setTimeout(resolve, 400));
    setCollectingKey(null);
    
    // Update progress with functional update
    setProgress(p => {
      const newKeysFound = [...p.chapter1.keysFound, keyId];
      return { ...p, chapter1: { ...p.chapter1, keysFound: newKeysFound } };
    });
    keysInFlightRef.current = Math.max(0, keysInFlightRef.current - 1);
    
    const newLength = currentProgress.chapter1.keysFound.length + 1;
    
    setFairyCheer(true);
    const foundLineId = `fairy-found-${newLength}`;
    setFairyText(audioManager.getText(foundLineId));
    await audioManager.playSpeech(foundLineId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFairyCheer(false);
    setFairyText('');
  };

  const triggerDoorGlow = async () => {
    // Glow right away; the fairy's line waits for the 5th-key praise (5.5s) to finish
    setDoorGlowing(true);
    audioManager.playSound('audio/sfx/door-glow-loop.mp3', true);
    
    // Check for early door tap before fairy flies
    if (pendingDoorRef.current && !unlockingRef.current) {
      pendingDoorRef.current = false;
      unlockDoor();
      return;
    }
    
    // Start fairy flying to door after a brief moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFairyCheer(false);
    setFairyFlyingToDoor(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    // Check for door tap during fairy flight
    if (pendingDoorRef.current && !unlockingRef.current) {
      pendingDoorRef.current = false;
      // Let fairy finish flying
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyFlyingToDoor(false);
      setFairyAtDoor(true);
      unlockDoor();
      return;
    }
    
    // Wait for fairy to reach door (1.5s animation)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyFlyingToDoor(false);
    setFairyAtDoor(true);
    
    // Check again after fairy lands
    if (pendingDoorRef.current && !unlockingRef.current) {
      pendingDoorRef.current = false;
      unlockDoor();
      return;
    }
    
    // Wait a bit more for total 6s (to let 5th-key praise finish)
    await new Promise(resolve => setTimeout(resolve, 2500));
    if (unlockingRef.current) return; // door already tapped, don't talk over the finale
    
    setFairyText(audioManager.getText('fairy-door-glow'));
    await audioManager.playSpeech('fairy-door-glow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (!unlockingRef.current) setFairyText('');
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const finishGame = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  const unlockDoor = async () => {
    if (progressRef.current.chapter1.keysFound.length < 5 || unlockingRef.current) return;
    unlockingRef.current = true;
    
    // Failsafe: Pip always ends up at the door asking to be followed, whatever happens to audio
    window.setTimeout(() => { if (!completedRef.current) setWaitingForFollow(true); }, 30000);
    
    setUnlocking(true);
    setDoorGlowing(false); // Remove glow while unlocking
    audioManager.stopLoop('audio/sfx/door-glow-loop.mp3');
    
    // Start narration (never waited on for longer than its length + margin)
    setFairyText(audioManager.getText('narr-unlock'));
    const narrationPromise = audioManager.playSpeech('narr-unlock');
    
    // Animate keys flying to locks (starts immediately, runs alongside narration)
    await sleep(1000);
    
    for (let i = 0; i < 5; i++) {
      setFlyingKeysToLocks(prev => [...prev, i]);
      audioManager.playSound('audio/sfx/lock-click.mp3');
      await sleep(300);
    }
    
    // Wait a bit, then open door
    await sleep(1500);
    
    audioManager.playSound('audio/sfx/door-open-magic.mp3');
    audioManager.playSound('audio/sfx/celebration-fanfare.mp3');
    setDoorOpen(true);
    
    // Pip stays at the open door
    setFairyFlyingToDoor(false);
    setFairyAtDoor(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    await Promise.race([narrationPromise, sleep(10000)]);
    await sleep(500);
    
    setFairyCheer(true);
    setFairyText(audioManager.getText('fairy-final'));
    await Promise.race([audioManager.playSpeech('fairy-final'), sleep(11000)]);
    await sleep(600);
    setFairyCheer(false);

    // Pip waits at the door: tap her to follow her into Chapter 2
    setWaitingForFollow(true);
    if (followTappedRef.current) return;
    setFairyText(audioManager.getText('fairy-follow'));
    await Promise.race([audioManager.playSpeech('fairy-follow'), sleep(6000)]);
    // Say it once more if nobody has tapped yet
    await sleep(9000);
    if (followTappedRef.current || completedRef.current) return;
    setFairyText(audioManager.getText('fairy-follow'));
    await Promise.race([audioManager.playSpeech('fairy-follow'), sleep(6000)]);
  };

  const handleFollowPip = async () => {
    if (!waitingForFollow || followTappedRef.current) return;
    followTappedRef.current = true;
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setFairyText('');
    setFairyCheer(true);
    await sleep(900);
    setFairyVisible(false);
    await sleep(300);
    finishGame();
  };

  // Puzzle handlers
  const handleTeddyClick = () => {
    recordInteraction();
    
    const currentProgress = progressRef.current;
    if (!currentProgress.chapter1.puzzleStates.teddyWiggled) {
      audioManager.playSound('audio/sfx/wiggle-boing.mp3');
      setProgress(p => ({
        ...p,
        chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, teddyWiggled: true } }
      }));
    } else if (!currentProgress.chapter1.puzzleStates.teddyMoved) {
      audioManager.playSound('audio/sfx/wiggle-boing.mp3');
      setProgress(p => ({
        ...p,
        chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, teddyMoved: true } }
      }));
      setTimeout(() => collectKey('key-teddy'), 500);
    }
  };

  const handleJewelleryBoxClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.chapter1.puzzleStates.jewelleryOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/lid-click.mp3');
    setProgress(p => ({
      ...p,
      chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, jewelleryOpen: true } }
    }));
    setTimeout(() => collectKey('key-jewellery'), 500);
  };

  const handleCurtainClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.chapter1.puzzleStates.curtainOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/curtain-swish.mp3');
    setProgress(p => ({
      ...p,
      chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, curtainOpen: true } }
    }));
    setTimeout(() => collectKey('key-curtain'), 500);
  };

  const handleWardrobeClick = () => {
    recordInteraction();
    
    const currentProgress = progressRef.current;
    if (!currentProgress.chapter1.puzzleStates.wardrobeOpen) {
      audioManager.playSound('audio/sfx/tap-pop.mp3');
      setProgress(p => ({
        ...p,
        chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, wardrobeOpen: true } }
      }));
    }
  };

  const handleDressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentProgress = progressRef.current;
    if (!currentProgress.chapter1.puzzleStates.wardrobeOpen) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setTimeout(() => collectKey('key-wardrobe'), 300);
  };

  const handleMirrorClick = () => {
    const currentProgress = progressRef.current;
    if (currentProgress.chapter1.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    setProgress(p => ({
      ...p,
      chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, mirrorGlow: true, mirrorSequence: [] } }
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
    if (!currentProgress.chapter1.puzzleStates.mirrorGlow) return;
    
    recordInteraction();
    
    const sequence = currentProgress.chapter1.puzzleStates.mirrorSequence;
    
    if (order === sequence.length + 1) {
      // Correct!
      audioManager.playSound(`audio/sfx/star-${order}.mp3`);
      
      const newSequence = [...sequence, order];
      setProgress(p => ({
        ...p,
        chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, mirrorSequence: newSequence } }
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
        chapter1: { ...p.chapter1, puzzleStates: { ...p.chapter1.puzzleStates, mirrorSequence: [] } }
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
    
    // Skip speech during intro
    if (introRunningRef.current) return;
    
    setFairyText(audioManager.getText('curious-kitten'));
    await audioManager.playSpeech('curious-kitten');
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
      
      // Skip speech during intro
      if (introRunningRef.current) return;
      
      setFairyText(audioManager.getText('curious-musicbox'));
      await audioManager.playSpeech('curious-musicbox');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyText('');
    }
  };

  const handleToyChestClick = async () => {
    recordInteraction();
    audioManager.playSound('audio/sfx/tap-pop.mp3');
    
    setToyChestOpen(!toyChestOpen);
    
    if (!toyChestOpen) {
      // Skip speech during intro
      if (introRunningRef.current) return;
      
      setFairyText(audioManager.getText('curious-chest'));
      await audioManager.playSpeech('curious-chest');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFairyText('');
    }
  };

  const handleDragonClick = async () => {
    recordInteraction();
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    setDragonWiggling(true);
    setTimeout(() => setDragonWiggling(false), 500);
    
    // Skip speech during intro
    if (introRunningRef.current) return;
    
    setFairyText(audioManager.getText('curious-dragon'));
    await audioManager.playSpeech('curious-dragon');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFairyText('');
  };

  const handleDoorClick = async () => {
    recordInteraction();
    
    const totalKeys = progressRef.current.chapter1.keysFound.length + keysInFlightRef.current;
    
    if (totalKeys >= 5) {
      // Remember this tap - if unlocking can't start yet, triggerDoorGlow will handle it
      pendingDoorRef.current = true;
      
      // Try to unlock immediately if ready
      if (progressRef.current.chapter1.keysFound.length === 5 && !unlockingRef.current) {
        pendingDoorRef.current = false;
        await unlockDoor();
      }
    } else {
      // Skip speech during intro
      if (introRunningRef.current) return;
      
      setFairyText(audioManager.getText('curious-door-locked'));
      await audioManager.playSpeech('curious-door-locked');
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
        {!progress.chapter1.puzzleStates.curtainOpen && (
          <div 
            className="sprite curtain-closed clickable"
            style={getObjectStyle(layout.objects.find(o => o.id === 'curtain-closed'))}
            onClick={handleCurtainClick}
          >
            <img src="art/sprites/curtain-closed-overlay.png" alt="" />
          </div>
        )}
        
        {/* Key behind curtain */}
        {progress.chapter1.puzzleStates.curtainOpen && !progress.chapter1.keysFound.includes('key-curtain') && (
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
            zIndex: progress.chapter1.puzzleStates.mirrorGlow ? 35 : 25,
          }}
          onClick={handleMirrorClick}
        >
          {progress.chapter1.puzzleStates.mirrorGlow && (
            <>
              <img src="art/sprites/mirror-glow.png" alt="" className="mirror-glow" />
              
              {!progress.chapter1.keysFound.includes('key-mirror') && progress.chapter1.puzzleStates.mirrorSequence.length < 3 && (
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
              
              {progress.chapter1.puzzleStates.mirrorSequence.length === 3 && !progress.chapter1.keysFound.includes('key-mirror') && (
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
            src={progress.chapter1.puzzleStates.jewelleryOpen 
              ? 'art/sprites/jewellery-box-open.png' 
              : 'art/sprites/jewellery-box-closed.png'
            } 
            alt="Jewellery Box" 
            className={progress.chapter1.puzzleStates.jewelleryOpen ? 'pop-in' : ''}
          />
        </div>
        
        {progress.chapter1.puzzleStates.jewelleryOpen && !progress.chapter1.keysFound.includes('key-jewellery') && (
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
          {progress.chapter1.puzzleStates.wardrobeOpen && (
            <>
              <img src="art/sprites/wardrobe-open.png" alt="" className="wardrobe-open scale-in" />
              
              {!progress.chapter1.keysFound.includes('key-wardrobe') && (
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
          className={`sprite teddy clickable ${progress.chapter1.puzzleStates.teddyWiggled && !progress.chapter1.puzzleStates.teddyMoved ? 'wiggle' : ''}`}
          style={{
            ...getObjectStyle(layout.objects.find(o => o.id === 'teddy')),
            left: progress.chapter1.puzzleStates.teddyMoved ? '34%' : '27%',
            transition: 'left 0.5s ease',
          }}
          onClick={handleTeddyClick}
        >
          <img src="art/sprites/teddy.png" alt="Teddy Bear" />
        </div>
        
        {progress.chapter1.puzzleStates.teddyMoved && !progress.chapter1.keysFound.includes('key-teddy') && (
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
        
        {doorGlowing && (
          <img className="door-glow-overlay" src="art/sprites/door-glow.png" alt="" />
        )}

        {/* Sparkles around door when glowing */}
        {doorGlowing && (
          <>
            <div className="door-sparkle" style={{ position: 'absolute', left: '-12%', top: '8%', fontSize: '2.6rem', animation: 'sparkle-twinkle 1.2s ease-in-out 0s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '92%', top: '4%', fontSize: '3rem', animation: 'sparkle-twinkle 1.5s ease-in-out 0.15s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '-16%', top: '26%', fontSize: '4rem', animation: 'sparkle-twinkle 1.3s ease-in-out 0.3s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '100%', top: '22%', fontSize: '3.2rem', animation: 'sparkle-twinkle 1.7s ease-in-out 0.45s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '-14%', top: '44%', fontSize: '3.8rem', animation: 'sparkle-twinkle 1.4s ease-in-out 0.6s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '102%', top: '42%', fontSize: '3.3rem', animation: 'sparkle-twinkle 1.6s ease-in-out 0.75s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '-16%', top: '62%', fontSize: '4.2rem', animation: 'sparkle-twinkle 1.35s ease-in-out 0.9s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '100%', top: '60%', fontSize: '3.6rem', animation: 'sparkle-twinkle 1.55s ease-in-out 1.05s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '-12%', top: '80%', fontSize: '3.4rem', animation: 'sparkle-twinkle 1.45s ease-in-out 1.2s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
            <div className="door-sparkle" style={{ position: 'absolute', left: '98%', top: '80%', fontSize: '3.7rem', animation: 'sparkle-twinkle 1.25s ease-in-out 1.35s infinite', pointerEvents: 'none', zIndex: 100 }}>✨</div>
          </>
        )}
        
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
 className={`sprite fairy ${fairyArriving ? 'arriving' : ''} ${waitingForFollow ? 'follow-me clickable' : ''} ${
              fairyFlyingToDoor ? 'flying-to-door' : 
              fairyAtDoor ? 'at-door' : 
              fairyCheer ? 'cheer' : 'float'
            }`}
 style={getObjectStyle(layout.objects.find(o => o.id === 'fairy'))}
            onClick={handleFollowPip}
          >
            <img 
              src={fairyCheer 
                ? 'art/sprites/fairy-cheer.png' 
                : 'art/sprites/fairy-talk.png'
              } 
              alt="Fairy" 
            />
          </div>
        )}

        {/* Speech box: fixed spot away from the action, never on top of Pip */}
        {fairyText && (
          <div className={`speech-bubble ${narratorSpeaking ? 'narrator' : ''} ${
            narratorSpeaking ? 'pos-narrator' :
            progress.chapter1.keysFound.length === 5 || fairyFlyingToDoor || fairyAtDoor ? 'pos-bottom-left' : 'pos-top'
          }`}>
            {fairyText}
          </div>
        )}

        {/* Show what to look for while Pip explains */}
        {showKeyPreview && (
          <LookForPreview imageSrc="art/sprites/key.png" alt="A magic key" />
        )}
        
        {/* Key counter */}
        <div className="key-counter">
          <div className="key-slots">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`key-slot ${i < progress.chapter1.keysFound.length ? 'filled' : ''}`}
              >
                {i < progress.chapter1.keysFound.length && (
                  <img src="art/sprites/key.png" alt="Key" className="key-icon" />
                )}
              </div>
            ))}
          </div>
          <div className="key-count">{progress.chapter1.keysFound.length} / 5</div>
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
