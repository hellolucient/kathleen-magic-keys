export interface LayoutObject {
  id: string;
  src?: string;
  alt?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotate?: number;
  puzzle?: string;
  note?: string;
  hitbox?: boolean;
  lock?: boolean;
  cx?: number;
  cy?: number;
  d?: number;
  order?: number;
  anchor?: string;
}

export interface Layout {
  frame: {
    aspect: string;
    units: string;
    background: string;
    reference_px: number[];
  };
  objects: LayoutObject[];
}

export interface AudioLine {
  text: string;
  voice: string;
  speaker: string;
  file: string;
}

export interface AudioLines {
  [key: string]: AudioLine;
}

export interface GameState {
  keysFound: string[];
  puzzleStates: {
    [key: string]: any;
  };
  hintsGiven: string[];
  lastInteractionTime: number;
}

export type GameScreen = 'loading' | 'title' | 'game' | 'complete';

export interface GameProgress {
  keysFound: string[];
  puzzleStates: {
    teddyWiggled: boolean;
    teddyMoved: boolean;
    jewelleryOpen: boolean;
    curtainOpen: boolean;
    wardrobeOpen: boolean;
    mirrorGlow: boolean;
    mirrorSequence: number[];
  };
}
