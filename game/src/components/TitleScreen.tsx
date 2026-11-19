import { useEffect, useState, useRef } from 'react';
import { audioManager } from '../audioManager';
import './TitleScreen.css';

interface TitleScreenProps {
  onStart: () => void;
}

function TitleScreen({ onStart }: TitleScreenProps) {
  const [started, setStarted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    // Don't play narration until user taps (iOS requirement)
    const handleFirstInteraction = async () => {
      if (!audioUnlocked) {
        await audioManager.unlock();
        setAudioUnlocked(true);
        playTitleNarration();
      }
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const playTitleNarration = async () => {
    await audioManager.playSpeech('narr-title');
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Guard against double-click
    if (startingRef.current || started) return;
    startingRef.current = true;
    setStarted(true);
    
    await audioManager.unlock();
    onStart();
  };

  return (
    <div className="title-screen">
      <div className="title-bg">
        <img src="art/title.jpg" alt="Princess Kathleen and Fairy" />
      </div>
      <div className="title-overlay">
        <div className="title-content">
          <div className="title-text-area">
            <h1 className="main-title">
              Princess Kathleen<br />
              <span className="title-and">and the</span><br />
              Five Magic Keys
            </h1>
            <h2 className="chapter-title">Chapter 1: The Princess's Bedroom</h2>
          </div>
          <button 
            className="play-button" 
            onClick={handleStart}
            disabled={started}
          >
            ✨ Play ✨
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleScreen;
