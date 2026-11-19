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
      return JSON.parse(data);
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
  };
}
