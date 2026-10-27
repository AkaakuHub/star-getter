import { expect, it } from 'vite-plus/test';
import { calculateQuestLiveFlowerRank } from '@akaakuhub/suku-sute-core/questLive/live/heartRank';
import { collectionScore } from '@akaakuhub/suku-sute-core/game/scoring';
import { voltageThreshold } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { game } from './support/game';

it('未生成の超過数ではなく場の個数で回収ランクを判定する', () => {
  const initial = game();
  const state = {
    ...initial,
    excitement: voltageThreshold(1),
    cardPool: initial.cardPool.map((card) => ({
      ...card,
      appeal: { smile: 1, pure: 1, cool: 1 },
    })),
  };
  expect(collectionScore(state, 1_000_000, true, 100)).toBeLessThan(
    collectionScore(state, 1_000_000, true, 1_000_000),
  );
});

it('専用状態は通常の熱気とは別の閾値と専用値の平方根を使う', () => {
  expect(calculateQuestLiveFlowerRank(130, 9)).toEqual({ rank: 2, magnification: 2.5 });
  expect(calculateQuestLiveFlowerRank(100, 49)).toEqual({ rank: 4, magnification: 3.5 });
});
