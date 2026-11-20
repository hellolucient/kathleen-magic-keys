import { useState, useEffect, useRef } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import './Chapter5Scene.css';

interface Chapter5SceneProps {
  progress: GameProgress;
  setProgress: (updater: (prev: GameProgress) => GameProgress) => void;
  onComplete: () => void;
}

const CLOUD_POSITIONS = [
  { x: 15, y: 35 },
  { x: 45, y: 25 },
  { x: 72, y: 40 },
];

function Chapter5Scene({ progress, setProgress, onComplete }: Chapter5SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'hideseek' | 'crown' | 'ending'>('intro');
  const [smudgePosition, setSmudgePosition] = useState(0);
  const [timesFound, setTimesFound] = useState(0);
  const [smudgeSprite, setSmudgeSprite] = useState('peeking');
  const [showRainbow, setShowRainbow] = useState(false);
  const [crownPieces, setCrownPieces] = useState<string[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [smudgeFlying, setSmudgeFlying] = useState(false);
  
  const progressRef = useRef(progress);
  const containerRef = useRef<HTMLDivElement>(null);
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    // Reset chapter state
    setProgress(prev => ({
      ...prev,
      chapter5: { timesFound: 0, crownPieces: [] },
    }));
    
    startIntro();
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const startIntro = async () => {
    if (introRunningRef.current) return;
    introRunningRef.current = true;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await audioManager.playSpeech('narr-title', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('narr-intro', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    audioManager.playSound('audio/sfx/sparkle.mp3');
    await audioManager.playSpeech('smudge-cry', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-intro', 'ch5'));
    await audioManager.playSpeech('fairy-intro', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    introRunningRef.current = false;
    startHideSeek();
  };

  const startHideSeek = () => {
    setPhase('hideseek');
    setSmudgePosition(Math.floor(Math.random() * 3));
  };

  const findSmudge = async () => {
    if (phase !== 'hideseek') return;
    
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    const newFound = timesFound + 1;
    setTimesFound(newFound);
    
    setProgress(prev => ({
      ...prev,
      chapter5: { ...prev.chapter5, timesFound: newFound },
    }));
    
    const praiseLine = `fairy-found-${newFound}`;
    setFairyText(audioManager.getText(praiseLine, 'ch5'));
    await audioManager.playSpeech(praiseLine, 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    if (newFound < 3) {
      // Hide again
      setSmudgePosition(Math.floor(Math.random() * 3));
    } else {
      // Hide-and-seek complete
      await completeHideSeek();
    }
  };

  const completeHideSeek = async () => {
    setPhase('crown');
    setSmudgeSprite('shy');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await audioManager.playSpeech('smudge-sorry', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-crown', 'ch5'));
    await audioManager.playSpeech('fairy-crown', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
  };

  const handlePieceStart = (e: React.MouseEvent | React.TouchEvent, piece: string) => {
    e.preventDefault();
    if (crownPieces.includes(piece)) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setDraggingPiece(piece);
    setDragPosition({ x, y });
    
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');
  };

  const handlePieceMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPiece) return;
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

  const handlePieceEnd = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPiece) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const dropX = ((clientX - rect.left) / rect.width) * 100;
    const dropY = ((clientY - rect.top) / rect.height) * 100;
    
    // Check if dropped on crown (center area)
    const isOnCrown = dropX >= 42 && dropX <= 58 && dropY >= 28 && dropY <= 42;
    
    if (isOnCrown) {
      // Placed on crown!
      audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
      audioManager.playSound('audio/sfx/sparkle.mp3');
      
      const newPieces = [...crownPieces, draggingPiece];
      setCrownPieces(newPieces);
      
      setProgress(prev => ({
        ...prev,
        chapter5: { ...prev.chapter5, crownPieces: newPieces },
      }));
      
      const placeLine = `fairy-place-${draggingPiece}`;
      setFairyText(audioManager.getText(placeLine, 'ch5'));
      await audioManager.playSpeech(placeLine, 'ch5');
      await new Promise(resolve => setTimeout(resolve, 500));
      setFairyText('');
      
      if (newPieces.length === 3) {
        await completeCrown();
      }
    }
    
    setDraggingPiece(null);
  };

  const completeCrown = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    
    setPhase('ending');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Crown flies to Smudge
    setSmudgeSprite('laughing');
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await audioManager.playSpeech('smudge-happy', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFairyText(audioManager.getText('fairy-friends', 'ch5'));
    await audioManager.playSpeech('fairy-friends', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
    
    // Rainbow appears
    setShowRainbow(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await audioManager.playSpeech('narr-rainbow', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Smudge flies
    setSmudgeSprite('flying');
    setSmudgeFlying(true);
    
    await audioManager.playSpeech('smudge-ride', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await audioManager.playSpeech('narr-end', 'ch5');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete();
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  return (
    <div 
      className="game-scene chapter5-scene"
      ref={containerRef}
      onMouseMove={handlePieceMove}
      onMouseUp={handlePieceEnd}
      onTouchMove={handlePieceMove}
      onTouchEnd={handlePieceEnd}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img src="ch5/art/raw/bg-clouds.jpg" alt="Cloud Castle" className="game-bg" />
        
        {/* Rainbow */}
        {showRainbow && (
          <div className="rainbow fade-in" />
        )}
        
        {/* Hide-and-seek phase */}
        {phase === 'hideseek' && (
          <>
            {CLOUD_POSITIONS.map((pos, index) => (
              <div
                key={index}
                className={`cloud-hiding-spot ${index === smudgePosition ? 'has-smudge' : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {index === smudgePosition && (
                  <div 
                    className="smudge-peeking clickable wiggle"
                    onClick={findSmudge}
                    onTouchStart={(e) => { e.preventDefault(); findSmudge(); }}
                  >
                    <img src="ch5/art/sprites/smudge-peeking.png" alt="Smudge peeking" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        
        {/* Smudge sitting (crown phase) */}
        {phase === 'crown' && (
          <div className={`smudge-sitting ${crownPieces.length === 3 ? 'with-crown' : ''}`}>
            <img src={`ch5/art/sprites/smudge-${smudgeSprite}.png`} alt="Smudge" />
            {crownPieces.length === 3 && (
              <div className="crown-on-head">
                <img src="ch5/art/sprites/crown.png" alt="Crown" />
              </div>
            )}
          </div>
        )}
        
        {/* Flying Smudge (ending) */}
        {smudgeFlying && (
          <div className="smudge-flying-across">
            <img src="ch5/art/sprites/smudge-flying.png" alt="Smudge flying" />
            <div className="pip-riding">
              <img src="ch5/art/sprites/fairy-cheer.png" alt="Pip" />
            </div>
          </div>
        )}
        
        {/* Crown assembly */}
        {phase === 'crown' && crownPieces.length < 3 && (
          <div className="crown-assembly">
            <div className="crown-base">
              {crownPieces.length === 0 && <div className="crown-empty-circle" />}
              {crownPieces.map((piece, index) => (
                <div key={piece} className={`crown-piece-placed crown-piece-${index}`}>
                  {piece === 'petal' && <img src="ch5/art/sprites/rainbow-petal.png" alt="Petal" />}
                  {piece === 'gem' && <img src="ch5/art/sprites/purple-gem.png" alt="Gem" />}
                  {piece === 'light' && <img src="ch5/art/sprites/firefly.png" alt="Light" />}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Treasure tray */}
        {phase === 'crown' && (
          <div className="treasure-tray">
            {!crownPieces.includes('petal') && (
              draggingPiece === 'petal' ? (
                <div
                  className="treasure-piece dragging"
                  style={{
                    left: `${dragPosition.x}%`,
                    top: `${dragPosition.y}%`,
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  }}
                >
                  <img src="ch5/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />
                </div>
              ) : (
                <div
                  className="treasure-piece clickable"
                  onMouseDown={(e) => handlePieceStart(e, 'petal')}
                  onTouchStart={(e) => handlePieceStart(e, 'petal')}
                >
                  <img src="ch5/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />
                </div>
              )
            )}
            
            {!crownPieces.includes('gem') && (
              draggingPiece === 'gem' ? (
                <div
                  className="treasure-piece dragging"
                  style={{
                    left: `${dragPosition.x}%`,
                    top: `${dragPosition.y}%`,
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  }}
                >
                  <img src="ch5/art/sprites/purple-gem.png" alt="Purple Gem" />
                </div>
              ) : (
                <div
                  className="treasure-piece clickable"
                  onMouseDown={(e) => handlePieceStart(e, 'gem')}
                  onTouchStart={(e) => handlePieceStart(e, 'gem')}
                >
                  <img src="ch5/art/sprites/purple-gem.png" alt="Purple Gem" />
                </div>
              )
            )}
            
            {!crownPieces.includes('light') && (
              draggingPiece === 'light' ? (
                <div
                  className="treasure-piece dragging"
                  style={{
                    left: `${dragPosition.x}%`,
                    top: `${dragPosition.y}%`,
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  }}
                >
                  <img src="ch5/art/sprites/firefly.png" alt="Firefly Light" />
                </div>
              ) : (
                <div
                  className="treasure-piece clickable"
                  onMouseDown={(e) => handlePieceStart(e, 'light')}
                  onTouchStart={(e) => handlePieceStart(e, 'light')}
                >
                  <img src="ch5/art/sprites/firefly.png" alt="Firefly Light" />
                </div>
              )
            )}
          </div>
        )}
        
        {/* Pip */}
        {!smudgeFlying && (
          <div className="sprite fairy float">
            <img src="ch5/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
          </div>
        )}
        
        {/* Speech bubble */}
        {fairyText && (
          <div className="speech-bubble">
            {fairyText}
          </div>
        )}
        
        {/* Treasure bar with slots */}
        <div className="treasure-bar">
          <div className={`treasure-slot ${progress.treasures.petal ? 'filled' : 'empty'}`}>
            {progress.treasures.petal && <img src="ch5/art/sprites/rainbow-petal.png" alt="Rainbow Petal" />}
          </div>
          <div className={`treasure-slot ${progress.treasures.gem ? 'filled' : 'empty'}`}>
            {progress.treasures.gem && <img src="ch5/art/sprites/purple-gem.png" alt="Purple Gem" />}
          </div>
          <div className={`treasure-slot ${progress.treasures.light ? 'filled' : 'empty'}`}>
            {progress.treasures.light && <img src="ch5/art/sprites/firefly.png" alt="Firefly Light" />}
          </div>
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

export default Chapter5Scene;
