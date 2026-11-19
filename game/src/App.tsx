import { useState, useEffect } from 'react';
import type { GameScreen, GameProgress } from './types';
import { audioManager } from './audioManager';
import { loadProgress, getInitialProgress } from './gameState';
import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import GameScene from './components/GameScene';
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
    // Load saved progress
    const saved = loadProgress();
    if (saved) {
      setProgress(saved);
    }
    setScreen('title');
  };

  const handleStartGame = async () => {
    await audioManager.unlock();
    setScreen('game');
  };

  const handleGameComplete = () => {
    setScreen('complete');
  };

  const handlePlayAgain = () => {
    const initialProgress = getInitialProgress();
    setProgress(initialProgress);
    setScreen('game');
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
      {screen === 'title' && <TitleScreen onStart={handleStartGame} />}
      {screen === 'game' && (
        <GameScene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleGameComplete}
        />
      )}
      {screen === 'complete' && <CompleteScreen onPlayAgain={handlePlayAgain} />}
    </div>
  );
}

export default App;
