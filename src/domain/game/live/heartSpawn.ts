import type {
  LoveGatherHeartRuntimeState,
  LoveGatherHeartRandomRange,
  LoveGatherHeartSpawnResult,
  LoveGatherHeartShowState,
  LoveGatherStageHeart,
} from './heartTypes';
import { validateState, randomValue, loveGatherHeartCount } from './heartState';
const defaultHeartLimit = 100;
const defaultShowLimit = 50;
const defaultShowPercentage = 50;
const spawnDurationSeconds = 0.5;

function calculateLoveGatherHeartBaseLifeTimeSeconds(musicFinishTimeSeconds: number): number {
  if (!Number.isFinite(musicFinishTimeSeconds) || musicFinishTimeSeconds < 0) {
    throw new Error('LoveGather Heart music finish time is invalid');
  }
  const finishMilliseconds = Math.fround(Math.fround(musicFinishTimeSeconds) * Math.fround(1000));
  const scaled = Math.fround(
    Math.fround(finishMilliseconds * Math.fround(10_000)) / Math.fround(120_000),
  );
  return Math.trunc(scaled) / 1000;
}

export function createLoveGatherHeartRuntimeState(
  musicFinishTimeSeconds: number,
): LoveGatherHeartRuntimeState {
  return {
    heartLimit: defaultHeartLimit,
    showLimit: defaultShowLimit,
    throwLimit: defaultHeartLimit,
    showPercentage: defaultShowPercentage,
    baseLifeTimeSeconds: calculateLoveGatherHeartBaseLifeTimeSeconds(musicFinishTimeSeconds),
    stageHearts: [],
    hiddenHeartBatches: [],
  };
}

export function spawnLoveGatherBeatHearts(
  state: LoveGatherHeartRuntimeState,
  requestedCount: number,
  randomRange: LoveGatherHeartRandomRange,
): LoveGatherHeartSpawnResult {
  return spawnLoveGatherHearts(state, requestedCount, state.baseLifeTimeSeconds, randomRange);
}

function spawnLoveGatherHearts(
  state: LoveGatherHeartRuntimeState,
  requestedCount: number,
  lifeTimeSeconds: number,
  randomRange: LoveGatherHeartRandomRange,
): LoveGatherHeartSpawnResult {
  validateState(state);
  if (
    !Number.isSafeInteger(requestedCount) ||
    requestedCount < 0 ||
    !Number.isFinite(lifeTimeSeconds) ||
    lifeTimeSeconds < 0
  ) {
    throw new Error('LoveGather Heart spawn count is invalid');
  }
  const createdCount = Math.min(
    requestedCount,
    Math.max(state.heartLimit - loveGatherHeartCount(state), 0),
  );
  const displayCount = Math.ceil(
    Math.fround(Math.fround(createdCount * state.showPercentage) * Math.fround(0.01)),
  );
  const currentShowCount = state.stageHearts.filter((heart) => heart.showState === 'show').length;
  const showCount = Math.min(displayCount, Math.max(state.showLimit - currentShowCount, 0));
  const throwCount = Math.min(displayCount, state.throwLimit);
  const hideAfterThrowCount = throwCount - showCount;
  const hiddenCount = createdCount - throwCount;
  const createStageHeart = (showState: LoveGatherHeartShowState): LoveGatherStageHeart => {
    const waitPosition = {
      x: randomValue(randomRange, -5.5, 5.5),
      y: randomValue(randomRange, -1.5, 0.5),
    };
    const spawnStartPosition = {
      x: waitPosition.x,
      y: Math.fround(waitPosition.y - randomValue(randomRange, 0.8, 1.2)),
    };
    return {
      lifeTimeSeconds,
      phase: 'throw',
      showState,
      spawnElapsedSeconds: 0,
      spawnDurationSeconds: Math.fround(randomValue(randomRange, 0.9, 1.1) * spawnDurationSeconds),
      spawnStartPosition,
      waitPosition,
      flashElapsedSeconds: 0,
      collectElapsedSeconds: 0,
      collectMoveDurationSeconds: 1,
      collectJumpHeight: 0.5,
    };
  };
  return {
    state: {
      ...state,
      stageHearts: [
        ...state.stageHearts,
        ...Array.from({ length: showCount }, () => createStageHeart('show')),
        ...Array.from({ length: hideAfterThrowCount }, () => createStageHeart('hide-after-throw')),
      ],
      hiddenHeartBatches:
        hiddenCount === 0
          ? state.hiddenHeartBatches
          : [
              ...state.hiddenHeartBatches,
              {
                count: hiddenCount,
                lifeTimeSeconds,
              },
            ],
    },
    overflowCount: requestedCount - createdCount,
  };
}
