import { expect, it } from 'vite-plus/test';
import { scoreMultipliers } from '../../src/content/scoring';
import { calculateStarGatherAddScoreMax } from '../../src/domain/game/live/clientScoreInput';
import { finalizeStarGatherSkillCost } from '../../src/domain/game/live/skillCost';

const ordinaryLimit = {
  additionalEnabled: false,
  bonusScoreValue: 0,
  voltageMultiplier: 0n,
  bloomActive: false,
  bloomGauge: 0,
};

it('基本消費量が1以上のカードは、減少効果を重ねても最低1を消費する', () => {
  expect(finalizeStarGatherSkillCost(5, -20)).toBe(1);
  expect(finalizeStarGatherSkillCost(5, -2)).toBe(3);
  expect(finalizeStarGatherSkillCost(0, 0)).toBe(0);
});

it('100個までは2³¹−1で、101個から本家のマスター値で上限を増やす', () => {
  expect(calculateStarGatherAddScoreMax(100, scoreMultipliers, ordinaryLimit)).toBe(2_147_483_647n);
  expect(calculateStarGatherAddScoreMax(101, scoreMultipliers, ordinaryLimit)).toBe(2_168_958_484n);
  expect(calculateStarGatherAddScoreMax(10_000_000, scoreMultipliers, ordinaryLimit)).toBe(
    32_212_254_705_000n,
  );
});
