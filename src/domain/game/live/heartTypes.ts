export type LoveGatherHeartPhase = 'throw' | 'wait' | 'flash' | 'collect';
export type LoveGatherHeartShowState = 'show' | 'hide-after-throw';
export type LoveGatherHeartRandomRange = (minimum: number, maximum: number) => number;

export type LoveGatherHeartPosition = Readonly<{ x: number; y: number }>;

export type LoveGatherStageHeart = Readonly<{
  lifeTimeSeconds: number;
  phase: LoveGatherHeartPhase;
  showState: LoveGatherHeartShowState;
  spawnElapsedSeconds: number;
  spawnDurationSeconds: number;
  spawnStartPosition: LoveGatherHeartPosition;
  waitPosition: LoveGatherHeartPosition;
  flashElapsedSeconds: number;
  collectElapsedSeconds: number;
  collectMoveDurationSeconds: number;
  collectJumpHeight: number;
}>;

export type LoveGatherHeartRuntimeState = Readonly<{
  heartLimit: number;
  showLimit: number;
  throwLimit: number;
  showPercentage: number;
  baseLifeTimeSeconds: number;
  stageHearts: readonly LoveGatherStageHeart[];
  hiddenHeartBatches: readonly Readonly<{
    count: number;
    lifeTimeSeconds: number;
  }>[];
}>;

export type LoveGatherHeartSpawnResult = Readonly<{
  state: LoveGatherHeartRuntimeState;
  overflowCount: number;
}>;

export type LoveGatherHeartAdvanceResult = Readonly<{
  state: LoveGatherHeartRuntimeState;
  lapsedCount: number;
  autoCollectCount: number;
}>;

export type LoveGatherHeartCollectResult = Readonly<{
  state: LoveGatherHeartRuntimeState;
  collectCount: number;
  animationHeartCount: number;
}>;
