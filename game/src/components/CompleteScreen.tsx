import './CompleteScreen.css';

interface CompleteScreenProps {
  chapter: number;
  onPlayAgain: () => void;
  onNextChapter: () => void;
  onBackToChapterPicker: () => void;
}

function CompleteScreen({ onPlayAgain, onBackToChapterPicker }: CompleteScreenProps) {
  // Only Chapter 5 lands here — clean full-screen end card
  return (
    <div className="complete-screen end-card">
      <div className="complete-bg">
        <img src="ch5/art/raw/bg-clouds.jpg" alt="" />
      </div>
      <div className="complete-card">
        <h1 className="complete-title">The End of Book One</h1>
        <div className="end-heroes">
          <img
            className="end-smudge"
            src="ch5/art/sprites/smudge-laughing.png"
            alt="Smudge"
          />
          <img
            className="end-crown"
            src="ch5/art/sprites/crown.png"
            alt=""
            aria-hidden
          />
          <img
            className="end-pip"
            src="ch5/art/sprites/fairy-cheer.png"
            alt="Pip"
          />
        </div>
        <p className="complete-message">Smudge has a friend forever!</p>
        <div className="complete-buttons">
          <button type="button" className="play-again-button" onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className="back-button" onClick={onBackToChapterPicker}>
            Chapter Picker
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompleteScreen;
