export type StarGatherHeartPhase = 'throw' | 'wait' | 'flash' | 'collect';
export type StarGatherHeartShowState = 'show' | 'hide-after-throw';
export type StarGatherHeartRandomRange = (minimum: number, maximum: number) => number;

export type StarGatherHeartPosition = Readonly<{ x: number; y: number }>;

export type StarGatherStageHeart = Readonly<{
  lifeTimeSeconds: number;
  phase: StarGatherHeartPhase;
  showState: StarGatherHeartShowState;
  spawnElapsedSeconds: number;
  spawnDurationSeconds: number;
  spawnStartPosition: StarGatherHeartPosition;
  waitPosition: StarGatherHeartPosition;
  flashElapsedSeconds: number;
  collectElapsedSeconds: number;
  collectMoveDurationSeconds: number;
  collectJumpHeight: number;
}>;

export type StarGatherHeartRuntimeState = Readonly<{
  heartLimit: number;
  showLimit: number;
  throwLimit: number;
  showPercentage: number;
  baseLifeTimeSeconds: number;
  generationCount: number;
  collectionSoundCount: number;
  collectionSoundDelays: readonly number[];
  stageHearts: readonly StarGatherStageHeart[];
  hiddenHeartBatches: readonly Readonly<{
    count: number;
    lifeTimeSeconds: number;
  }>[];
}>;

export type StarGatherHeartSpawnResult = Readonly<{
  state: StarGatherHeartRuntimeState;
  overflowCount: number;
}>;

export type StarGatherHeartAdvanceResult = Readonly<{
  state: StarGatherHeartRuntimeState;
  lapsedBatches: readonly number[];
  autoCollectCount: number;
}>;

export type StarGatherHeartCollectResult = Readonly<{
  state: StarGatherHeartRuntimeState;
  collectCount: number;
  animationHeartCount: number;
}>;
