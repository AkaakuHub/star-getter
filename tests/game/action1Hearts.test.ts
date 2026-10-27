import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { beatHeartCount } from '@akaakuhub/suku-sute-core/game/beat';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game } from './support/game';

it('ActionType1は固定数を整数化してからEffectPowerを掛け、ミリ秒寿命を使う', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const result = applyEffect(
    initial,
    {
      kind: 'skill-hearts',
      skillEffectId: 1n,
      calculation: 'fixed',
      amount: 25_000,
      displayTime: { kind: 'milliseconds', value: 1_250 },
    },
    card,
    1,
    0,
    1.5,
  );

  expect(heartCount(result) - heartCount(initial)).toBe(3);
  expect(result.hearts.stageHearts[0]?.lifeTimeSeconds).toBe(1.25);
});

it('ActionType1の比率計算は自然発生数を基準にし、非ミリ秒寿命を曲終端までにする', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const expectedCount = Math.trunc(beatHeartCount(initial) * 1.5);
  const result = applyEffect(
    initial,
    {
      kind: 'skill-hearts',
      skillEffectId: 2n,
      calculation: 'ratio',
      amount: 10_000,
      displayTime: { kind: 'sections', value: 1 },
    },
    card,
    1,
    0,
    1.5,
  );

  expect(heartCount(result) - heartCount(initial)).toBe(expectedCount);
  expect(result.hearts.stageHearts[0]?.lifeTimeSeconds).toBe(9_999);
});
