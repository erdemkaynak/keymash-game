
export enum GamePhase {
  LOBBY = 'LOBBY',
  WAITING_ROOM = 'WAITING_ROOM', // New Phase
  TRANSITION = 'TRANSITION',
  PLAYING = 'PLAYING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER'
}

export enum GameMode {
  REPAIR = 'REPAIR',
  TYPING = 'TYPING'
}

export interface Player {
  id: string;
  name: string;
  score: number;
  avatar: string;
  isBot: boolean;
  progress: number; // 0 to 100%
  status: 'IDLE' | 'PLAYING' | 'FINISHED';
}

export interface Room {
  id: string;
  hostId: string;
  settings: GameSettings;
  players: Record<string, Player>; // Map player ID to Player for Firebase
  phase: GamePhase;
  currentRound: number;
  rounds: RoundConfig[];
  startTime?: number; // Server timestamp for sync
  words: string[]; // Shared words for the round
}

export interface RoundConfig {
  roundNumber: number;
  mode: GameMode;
  description: string;
  duration: number; // in seconds
}

export interface GameSettings {
  maxPlayers: number;
  isPrivate: boolean;
  enableBots: boolean;
  totalRounds: number;
  targetScore: number;
}

export interface DragItem {
  id: string;
  char: string;
}

export const TOTAL_ROUNDS = 4;
