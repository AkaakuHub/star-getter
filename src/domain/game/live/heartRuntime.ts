import type {
  StarGatherHeartRuntimeState,
  StarGatherHeartRandomRange,
  StarGatherHeartAdvanceResult,
  StarGatherHeartCollectResult,
} from './heartTypes';
import { validateState, randomValue, starGatherHeartCount } from './heartState';
const flashThresholdSeconds = 3;
export function advanceStarGatherHeartRuntime(
  state: StarGatherHeartRuntimeState,
  deltaTimeSeconds: number,
  autoPlay: boolean,
): StarGatherHeartAdvanceResult {
  validateState(state);
  if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds < 0) {
    throw new Error('StarGather Heart delta time is invalid');
  }
  let expiredStageCount = 0;
  const stageHearts = state.stageHearts.flatMap((heart) => {
    if (heart.phase === 'collect') {
      const collectElapsedSeconds = Math.fround(
        Math.fround(heart.collectElapsedSeconds) + Math.fround(deltaTimeSeconds),
      );
      return collectElapsedSeconds + Number.EPSILON >= heart.collectMoveDurationSeconds
        ? []
        : [{ ...heart, collectElapsedSeconds }];
    }
    const lifeTimeSeconds = Math.fround(
      Math.fround(heart.lifeTimeSeconds) - Math.fround(deltaTimeSeconds),
    );
    if (heart.phase === 'flash' && lifeTimeSeconds < 0) {
      expiredStageCount += 1;
      return [];
    }
    const spawnElapsedSeconds = Math.fround(
      Math.fround(heart.spawnElapsedSeconds) + Math.fround(deltaTimeSeconds),
    );
    const entersFlash = heart.phase !== 'flash' && lifeTimeSeconds < flashThresholdSeconds;
    return [
      {
        ...heart,
        lifeTimeSeconds,
        spawnElapsedSeconds,
        phase: entersFlash
          ? ('flash' as const)
          : heart.phase === 'throw' && spawnElapsedSeconds >= heart.spawnDurationSeconds
            ? ('wait' as const)
            : heart.phase,
        flashElapsedSeconds:
          heart.phase === 'flash'
            ? Math.fround(Math.fround(heart.flashElapsedSeconds) + Math.fround(deltaTimeSeconds))
            : 0,
      },
    ];
  });
  let expiredHiddenCount = 0;
  const hiddenHeartBatches = state.hiddenHeartBatches.flatMap((batch) => {
    const lifeTimeSeconds = Math.fround(
      Math.fround(batch.lifeTimeSeconds) - Math.fround(deltaTimeSeconds),
    );
    if (lifeTimeSeconds < 0) {
      expiredHiddenCount += batch.count;
      return [];
    }
    return [{ ...batch, lifeTimeSeconds }];
  });
  const expiredCount = expiredStageCount + expiredHiddenCount;
  const collectionSoundDelays = state.collectionSoundDelays
    .map((delay) => delay - deltaTimeSeconds)
    .filter((delay) => delay > Number.EPSILON);
  return {
    state: {
      ...state,
      stageHearts,
      hiddenHeartBatches,
      collectionSoundDelays,
      collectionSoundCount:
        state.collectionSoundCount +
        state.collectionSoundDelays.length -
        collectionSoundDelays.length,
    },
    lapsedCount: autoPlay ? 0 : expiredCount,
    autoCollectCount: autoPlay ? expiredCount : 0,
  };
}

export function collectStarGatherHeartRuntime(
  state: StarGatherHeartRuntimeState,
  randomRange: StarGatherHeartRandomRange,
): StarGatherHeartCollectResult {
  validateState(state);
  const collectCount = starGatherHeartCount(state);
  const collectingHearts = state.stageHearts.filter(
    (heart) => heart.phase !== 'collect' && heart.showState === 'show',
  );
  const animations = collectingHearts.map((heart) => ({
    ...heart,
    phase: 'collect' as const,
    collectElapsedSeconds: 0,
    collectMoveDurationSeconds: Math.fround(randomValue(randomRange, 0.9, 1.1)),
    collectJumpHeight: Math.fround(randomValue(randomRange, 0.5, 1)),
  }));
  return {
    state: {
      ...state,
      stageHearts: animations,
      collectionSoundDelays: [
        ...state.collectionSoundDelays,
        ...animations.map(
          (heart) => heart.collectMoveDurationSeconds * randomValue(randomRange, 0.7, 1),
        ),
      ],
      hiddenHeartBatches: [],
    },
    collectCount,
    animationHeartCount: collectingHearts.length,
  };
}
