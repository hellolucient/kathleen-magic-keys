import { useEffect } from 'react';
import type { ChapterNumber } from '../types';
import './CompleteScreen.css';

interface CompleteScreenProps {
  chapter: ChapterNumber;
  onPlayAgain: () => void;
  onNextChapter: () => void;
  onBackToChapterPicker: () => void;
}

function CompleteScreen({ chapter, onPlayAgain, onNextChapter, onBackToChapterPicker }: CompleteScreenProps) {
  useEffect(() => {
    playCompleteNarration();
  }, [chapter]);

  const playCompleteNarration = async () => {
    // Don't play narration here - it's already played in the chapter scenes
  };

  const getImageSrc = () => {
    if (chapter === 1) return 'art/complete.jpg';
    if (chapter === 2) return 'ch2/art/complete-ch2.jpg';
    if (chapter === 3) return 'ch3/art/raw/bg-river.jpg';
    if (chapter === 4) return 'ch4/art/raw/bg-forest.jpg';
    if (chapter === 5) return 'ch5/art/raw/bg-clouds.jpg';
    return 'art/complete.jpg';
  };

  const getTitle = () => {
    if (chapter === 5) return 'The End of Book One!';
    return `Chapter ${chapter} Complete!`;
  };

  const getMessage = () => {
    if (chapter === 1) return 'Princess Kathleen found all five magic keys!';
    if (chapter === 2) return 'The garden is full of colour again!';
    if (chapter === 3) return 'The frogs loved your song!';
    if (chapter === 4) return 'The baby animals found their mummies!';
    if (chapter === 5) return 'Smudge has a friend forever! 💜';
    return 'Well done, Princess Kathleen!';
  };

  const hasNextChapter = chapter < 5;

  return (
    <div className="complete-screen">
      <div className="complete-bg">
        <img src={getImageSrc()} alt="Chapter Complete" />
      </div>
      <div className="complete-overlay">
        <div className="complete-content">
          <h1 className="complete-title">{getTitle()}</h1>
          <p className="complete-message">{getMessage()}</p>
          <div className="complete-buttons">
            <button className="play-again-button" onClick={onPlayAgain}>
              Play Again
            </button>
            {hasNextChapter && (
              <button className="next-chapter-button" onClick={onNextChapter}>
                Next Chapter ✨
              </button>
            )}
            {chapter === 5 && (
              <div className="ending-message">
                <p>✨ Thank you for playing! ✨</p>
                <p>Smudge will be back for more adventures!</p>
              </div>
            )}
            <button className="back-button" onClick={onBackToChapterPicker}>
              Chapter Picker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteScreen;
