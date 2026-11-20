import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameProgress } from '../types';
import { audioManager } from '../audioManager';
import { saveProgress } from '../gameState';
import { clientToPercent, hitTestRect, elementCenter, startPointerDrag } from '../pointerDrag';
import TreasureBar from './TreasureBar';
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

const PIECES = ['petal', 'gem', 'light'] as const;
type Piece = (typeof PIECES)[number];

function Chapter5Scene({ progress, setProgress, onComplete }: Chapter5SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [captionIsNarrator, setCaptionIsNarrator] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'hideseek' | 'crown' | 'ending'>('intro');
  const [smudgePosition, setSmudgePosition] = useState(0);
  const [timesFound, setTimesFound] = useState(0);
  const [smudgeSprite, setSmudgeSprite] = useState('peeking');
  const [showRainbow, setShowRainbow] = useState(false);
  const [crownPieces, setCrownPieces] = useState<string[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [flyingPiece, setFlyingPiece] = useState<string | null>(null);
  const [smudgeFlying, setSmudgeFlying] = useState(false);
  const [wrongCloud, setWrongCloud] = useState<number | null>(null);
  const [revealedCloud, setRevealedCloud] = useState<number | null>(null);
  const [showTheEnd, setShowTheEnd] = useState(false);

  const progressRef = useRef(progress);
  const containerRef = useRef<HTMLDivElement>(null);
  const crownTargetRef = useRef<HTMLDivElement>(null);
  const introRunningRef = useRef(false);
  const completedRef = useRef(false);
  const placingRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(prev => ({
      ...prev,
      chapter5: { timesFound: 0, crownPieces: [] },
    }));

    startIntro();

    return () => {
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const showLine = async (lineId: string, isNarrator = false) => {
    const text = audioManager.getText(lineId, 'ch5');
    setCaptionIsNarrator(isNarrator);
    setFairyText(text);
    await audioManager.playSpeech(lineId, 'ch5');
  };

  const startIntro = async () => {
    if (introRunningRef.current) return;
    introRunningRef.current = true;

    await new Promise(resolve => setTimeout(resolve, 500));
    await showLine('narr-title', true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    await showLine('narr-intro', true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    audioManager.playSound('audio/sfx/sparkle.mp3');
    await showLine('smudge-cry');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    await showLine('fairy-intro');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    introRunningRef.current = false;
    startHideSeek();
  };

  const startHideSeek = () => {
    setPhase('hideseek');
    setSmudgePosition(Math.floor(Math.random() * 3));
    setRevealedCloud(null);
  };

  const tapCloud = async (index: number) => {
    if (phase !== 'hideseek' || revealedCloud !== null) return;

    if (index !== smudgePosition) {
      setWrongCloud(index);
      setCaptionIsNarrator(false);
      setFairyText(audioManager.getText('fairy-not-here', 'ch5') || 'Not here!');
      audioManager.playSound('ch2/audio/sfx/wrong-boop.mp3');
      void audioManager.playSpeech('fairy-not-here', 'ch5');
      await new Promise(resolve => setTimeout(resolve, 900));
      setWrongCloud(null);
      setFairyText('');
      return;
    }

    // Correct cloud — puff aside and reveal Smudge
    setRevealedCloud(index);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    const newFound = timesFound + 1;
    setTimesFound(newFound);

    setProgress(prev => ({
      ...prev,
      chapter5: { ...prev.chapter5, timesFound: newFound },
    }));

    const praiseLine = `fairy-found-${newFound}`;
    await showLine(praiseLine);
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    if (newFound < 3) {
      setRevealedCloud(null);
      // Pick a different cloud next time when possible
      let next = Math.floor(Math.random() * 3);
      if (next === smudgePosition) next = (next + 1) % 3;
      setSmudgePosition(next);
    } else {
      await completeHideSeek();
    }
  };

  const completeHideSeek = async () => {
    setPhase('crown');
    setSmudgeSprite('shy');

    await new Promise(resolve => setTimeout(resolve, 500));

    await showLine('smudge-sorry');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    await showLine('fairy-crown');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');
  };

  const placePiece = async (piece: string) => {
    if (placingRef.current || crownPieces.includes(piece)) return;
    placingRef.current = true;

    audioManager.playSound('ch2/audio/sfx/correct-match.mp3');
    audioManager.playSound('audio/sfx/sparkle.mp3');

    const newPieces = [...crownPieces, piece];
    setCrownPieces(newPieces);

    setProgress(prev => ({
      ...prev,
      chapter5: { ...prev.chapter5, crownPieces: newPieces },
    }));

    const placeLine = `fairy-place-${piece}`;
    await showLine(placeLine);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    placingRef.current = false;

    if (newPieces.length === 3) {
      await completeCrown();
    }
  };

  const flyPieceToCrown = (piece: string) => {
    const crown = crownTargetRef.current;
    const container = containerRef.current;
    if (!crown || !container) {
      void placePiece(piece);
      return;
    }
    const center = elementCenter(crown);
    const pct = clientToPercent(container, center.x, center.y);
    setFlyingPiece(piece);
    setDragPosition(pct);
    window.setTimeout(() => {
      setFlyingPiece(null);
      setDraggingPiece(null);
      void placePiece(piece);
    }, 350);
  };

  const handlePiecePointerDown = (e: ReactPointerEvent, piece: Piece) => {
    if (crownPieces.includes(piece) || placingRef.current || flyingPiece) return;
    const container = containerRef.current;
    if (!container) return;

    const pct = clientToPercent(container, e.clientX, e.clientY);
    setDraggingPiece(piece);
    setDragPosition(pct);
    audioManager.playSound('ch2/audio/sfx/butterfly-flutter.mp3');

    startPointerDrag(e, {
      onMove: (cx, cy) => {
        const p = clientToPercent(container, cx, cy);
        setDragPosition(p);
      },
      onEnd: (cx, cy, wasTap) => {
        if (wasTap) {
          // Single tap → fly to crown
          flyPieceToCrown(piece);
          return;
        }
        const nearCrown = hitTestRect(crownTargetRef.current, cx, cy, 60);
        setDraggingPiece(null);
        if (nearCrown) {
          void placePiece(piece);
        }
      },
    });
  };

  const completeCrown = async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    setPhase('ending');

    await new Promise(resolve => setTimeout(resolve, 500));

    setSmudgeSprite('laughing');
    audioManager.playSound('audio/sfx/sparkle.mp3');

    await new Promise(resolve => setTimeout(resolve, 1000));

    await showLine('smudge-happy');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    await showLine('fairy-friends');
    await new Promise(resolve => setTimeout(resolve, 500));
    setFairyText('');

    setShowRainbow(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    await new Promise(resolve => setTimeout(resolve, 1000));

    await showLine('narr-rainbow', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFairyText('');

    setSmudgeSprite('flying');
    setSmudgeFlying(true);

    await showLine('smudge-ride');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFairyText('');

    await showLine('narr-end', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFairyText('');

    setShowTheEnd(true);
    await new Promise(resolve => setTimeout(resolve, 2500));

    onComplete();
  };

  const toggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
  };

  const pieceSrc = (piece: string) => {
    if (piece === 'petal') return 'ch5/art/sprites/rainbow-petal.png';
    if (piece === 'gem') return 'ch5/art/sprites/purple-gem.png';
    return 'ch5/art/sprites/firefly.png';
  };

  const pieceAlt = (piece: string) => {
    if (piece === 'petal') return 'Rainbow Petal';
    if (piece === 'gem') return 'Purple Gem';
    return 'Firefly Light';
  };

  return (
    <div
      className="game-scene chapter5-scene"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img src="ch5/art/raw/bg-clouds.jpg" alt="Cloud Castle" className="game-bg" />

        {showRainbow && <div className="rainbow fade-in" />}

        {/* Hide-and-seek: cloud puffs covering Smudge */}
        {phase === 'hideseek' && (
          <>
            {CLOUD_POSITIONS.map((pos, index) => {
              const hasSmudge = index === smudgePosition;
              const isRevealed = revealedCloud === index;
              const isWrong = wrongCloud === index;
              return (
                <div
                  key={index}
                  className={`cloud-hiding-spot ${hasSmudge ? 'has-smudge' : ''} ${isWrong ? 'wobble' : ''} ${isRevealed ? 'puffed-aside' : ''}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    void tapCloud(index);
                  }}
                >
                  {hasSmudge && (
                    <div className={`smudge-behind ${isRevealed ? 'revealed' : 'hidden-peek'}`}>
                      <img src="ch5/art/sprites/smudge-peeking.png" alt="Smudge" />
                      {!isRevealed && <div className="smudge-giggle" aria-hidden />}
                    </div>
                  )}
                  <div className={`cloud-puff ${isRevealed ? 'aside' : ''}`}>
                    <div className="cloud-blob cloud-blob-a" />
                    <div className="cloud-blob cloud-blob-b" />
                    <div className="cloud-blob cloud-blob-c" />
                  </div>
                  {hasSmudge && !isRevealed && (
                    <div className="tail-tip" aria-hidden />
                  )}
                </div>
              );
            })}
          </>
        )}

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

        {smudgeFlying && (
          <div className="smudge-flying-across">
            <img src="ch5/art/sprites/smudge-flying.png" alt="Smudge flying" />
            <div className="pip-riding">
              <img src="ch5/art/sprites/fairy-cheer.png" alt="Pip" />
            </div>
          </div>
        )}

        {/* Crown drop target */}
        {phase === 'crown' && crownPieces.length < 3 && (
          <div className="crown-assembly" ref={crownTargetRef}>
            <div className="crown-base">
              {crownPieces.length === 0 && <div className="crown-empty-circle" />}
              {crownPieces.map((piece, index) => (
                <div key={piece} className={`crown-piece-placed crown-piece-${index}`}>
                  <img src={pieceSrc(piece)} alt={pieceAlt(piece)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treasure tray — pointer-draggable pieces */}
        {phase === 'crown' && (
          <div className="treasure-tray">
            {PIECES.map((piece) => {
              if (crownPieces.includes(piece)) return null;
              const isDragging = draggingPiece === piece || flyingPiece === piece;
              if (isDragging) {
                return (
                  <div
                    key={piece}
                    className={`treasure-piece dragging ${flyingPiece === piece ? 'flying-to-crown' : ''}`}
                    style={{
                      left: `${dragPosition.x}%`,
                      top: `${dragPosition.y}%`,
                      transform: 'translate(-50%, -50%) scale(1.1)',
                    }}
                  >
                    <img src={pieceSrc(piece)} alt={pieceAlt(piece)} />
                  </div>
                );
              }
              return (
                <div
                  key={piece}
                  className="treasure-piece clickable"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => handlePiecePointerDown(e, piece)}
                >
                  <img src={pieceSrc(piece)} alt={pieceAlt(piece)} />
                </div>
              );
            })}
          </div>
        )}

        {!smudgeFlying && (
          <div className="sprite fairy float">
            <img src="ch5/art/sprites/fairy-talk.png" alt="Pip the Fairy" />
          </div>
        )}

        {fairyText && (
          <div className={`speech-bubble ${captionIsNarrator ? 'narrator' : ''}`}>
            {fairyText}
          </div>
        )}

        <TreasureBar treasures={progress.treasures} spriteBase="ch5/art/sprites" />

        {showTheEnd && (
          <div className="the-end-overlay">
            <h1>The End of Book One</h1>
          </div>
        )}

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
