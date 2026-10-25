import { expect, it } from 'vite-plus/test';
import { scoreMultipliers } from '../../src/content/scoring';
import { calculateStarGatherAddScoreMax } from '../../src/domain/game/live/clientScoreInput';

it('100個までは2³¹−1で、101個から本家のマスター値で上限を増やす', () => {
  expect(calculateStarGatherAddScoreMax(100, scoreMultipliers)).toBe(2_147_483_647n);
  expect(calculateStarGatherAddScoreMax(101, scoreMultipliers)).toBe(2_168_958_483n);
  expect(calculateStarGatherAddScoreMax(10_000_000, scoreMultipliers)).toBe(32_212_254_705_000n);
});
