import type { ChapterNumber } from '../types';
import './CompleteScreen.css';

interface CompleteScreenProps {
  chapter: ChapterNumber;
  onPlayAgain: () => void;
  onNextChapter: () => void;
  onBackToChapterPicker: () => void;
}

function CompleteScreen({ chapter, onPlayAgain, onBackToChapterPicker }: CompleteScreenProps) {
  // Only Chapter 5 lands here — The End of Book One
  return (
    <div className="complete-screen">
      <div className="complete-bg">
        <img src="ch5/art/raw/bg-clouds.jpg" alt="The End" />
      </div>
      <div className="complete-overlay">
        <div className="complete-content">
          <h1 className="complete-title">The End of Book One</h1>
          <p className="complete-message">Smudge has a friend forever!</p>
          <div className="complete-buttons">
            <button className="play-again-button" onClick={onPlayAgain}>
              Play Chapter {chapter} Again
            </button>
            <div className="ending-message">
              <p>Thank you for playing!</p>
              <p>Smudge will be back for more adventures!</p>
            </div>
            <button className="back-button" onClick={onBackToChapterPicker}>
              Back to Title
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteScreen;
