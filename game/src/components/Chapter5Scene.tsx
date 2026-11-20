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

/** Cloud bank positions — lower half, spaced across the painted cloud floor */
const CLOUD_POSITIONS = [
  { x: 10, y: 60 },
  { x: 38, y: 64 },
  { x: 66, y: 58 },
];

const PIECES = ['petal', 'gem', 'light'] as const;
type Piece = (typeof PIECES)[number];

function Chapter5Scene({ progress, setProgress, onComplete }: Chapter5SceneProps) {
  const [fairyText, setFairyText] = useState('');
  const [captionIsNarrator, setCaptionIsNarrator] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'hideseek' | 'crown' | 'crowned' | 'ending'>('intro');
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
  const [showSparkles, setShowSparkles] = useState(false);

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
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showLine('narr-intro', true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    audioManager.playSound('audio/sfx/sparkle.mp3');
    await showLine('smudge-cry');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showLine('fairy-intro');
    await new Promise(resolve => setTimeout(resolve, 400));
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

    setRevealedCloud(index);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    const newFound = timesFound + 1;
    setTimesFound(newFound);

    setProgress(prev => ({
      ...prev,
      chapter5: { ...prev.chapter5, timesFound: newFound },
    }));

    await showLine(`fairy-found-${newFound}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    if (newFound < 3) {
      setRevealedCloud(null);
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
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showLine('fairy-crown');
    await new Promise(resolve => setTimeout(resolve, 400));
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

    await showLine(`fairy-place-${piece}`);
    await new Promise(resolve => setTimeout(resolve, 350));
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
        setDragPosition(clientToPercent(container, cx, cy));
      },
      onEnd: (cx, cy, wasTap) => {
        if (wasTap) {
          flyPieceToCrown(piece);
          return;
        }
        const nearCrown = hitTestRect(crownTargetRef.current, cx, cy, 70);
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

    // Show Smudge wearing the finished crown, laughing, with sparkles
    setPhase('crowned');
    setSmudgeSprite('laughing');
    setShowSparkles(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    await new Promise(resolve => setTimeout(resolve, 1200));

    await showLine('smudge-happy');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    await showLine('fairy-friends');
    await new Promise(resolve => setTimeout(resolve, 400));
    setFairyText('');

    setShowRainbow(true);
    audioManager.playSound('audio/sfx/sparkle.mp3');

    await new Promise(resolve => setTimeout(resolve, 900));

    await showLine('narr-rainbow', true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setFairyText('');

    // Fly across — wait for the full CSS animation (4s) before leaving
    setPhase('ending');
    setShowSparkles(false);
    setSmudgeSprite('flying');
    setSmudgeFlying(true);

    await showLine('smudge-ride');
    setFairyText('');

    // fly-across is 4s — wait for it to finish
    await new Promise(resolve => setTimeout(resolve, 4200));

    await showLine('narr-end', true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setFairyText('');

    // Hand off to CompleteScreen (clean end card) — no in-scene The End overlay
    onComplete();
  };

  const toggleMute = () => {
    setMuted(audioManager.toggleMute());
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

  const showSmudgeSitting = phase === 'crown' || phase === 'crowned';

  return (
    <div
      className="game-scene chapter5-scene"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="game-container">
        <img src="ch5/art/raw/bg-clouds.jpg" alt="Cloud Castle" className="game-bg" />

        {showRainbow && <div className="rainbow rainbow-fade" />}

        {/* Hide-and-seek: painted cloud puffs on the cloud bank */}
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
                  onClick={() => { void tapCloud(index); }}
                >
                  {hasSmudge && (
                    <div className={`smudge-behind ${isRevealed ? 'revealed' : 'hidden-peek'}`}>
                      <img src="ch5/art/sprites/smudge-peeking.png" alt="Smudge" />
                      {!isRevealed && <div className="smudge-giggle" aria-hidden />}
                    </div>
                  )}
                  {/* Tail tip behind the puff, peeking from the edge */}
                  {hasSmudge && !isRevealed && (
                    <img
                      className="tail-tip-sprite"
                      src="ch5/art/sprites/smudge-tail-tip.png"
                      alt=""
                      aria-hidden
                      draggable={false}
                    />
                  )}
                  {/* Soft painted peach/pink/cream puff sitting on the cloud bank */}
                  <div className={`cloud-puff cloud-puff-${(index % 3) + 1} ${isRevealed ? 'aside' : ''}`}>
                    <img
                      src={`ch5/art/sprites/cloud-puff-${(index % 3) + 1}.png`}
                      alt="Cloud"
                      className="cloud-puff-img"
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Smudge sitting — crown + crowned phases */}
        {showSmudgeSitting && !smudgeFlying && (
          <div className={`smudge-sitting ${phase === 'crowned' ? 'with-crown crowned-happy' : ''}`}>
            <img
              src={`ch5/art/sprites/smudge-${smudgeSprite}.png`}
              alt="Smudge"
            />
            {phase === 'crowned' && (
              <div className="crown-on-head">
                <img src="ch5/art/sprites/crown.png" alt="Crown" />
              </div>
            )}
            {showSparkles && (
              <div className="crown-sparkles" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className={`sparkle-dot sparkle-dot-${i}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Crown drop target — dashed gold ghost + faint crown.png, slots fill as pieces land */}
        {phase === 'crown' && (
          <div className="crown-assembly" ref={crownTargetRef}>
            <div className="crown-ghost">
              <svg className="crown-outline" viewBox="0 0 120 80" aria-hidden>
                <path
                  d="M10 62 L18 28 L40 48 L60 16 L80 48 L102 28 L110 62 Z"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  strokeLinejoin="round"
                />
                <circle cx="18" cy="28" r="4" fill="#f0d060" opacity="0.85" />
                <circle cx="60" cy="16" r="5" fill="#f0d060" opacity="0.9" />
                <circle cx="102" cy="28" r="4" fill="#f0d060" opacity="0.85" />
              </svg>
              <img src="ch5/art/sprites/crown.png" alt="" className="crown-ghost-img" />
            </div>
            <div className="crown-slots">
              {PIECES.map((piece, index) => {
                const filled = crownPieces.includes(piece);
                return (
                  <div
                    key={piece}
                    className={`crown-slot crown-slot-${index} ${filled ? 'filled' : 'empty'}`}
                  >
                    {filled && (
                      <img src={pieceSrc(piece)} alt={pieceAlt(piece)} />
                    )}
                  </div>
                );
              })}
            </div>
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

        {/* Treasure tray */}
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
