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

  // Every time a chapter starts, it starts from the beginning
  const freshChapter = (prev: GameProgress, chapter: ChapterNumber): GameProgress => {
    const base = getInitialProgress();
    if (chapter === 1) return { ...prev, currentChapter: 1, chapter1: base.chapter1 };
    return { ...prev, currentChapter: chapter, chapter2: base.chapter2 };
  };

  const handleChapterSelect = (chapter: ChapterNumber) => {
    setProgress(prev => freshChapter(prev, chapter));
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

  // End of Chapter 1: tapping Pip at the door goes straight into Chapter 2
  const handleFollowToChapter2 = () => {
    setProgress(prev => freshChapter({
      ...prev,
      completedChapters: prev.completedChapters.includes(1) ? prev.completedChapters : [...prev.completedChapters, 1],
    }, 2));
    setScreen('game');
  };

  const handleNextChapter = () => {
    const nextChapter = (progress.currentChapter + 1) as ChapterNumber;
    if (nextChapter <= 2) {
      setProgress(prev => freshChapter(prev, nextChapter));
      setScreen('game');
    }
  };

  const handlePlayAgain = () => {
    setProgress(prev => freshChapter(prev, prev.currentChapter));
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
          onComplete={handleFollowToChapter2}
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
