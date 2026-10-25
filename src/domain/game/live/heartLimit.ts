import type { StarGatherHeartRuntimeState } from './heartTypes';
import { validateState, starGatherHeartCount } from './heartState';
type StarGatherHeartLimitChangeResult = Readonly<{
  state: StarGatherHeartRuntimeState;
  lapsedCount: number;
}>;
export function changeStarGatherHeartLimit(
  state: StarGatherHeartRuntimeState,
  heartLimit: number,
): StarGatherHeartLimitChangeResult {
  validateState(state);
  if (!Number.isSafeInteger(heartLimit) || heartLimit < 0) {
    throw new Error('StarGather Heart limit is invalid');
  }
  let remainingRemovalCount = Math.max(starGatherHeartCount(state) - heartLimit, 0);
  const stageRemovalIndices = new Set(
    state.stageHearts
      .map((heart, index) => ({ heart, index }))
      .filter(({ heart }) => heart.phase !== 'collect')
      .sort(
        (left, right) =>
          right.heart.lifeTimeSeconds - left.heart.lifeTimeSeconds || right.index - left.index,
      )
      .slice(0, remainingRemovalCount)
      .map(({ index }) => index),
  );
  remainingRemovalCount -= stageRemovalIndices.size;
  let hiddenRemovalCount = 0;
  const hiddenHeartBatches = [...state.hiddenHeartBatches]
    .reverse()
    .flatMap((batch) => {
      if (remainingRemovalCount === 0) return [batch];
      const removedCount = Math.min(batch.count, remainingRemovalCount);
      remainingRemovalCount -= removedCount;
      hiddenRemovalCount += removedCount;
      const count = batch.count - removedCount;
      return count === 0 ? [] : [{ ...batch, count }];
    })
    .reverse();
  if (remainingRemovalCount !== 0) {
    throw new Error('StarGather Heart limit removal count differs');
  }
  return {
    state: {
      ...state,
      heartLimit,
      stageHearts: state.stageHearts.filter((_, index) => !stageRemovalIndices.has(index)),
      hiddenHeartBatches,
    },
    lapsedCount: stageRemovalIndices.size + hiddenRemovalCount,
  };
}
