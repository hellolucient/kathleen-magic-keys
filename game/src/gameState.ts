import type { GameProgress } from './types';

const STORAGE_KEY = 'kathleen-magic-keys-progress';

export function saveProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

export function loadProgress(): GameProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const saved = JSON.parse(data);
      // Merge with defaults to handle new fields
      const defaults = getInitialProgress();
      return {
        ...defaults,
        ...saved,
        treasures: { ...defaults.treasures, ...saved.treasures },
        chapter3: { ...defaults.chapter3, ...saved.chapter3 },
        chapter4: { ...defaults.chapter4, ...saved.chapter4 },
        chapter5: { ...defaults.chapter5, ...saved.chapter5 },
      };
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return null;
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset progress:', error);
  }
}

export function getInitialProgress(): GameProgress {
  return {
    currentChapter: 1,
    completedChapters: [],
    treasures: {
      petal: false,
      gem: false,
      light: false,
    },
    chapter1: {
      keysFound: [],
      puzzleStates: {
        teddyWiggled: false,
        teddyMoved: false,
        jewelleryOpen: false,
        curtainOpen: false,
        wardrobeOpen: false,
        mirrorGlow: false,
        mirrorSequence: [],
      },
    },
    chapter2: {
      matchedFlowers: [],
      wrongAttempts: 0,
    },
    chapter3: {
      round: 0,
      completedRounds: [],
    },
    chapter4: {
      firefliesCaught: 0,
      matchedAnimals: [],
    },
    chapter5: {
      timesFound: 0,
      crownPieces: [],
    },
  };
}
