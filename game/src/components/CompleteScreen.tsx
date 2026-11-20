import { useEffect } from 'react';
import { audioManager } from '../audioManager';
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
    if (chapter === 1) {
      await audioManager.playSpeech('narr-complete');
    } else if (chapter === 2) {
      await audioManager.playSpeech('narr-complete', 'ch2');
    }
  };

  const getImageSrc = () => {
    if (chapter === 1) return 'art/complete.jpg';
    if (chapter === 2) return 'ch2/art/complete-ch2.jpg';
    return 'art/complete.jpg';
  };

  const getTitle = () => {
    if (chapter === 1) return 'Chapter 1 Complete!';
    if (chapter === 2) return 'Chapter 2 Complete!';
    return `Chapter ${chapter} Complete!`;
  };

  const getMessage = () => {
    if (chapter === 1) return 'Princess Kathleen found all five magic keys!';
    if (chapter === 2) return 'The garden is full of colour again!';
    return 'Well done, Princess Kathleen!';
  };

  const hasNextChapter = chapter < 2;

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
            {hasNextChapter ? (
              <button className="next-chapter-button" onClick={onNextChapter}>
                Next Chapter ✨
              </button>
            ) : (
              <button className="next-chapter-button" disabled>
                Next Chapter
                <span className="coming-soon">Coming Soon ✨</span>
              </button>
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
