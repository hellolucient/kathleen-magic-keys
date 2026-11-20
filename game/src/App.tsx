import { useState, useEffect } from 'react';
import type { GameScreen, GameProgress, ChapterNumber } from './types';
import { audioManager } from './audioManager';
import { loadProgress, getInitialProgress, saveProgress } from './gameState';
import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import ChapterPicker from './components/ChapterPicker';
import GameScene from './components/GameScene';
import Chapter2Scene from './components/Chapter2Scene';
import Chapter3Scene from './components/Chapter3Scene';
import Chapter4Scene from './components/Chapter4Scene';
import Chapter5Scene from './components/Chapter5Scene';
import CompleteScreen from './components/CompleteScreen';
import './App.css';

/** Treasures earned by completing earlier chapters (for picker jumps). */
function treasuresFromCompleted(completed: number[], existing: GameProgress['treasures']) {
  return {
    petal: existing.petal || completed.includes(2),
    gem: existing.gem || completed.includes(3),
    light: existing.light || completed.includes(4),
  };
}

function App() {
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [progress, setProgress] = useState<GameProgress>(getInitialProgress());
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [fading, setFading] = useState(false);

  useEffect(() => {
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
      setProgress({
        ...saved,
        treasures: treasuresFromCompleted(saved.completedChapters, saved.treasures),
      });
    }
    setScreen('title');
  };

  const handleStartFromTitle = async () => {
    await audioManager.unlock();
    setScreen('chapter-picker');
  };

  // Every time a chapter starts, it starts from the beginning (keep treasures)
  const freshChapter = (prev: GameProgress, chapter: ChapterNumber): GameProgress => {
    const base = getInitialProgress();
    const treasures = treasuresFromCompleted(prev.completedChapters, prev.treasures);
    if (chapter === 1) return { ...prev, currentChapter: 1, chapter1: base.chapter1, treasures };
    if (chapter === 2) return { ...prev, currentChapter: 2, chapter2: base.chapter2, treasures };
    if (chapter === 3) return { ...prev, currentChapter: 3, chapter3: base.chapter3, treasures };
    if (chapter === 4) return { ...prev, currentChapter: 4, chapter4: base.chapter4, treasures };
    return { ...prev, currentChapter: 5, chapter5: base.chapter5, treasures };
  };

  const handleChapterSelect = async (chapter: ChapterNumber) => {
    await audioManager.unlock();
    await audioManager.resumeContext();
    setProgress(prev => {
      const next = freshChapter(prev, chapter);
      saveProgress(next);
      return next;
    });
    setScreen('game');
  };

  const fadeToNextChapter = (fromChapter: ChapterNumber) => {
    const nextChapter = (fromChapter + 1) as ChapterNumber;
    audioManager.stopAllSounds();
    // Cover fully first (solid veil), then swap chapter, then lift veil —
    // avoids half-drawn / clipped frames mid-transition.
    setFading(true);
    window.setTimeout(() => {
      setProgress(prev => {
        const withComplete: GameProgress = {
          ...prev,
          completedChapters: prev.completedChapters.includes(fromChapter)
            ? prev.completedChapters
            : [...prev.completedChapters, fromChapter],
        };
        const next = freshChapter(withComplete, nextChapter);
        saveProgress(next);
        return next;
      });
      setScreen('game');
      // Hold the veil briefly so the next scene paints fully underneath
      window.setTimeout(() => setFading(false), 220);
    }, 450);
  };

  // Ch1–4: action ends chapter → fade straight into next
  const handleContinueToNext = () => {
    const chapter = progress.currentChapter;
    if (chapter < 5) {
      fadeToNextChapter(chapter);
    }
  };

  // Ch5: The End screen
  const handleGameComplete = () => {
    const chapter = progress.currentChapter;
    setProgress(prev => {
      const next = {
        ...prev,
        completedChapters: prev.completedChapters.includes(chapter)
          ? prev.completedChapters
          : [...prev.completedChapters, chapter],
      };
      saveProgress(next);
      return next;
    });
    if (chapter === 5) {
      setScreen('complete');
    } else {
      fadeToNextChapter(chapter);
    }
  };

  const handlePlayAgain = () => {
    setProgress(prev => freshChapter(prev, prev.currentChapter));
    setScreen('game');
  };

  const handleBackToTitle = () => {
    audioManager.stopAllSounds();
    setScreen('title');
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
    <div className={`app ${fading ? 'chapter-fading' : ''}`}>
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
          onComplete={handleContinueToNext}
        />
      )}
      {screen === 'game' && progress.currentChapter === 2 && (
        <Chapter2Scene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleContinueToNext}
        />
      )}
      {screen === 'game' && progress.currentChapter === 3 && (
        <Chapter3Scene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleContinueToNext}
        />
      )}
      {screen === 'game' && progress.currentChapter === 4 && (
        <Chapter4Scene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleContinueToNext}
        />
      )}
      {screen === 'game' && progress.currentChapter === 5 && (
        <Chapter5Scene
          progress={progress}
          setProgress={updateProgress}
          onComplete={handleGameComplete}
        />
      )}
      {screen === 'complete' && (
        <CompleteScreen
          chapter={progress.currentChapter}
          onPlayAgain={handlePlayAgain}
          onNextChapter={() => {}}
          onBackToChapterPicker={handleBackToTitle}
        />
      )}
    </div>
  );
}

export default App;
