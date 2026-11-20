import { useState, useEffect } from 'react';
import type { GameScreen, GameProgress, ChapterNumber } from './types';
import { audioManager } from './audioManager';
import { loadProgress, getInitialProgress } from './gameState';
import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import ChapterPicker from './components/ChapterPicker';
import GameScene from './components/GameScene';
import Chapter2Scene from './components/Chapter2Scene';
import CompleteScreen from './components/CompleteScreen';
import './App.css';

function App() {
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [progress, setProgress] = useState<GameProgress>(getInitialProgress());
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  useEffect(() => {
    // Check orientation
    const checkOrientation = () => {
      if (window.innerWidth < window.innerHeight) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleLoadComplete = () => {
    const saved = loadProgress();
    if (saved) {
      setProgress(saved);
    }
    setScreen('title');
  };

  const handleStartFromTitle = async () => {
    await audioManager.unlock();
    setScreen('chapter-picker');
  };

  const handleChapterSelect = (chapter: ChapterNumber) => {
    setProgress(prev => ({ ...prev, currentChapter: chapter }));
    setScreen('game');
  };

  const handleGameComplete = () => {
    const chapter = progress.currentChapter;
    setProgress(prev => ({
      ...prev,
      completedChapters: prev.completedChapters.includes(chapter)
        ? prev.completedChapters
        : [...prev.completedChapters, chapter],
    }));
    setScreen('complete');
  };

  const handleNextChapter = () => {
    const nextChapter = (progress.currentChapter + 1) as ChapterNumber;
    if (nextChapter <= 2) {
      setProgress(prev => ({ ...prev, currentChapter: nextChapter }));
      setScreen('game');
    }
  };

  const handlePlayAgain = () => {
    setScreen('game');
  };

  const handleBackToChapterPicker = () => {
    setScreen('chapter-picker');
  };
  
  const updateProgress = (updater: (prev: GameProgress) => GameProgress) => {
    setProgress(updater);
  };

  if (orientation === 'portrait') {
    return (
      <div className="portrait-warning">
        <div className="portrait-content">
          <img src="art/sprites/fairy-talk.png" alt="Fairy" className="portrait-fairy" />
          <h2>Please turn your iPad sideways!</h2>
          <p>This magical adventure works best in landscape mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === 'loading' && <LoadingScreen onComplete={handleLoadComplete} />}
      {screen === 'title' && <TitleScreen onStart={handleStartFromTitle} />}
      {screen === 'chapter-picker' && (
        <ChapterPicker
          progress={progress}
          onSelectChapter={handleChapterSelect}
        />
      )}
      {screen === 'game' && progress.currentChapter === 1 && (
        <GameScene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleGameComplete}
        />
      )}
      {screen === 'game' && progress.currentChapter === 2 && (
        <Chapter2Scene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleGameComplete}
        />
      )}
      {screen === 'complete' && (
        <CompleteScreen
          chapter={progress.currentChapter}
          onPlayAgain={handlePlayAgain}
          onNextChapter={handleNextChapter}
          onBackToChapterPicker={handleBackToChapterPicker}
        />
      )}
    </div>
  );
}

export default App;
