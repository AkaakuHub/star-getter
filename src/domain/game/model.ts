export type PerformerId = 'nova' | 'lumen' | 'tetra';
export type Mood = 'warm' | 'cool' | 'bright';
export const costumeIds = [
  'star',
  'moon',
  'blossom',
  'encore',
  'sailor',
  'witch',
  'prism',
  'snow',
  'sunny',
  'space',
  'march',
  'ribbon',
] as const;
export type CostumeId = (typeof costumeIds)[number];
export type Effect =
  | Readonly<{ kind: 'hearts' | 'energy' | 'stamina' | 'excitement'; amount: number }>
  | Readonly<{ kind: 'boost'; multiplier: number; seconds: number }>
  | Readonly<{ kind: 'amplify'; percent: number }>
  | Readonly<{ kind: 'bloom'; strength: number }>
  | Readonly<{
      kind: 'resource-boost';
      target: 'excitement' | 'stamina';
      percent: number;
      uses: number;
      condition: 'voltage20' | 'mental100';
    }>
  | Readonly<{ kind: 'collect' }>;

export type Card = Readonly<{
  id: string;
  name: string;
  costume: CostumeId;
  performer: PerformerId;
  cost: number;
  appeal: number;
  effects: readonly Effect[];
  relay?: Readonly<{ threshold: number; hearts: number }>;
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
  targetScore: bigint;
  sections: readonly Section[];
  melody: readonly number[];
  chords: readonly (readonly [number, number, number])[];
}>;

export type Heart = Readonly<{ id: number; bornTick: number }>;
export type Boost = Readonly<{ percent: bigint; untilTick: number }>;
export type ResourceBoost = Readonly<{
  target: 'excitement' | 'stamina';
  percent: bigint;
  uses: number;
}>;
export type Bloom = Readonly<{
  progress: bigint;
  strength: bigint;
  rollback: Readonly<{ energy: number; stamina: number; excitement: number }>;
}>;
export type PlayStats = Readonly<{
  cardsUsed: number;
  heartsCollected: number;
  heartsMissed: number;
  specialsUsed: number;
  bestCollection: number;
  bestCombo: number;
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
  score: bigint;
  hearts: readonly Heart[];
  nextHeartId: number;
  boosts: readonly Boost[];
  amplification: bigint;
  resourceBoosts: readonly ResourceBoost[];
  bloom: Bloom | null;
  relayUsed: readonly string[];
  combo: number;
  lastCollectTick: number;
  lastActionTick: number;
  lastPerformer: PerformerId | null;
  lastCardName: string;
  lastGain: bigint;
  stats: PlayStats;
}>;

export type Action =
  | Readonly<{ type: 'start' | 'pause' | 'resume' | 'collect' | 'special' }>
  | Readonly<{ type: 'card'; index: number }>;

export const rules = {
  ticksPerSecond: 60,
  energyTicksPerPoint: 30,
  handSize: 5,
  deckSize: 9,
  maxEnergy: 10,
  maxHearts: 40,
  heartLifetimeSeconds: 10,
  actionCooldownTicks: 6,
  comboWindowTicks: 120,
  maxScore: 9999n * 10n ** 68n,
} as const;
