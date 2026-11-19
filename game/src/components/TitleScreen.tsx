import { useEffect, useState } from 'react';
import { audioManager } from '../audioManager';
import './TitleScreen.css';

interface TitleScreenProps {
  onStart: () => void;
}

function TitleScreen({ onStart }: TitleScreenProps) {
  const [titleText, setTitleText] = useState('');

  useEffect(() => {
    playTitleNarration();
  }, []);

  const playTitleNarration = async () => {
    const text = await audioManager.playSpeech('narr-title');
    setTitleText(text);
  };

  const handleStart = async () => {
    await audioManager.unlock();
    onStart();
  };

  return (
    <div className="title-screen" onClick={handleStart}>
      <div className="title-bg">
        <img src="/art/title.jpg" alt="Princess Kathleen and Fairy" />
      </div>
      <div className="title-overlay">
        <div className="title-content">
          <h1 className="main-title">
            Princess Kathleen<br />
            <span className="title-and">and the</span><br />
            Five Magic Keys
          </h1>
          <h2 className="chapter-title">Chapter 1: The Princess's Bedroom</h2>
          <button className="play-button" onClick={handleStart}>
            ✨ Play ✨
          </button>
          {titleText && (
            <p className="title-narration">{titleText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TitleScreen;
