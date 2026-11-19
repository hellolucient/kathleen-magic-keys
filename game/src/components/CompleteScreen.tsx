import { useEffect } from 'react';
import { audioManager } from '../audioManager';
import './CompleteScreen.css';

interface CompleteScreenProps {
  onPlayAgain: () => void;
}

function CompleteScreen({ onPlayAgain }: CompleteScreenProps) {
  useEffect(() => {
    playCompleteNarration();
  }, []);

  const playCompleteNarration = async () => {
    await audioManager.playSpeech('narr-complete');
  };

  return (
    <div className="complete-screen">
      <div className="complete-bg">
        <img src="/art/complete.jpg" alt="Chapter Complete" />
      </div>
      <div className="complete-overlay">
        <div className="complete-content">
          <h1 className="complete-title">Chapter 1 Complete!</h1>
          <p className="complete-message">
            Princess Kathleen found all five magic keys!
          </p>
          <div className="complete-buttons">
            <button className="play-again-button" onClick={onPlayAgain}>
              Play Again
            </button>
            <button className="next-chapter-button" disabled>
              Next Chapter
              <span className="coming-soon">Coming Soon ✨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteScreen;
