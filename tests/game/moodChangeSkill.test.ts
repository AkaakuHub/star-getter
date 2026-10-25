import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { moodValueWithoutLimit } from '../../src/domain/game/projection';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('Action48 calcType1にNumToValue・AddValue・MultiplyFactor・EffectPowerを適用する', () => {
  const initial = { ...game('library'), moodOffset: 10 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: 50_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
    3,
    2,
    2,
  );
  expect(moodValueWithoutLimit(changed)).toBe(52);
});

it('Action48の詳細値をC#のint32へ変換してからNumToValueを計算する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: 2_147_483_648,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(changed.moodSkillBuffs[0]?.value).toBe(-214_748);
});

it('Action48 calcType2は現在の未制限気分値との差を加算する', () => {
  const initial = { ...game('library'), moodOffset: 10 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const changed = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 2,
      num: 15_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(moodValueWithoutLimit(changed)).toBe(15);
});

it('Action48 calcType3は固定値を設定し、calcType4は負気分のとき符号を反転する', () => {
  const initial = { ...game('library'), moodOffset: -10 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const fixed = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 3,
      num: 200_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
    2,
    500,
    9,
  );
  expect(moodValueWithoutLimit(fixed)).toBe(20);
  const signChanged = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 4,
      num: 10_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(moodValueWithoutLimit(signChanged)).toBe(-11);
  const zeroMood = { ...initial, moodOffset: 0 };
  expect(
    applyEffect(
      zeroMood,
      {
        kind: 'mood-change-skill',
        calculationType: 4,
        num: 10_000,
        duration: { kind: 'stage', value: 0 },
      },
      source,
    ),
  ).toBe(zeroMood);
});

it('Action48はActionType52で絶対値を補正してから整数化する', () => {
  const initial = { ...game('library'), moodOffset: 10 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const changed = applyEffect(
    action52,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: 20_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(moodValueWithoutLimit(changed)).toBe(13);
  expect(changed.action52Buffs).toHaveLength(0);
});

it('Action48はProxyに実際の気分値差分を渡し、calcType2の非正判定では吸収しない', () => {
  const initial = { ...game('library'), moodOffset: 10 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const proxy = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 2,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 48, targetAmount: 5 }],
      effects: [],
    },
    source,
  );
  const positive = applyEffect(
    proxy,
    {
      kind: 'mood-change-skill',
      calculationType: 2,
      num: 15_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(positive.moodSkillBuffs).toHaveLength(0);
  expect(positive.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(5n);
  const negativeCondition = applyEffect(
    proxy,
    {
      kind: 'mood-change-skill',
      calculationType: 2,
      num: 5_000,
      duration: { kind: 'stage', value: 0 },
    },
    source,
  );
  expect(negativeCondition.moodSkillBuffs).toHaveLength(1);
  expect(negativeCondition.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(0n);
});

it('Action48は秒・パート期限、期限抑止、外部解除を反映する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const timed = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: 10_000,
      duration: { kind: 'milliseconds', value: 1000 },
      deactivationKey: 'mood-change',
    },
    source,
  );
  expect(advanceTo(timed, 1.1).moodSkillBuffs).toHaveLength(0);
  const held = applyEffect(
    initial,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: 10_000,
      duration: { kind: 'sections', value: 1 },
      invocationType: 0x388,
      deactivationKey: 'mood-change',
    },
    source,
  );
  expect(advanceTo(held, 1.1).moodSkillBuffs).toHaveLength(1);
  const deactivated = act(held, {
    type: 'deactivate-mood-change-skill',
    deactivationKey: 'mood-change',
  });
  expect(deactivated.moodSkillBuffs).toHaveLength(0);
});
