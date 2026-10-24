import type {
  LoveGatherHeartRuntimeState,
  LoveGatherHeartRandomRange,
  LoveGatherHeartAdvanceResult,
  LoveGatherHeartCollectResult,
} from './heartTypes';
import { validateState, randomValue, loveGatherHeartCount } from './heartState';
const flashThresholdSeconds = 3;
export function advanceLoveGatherHeartRuntime(
  state: LoveGatherHeartRuntimeState,
  deltaTimeSeconds: number,
  autoPlay: boolean,
): LoveGatherHeartAdvanceResult {
  validateState(state);
  if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds < 0) {
    throw new Error('LoveGather Heart delta time is invalid');
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
  return {
    state: { ...state, stageHearts, hiddenHeartBatches },
    lapsedCount: autoPlay ? 0 : expiredCount,
    autoCollectCount: autoPlay ? expiredCount : 0,
  };
}

export function collectLoveGatherHeartRuntime(
  state: LoveGatherHeartRuntimeState,
  randomRange: LoveGatherHeartRandomRange,
): LoveGatherHeartCollectResult {
  validateState(state);
  const collectCount = loveGatherHeartCount(state);
  const collectingHearts = state.stageHearts.filter(
    (heart) => heart.phase !== 'collect' && heart.showState === 'show',
  );
  return {
    state: {
      ...state,
      stageHearts: collectingHearts.map((heart) => ({
        ...heart,
        phase: 'collect' as const,
        collectElapsedSeconds: 0,
        collectMoveDurationSeconds: Math.fround(randomValue(randomRange, 0.9, 1.1)),
        collectJumpHeight: Math.fround(randomValue(randomRange, 0.5, 1)),
      })),
      hiddenHeartBatches: [],
    },
    collectCount,
    animationHeartCount: collectingHearts.length,
  };
}
