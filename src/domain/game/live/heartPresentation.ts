import type { LoveGatherStageHeart } from './heartTypes';

type LoveGatherHeartPresentation = Readonly<{
  rank: 0 | 1 | 2 | 3 | 4;
  position: Readonly<{ x: number; y: number }>;
  scale: number;
  alpha: number;
  collectionProgress: number;
  collectionScale: number;
  collectionJumpHeight: number;
}>;

const loveGatherHeartShowLimitSettings = {
  minimum: 10,
  maximum: 100,
  step: 10,
  defaultValue: 50,
} as const;

const waitFallSpeed = -0.2;
const spawnAlphaDurationSeconds = 0.5;
const hideAfterThrowDurationSeconds = 0.2;
const flashHalfCycleSeconds = 0.2;

export function resolveLoveGatherHeartDrawCount(
  heartCount: number,
  maximumVisibleHeartCount: number,
): number {
  if (!Number.isSafeInteger(heartCount) || heartCount < 0) {
    throw new Error('LoveGather Heart draw count is invalid');
  }
  const { minimum, maximum, step } = loveGatherHeartShowLimitSettings;
  if (
    !Number.isSafeInteger(maximumVisibleHeartCount) ||
    maximumVisibleHeartCount < minimum ||
    maximumVisibleHeartCount > maximum ||
    (maximumVisibleHeartCount - minimum) % step !== 0
  ) {
    throw new Error('LoveGather Heart show limit is invalid');
  }
  return Math.min(heartCount, maximumVisibleHeartCount);
}

export function projectLoveGatherHeartPresentations(
  hearts: readonly LoveGatherStageHeart[],
  rank: number,
): readonly LoveGatherHeartPresentation[] {
  if (!Number.isSafeInteger(rank) || rank < 0 || rank > 4) {
    throw new Error('LoveGather Heart rank is invalid');
  }
  return hearts.flatMap((heart) => {
    const spawnProgress = Math.min(heart.spawnElapsedSeconds / heart.spawnDurationSeconds, 1);
    const waitElapsedSeconds = Math.max(heart.spawnElapsedSeconds - heart.spawnDurationSeconds, 0);
    if (
      heart.showState === 'hide-after-throw' &&
      waitElapsedSeconds + Number.EPSILON >= hideAfterThrowDurationSeconds
    ) {
      return [];
    }
    const easedSpawnProgress = spawnProgress === 1 ? 1 : 1 - 2 ** (-10 * spawnProgress);
    const position = {
      x:
        heart.spawnStartPosition.x +
        (heart.waitPosition.x - heart.spawnStartPosition.x) * easedSpawnProgress,
      y:
        heart.spawnStartPosition.y +
        (heart.waitPosition.y - heart.spawnStartPosition.y) * easedSpawnProgress +
        waitFallSpeed * waitElapsedSeconds,
    };
    const spawnAlpha = Math.min(heart.spawnElapsedSeconds / spawnAlphaDurationSeconds, 1);
    const hideAlpha =
      heart.showState === 'hide-after-throw'
        ? 1 - waitElapsedSeconds / hideAfterThrowDurationSeconds
        : 1;
    const flashCycle = (heart.flashElapsedSeconds / flashHalfCycleSeconds) % 2;
    const flashAlpha =
      heart.phase !== 'flash' ? 1 : flashCycle <= 1 ? 1 - flashCycle : flashCycle - 1;
    const collectProgress = collectionProgress(heart);
    return [
      {
        rank: rank as 0 | 1 | 2 | 3 | 4,
        position,
        scale: 1,
        alpha: Math.max(Math.min(spawnAlpha, hideAlpha, flashAlpha, 1), 0),
        collectionProgress: collectProgress.position,
        collectionScale: collectProgress.scale,
        collectionJumpHeight:
          heart.phase === 'collect'
            ? Math.sin(Math.PI * collectProgress.position) * heart.collectJumpHeight
            : 0,
      },
    ];
  });
}

function collectionProgress(
  heart: LoveGatherStageHeart,
): Readonly<{ position: number; scale: number }> {
  if (heart.phase !== 'collect') return { position: 0, scale: 1 };
  const progress = Math.min(heart.collectElapsedSeconds / heart.collectMoveDurationSeconds, 1);
  return {
    position: 1 - (1 - progress) ** 2,
    scale: progress <= 0.5 ? 1 : 1 - (progress - 0.5),
  };
}
