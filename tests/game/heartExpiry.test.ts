import { expect, it } from 'vite-plus/test';
import { addHearts, advanceHearts, heartCount } from '../../src/domain/game/hearts';
import { game } from './support/game';

it('同じフレームの失効でも表示1個ずつと非表示バッチごとに得点上限を適用する', () => {
  const initial = game('library');
  const spawned = addHearts(
    {
      ...initial,
      boosts: [{ percent: 10 ** 20, untilTick: 100 }],
      hearts: { ...initial.hearts, showLimit: 2, throwLimit: 2, showPercentage: 100 },
    },
    6,
  );
  expect(spawned.hearts.stageHearts).toHaveLength(2);
  expect(spawned.hearts.hiddenHeartBatches).toHaveLength(1);
  const expired = advanceHearts({
    ...spawned,
    hearts: {
      ...spawned.hearts,
      stageHearts: spawned.hearts.stageHearts.map((heart) => ({
        ...heart,
        phase: 'flash',
        lifeTimeSeconds: 0,
      })),
      hiddenHeartBatches: spawned.hearts.hiddenHeartBatches.map((batch) => ({
        ...batch,
        lifeTimeSeconds: 0,
      })),
    },
  });
  expect(expired.score - spawned.score).toBe(3n * 2_147_483_647n);
  expect(expired.stats.heartsMissed - spawned.stats.heartsMissed).toBe(6);
  expect(heartCount(expired)).toBe(0);
});
