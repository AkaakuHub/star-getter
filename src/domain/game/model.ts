export type PerformerId = 'nova' | 'lumen' | 'tetra';
export type Mood = 'warm' | 'cool' | 'bright';
export type Effect =
  | Readonly<{ kind: 'hearts' | 'energy' | 'stamina' | 'excitement'; amount: number }>
  | Readonly<{ kind: 'boost'; multiplier: number; seconds: number }>
  | Readonly<{ kind: 'collect' }>;

export type Card = Readonly<{
  id: string;
  name: string;
  art: string;
  performer: PerformerId;
  cost: number;
  appeal: number;
  effects: readonly Effect[];
}>;

export type Section = Readonly<{
  name: string;
  startBeat: number;
  mood: Mood;
  climax: boolean;
}>;

export type Track = Readonly<{
  id: string;
  name: string;
  bpm: number;
  beats: number;
  targetScore: number;
  sections: readonly Section[];
  melody: readonly number[];
  chords: readonly (readonly [number, number, number])[];
}>;

export type Heart = Readonly<{ id: number; bornTick: number }>;
export type Boost = Readonly<{ multiplier: number; untilTick: number }>;
export type PlayStats = Readonly<{
  cardsUsed: number;
  heartsCollected: number;
  heartsMissed: number;
  specialsUsed: number;
  bestCollection: number;
}>;

export type GameState = Readonly<{
  phase: 'ready' | 'playing' | 'paused' | 'finished';
  tick: number;
  track: Track;
  deck: readonly Card[];
  hand: readonly string[];
  drawPile: readonly string[];
  discard: readonly string[];
  randomSeed: number;
  energy: number;
  stamina: number;
  resting: boolean;
  excitement: number;
  charge: number;
  score: number;
  hearts: readonly Heart[];
  nextHeartId: number;
  boosts: readonly Boost[];
  lastActionTick: number;
  lastPerformer: PerformerId | null;
  lastCardName: string;
  lastGain: number;
  stats: PlayStats;
}>;

export type Action =
  | Readonly<{ type: 'start' | 'pause' | 'resume' | 'collect' | 'special' }>
  | Readonly<{ type: 'card'; index: number }>;

export const rules = {
  ticksPerSecond: 60,
  energyTicksPerPoint: 90,
  handSize: 5,
  deckSize: 9,
  maxEnergy: 10,
  maxHearts: 40,
  heartLifetimeSeconds: 10,
  actionCooldownTicks: 14,
} as const;
