import { expect, it } from 'vite-plus/test';
import { registerProxySkill } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { addHeartsWithLifeTime, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game } from './support/game';

function initial(targetAmount: number, induceTiming: 1 | 2) {
  const base = game();
  const card = base.deck[0];
  if (!card) throw new Error('発動元カードがありません。');
  return registerProxySkill(
    {
      ...base,
      handEffectCardIds: [],
      amplification: 100,
      targetBoosts: [],
      ap: { ...base.ap, currentAp: 0 },
    },
    {
      kind: 'proxy-skill',
      absorbLimit: 0,
      periodType: 1,
      periodParam: 1000n,
      induceTiming,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 1, targetAmount }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
    },
    card,
  );
}

it('Heart0個の要求も吸収判定を通し到達時の子効果を実行する', () => {
  const base = initial(0, 1);
  const next = addHeartsWithLifeTime(base, 0, 2);
  expect(next.ap.currentAp).toBe(2);
  expect(next.proxySkills).toEqual([]);
  expect(heartCount(next)).toBe(0);
  expect(next.heartRandomSeed).toBe(base.heartRandomSeed);
  expect(next.hearts.generationCount).toBe(base.hearts.generationCount);
});

it('吸収したHeartは生成数と乱数を進めず要求個数を全量加算する', () => {
  const base = initial(5, 2);
  const next = addHeartsWithLifeTime(base, 7, 2);
  expect(next.proxySkills[0]?.effects[0]?.totalAmount).toBe(7n);
  expect(heartCount(next)).toBe(0);
  expect(next.heartRandomSeed).toBe(base.heartRandomSeed);
  expect(next.hearts.generationCount).toBe(base.hearts.generationCount);
});
