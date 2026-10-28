import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { changeResource } from '@akaakuhub/suku-sute-core/game/resources';
import { registerProxySkill } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';

const effect = {
  kind: 'induce-skill-effect',
  condition: 'mental-recover',
  num: 10_000n,
  deckUnderAdd: 5_000n,
  deckOverAdd: 0n,
  deckUnderLimit: 2n,
  deckOverLimit: 0n,
  deckCardMax: 4,
  effects: [
    { actionType: 1, effect: { kind: 'mood', amount: 2 } },
    { actionType: 2, effect: { kind: 'mood', amount: 2 } },
    { actionType: 14, effect: { kind: 'mood', amount: 2 } },
    { actionType: 5, effect: { kind: 'mood', amount: 3 } },
  ],
  duration: { kind: 'stage' },
} as const;

it('ActionType41は対象ActionTypeだけ親引数とデッキ補正込みのEffectPowerを渡す', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    {
      ...initial,
      deck: initial.deck.slice(0, 2),
      deckBoard: { ...initial.deckBoard, deckOutCount: 1 },
      mental: { ...initial.mental, currentMental: 40 },
    },
    effect,
    source,
    2,
    3,
  );
  const next = changeResource(active, 'mental', 10n, 'skill', source, applyEffect);
  expect(next.moodOffset).toBe(603);
  const zeroEvent = changeResource(active, 'mental', 0n, 'skill', source, applyEffect);
  expect(zeroEvent.moodOffset).toBe(3);
  expect(zeroEvent.deckBoard.deckOutCount).toBe(0);
});

it('ActionType41は負のイベントを無視し、電圧上昇を対応する条件へ渡す', () => {
  const initial = game();
  const active = applyEffect(initial, {
    ...effect,
    condition: 'voltage',
    num: 10_000n,
    deckUnderAdd: 0n,
    deckUnderLimit: 0n,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const negative = changeResource(active, 'voltage', -5n, 'skill', undefined, applyEffect);
  expect(negative.moodOffset).toBe(0);
  const positive = changeResource(negative, 'voltage', 5n, 'skill', undefined, applyEffect);
  expect(positive.moodOffset).toBe(0);
  const induced = changeResource(negative, 'voltage', 5n, 'skill', undefined, applyEffect, true);
  expect(induced.moodOffset).toBe(5);
  const natural = changeResource(negative, 'voltage', 5n, 'natural', undefined, applyEffect);
  expect(natural.moodOffset).toBe(0);
});

it('ActionType41はバリア登録が成立したときに耐久値を通知する', () => {
  const active = applyEffect(game(), {
    ...effect,
    condition: 'mental-barrier',
    deckUnderAdd: 0n,
    deckUnderLimit: 0n,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const next = applyEffect(active, {
    kind: 'mental-barrier',
    barrier: 'endurance',
    enduranceType: 'fixed',
    endurance: 5,
    attenuation: 1,
    duration: { kind: 'stage' },
  });
  expect(next.moodOffset).toBe(5);
});

it('ActionType7の耐久無限バリアは最大元気値をActionType41へ通知する', () => {
  const initial = {
    ...game(),
    maximumMental: 200,
    mental: { ...game().mental, currentMental: 200 },
  };
  const active = applyEffect(initial, {
    ...effect,
    condition: 'mental-barrier',
    num: 10_000n,
    deckUnderAdd: 0n,
    deckUnderLimit: 0n,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const next = applyEffect(active, {
    kind: 'mental-barrier',
    barrier: 'endurance',
    enduranceType: 'infinite',
    endurance: 0,
    attenuation: 1,
    duration: { kind: 'stage' },
  });
  expect(next.moodOffset).toBe(200);
});

it('ActionType41はdeck補正上限を参照実装同様にint32へ変換する', () => {
  const initial = game();
  const active = applyEffect(initial, {
    ...effect,
    deckCardMax: initial.deck.length + 1,
    deckUnderAdd: 10_000n,
    deckUnderLimit: 4_294_967_296n,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const next = changeResource(active, 'mental', 1n, 'skill', undefined, applyEffect);
  expect(next.moodOffset).toBe(1);
});

it('ActionType41はlong詳細値とパート期限を2^53超でも保持する', () => {
  const initial = game();
  const exactLong = 9_007_199_254_740_993n;
  const next = applyEffect(initial, {
    ...effect,
    num: exactLong,
    deckUnderAdd: exactLong,
    deckUnderLimit: exactLong,
    duration: { kind: 'sections', value: exactLong },
  });
  const induced = next.inducedSkillEffects[0];
  if (!induced) throw new Error('ActionType41の誘発効果がありません。');
  expect(induced.num).toBe(exactLong);
  expect(induced.deckUnderAdd).toBe(exactLong);
  expect(induced.deckUnderLimit).toBe(exactLong);
  expect(induced.remainingSections).toBe(exactLong);
});

it('ActionType41の子効果はActionType5のProxy吸収時に誘発しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    {
      ...initial,
      deckBoard: { ...initial.deckBoard, deckOutCount: 1 },
      mental: { ...initial.mental, currentMental: 50 },
    },
    { ...effect, effects: [{ actionType: 5, effect: { kind: 'mood', amount: 3 } }] },
    source,
  );
  const proxied = registerProxySkill(
    active,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 5, targetAmount: 10 }],
      effects: [],
    },
    source,
  );
  const next = changeResource(proxied, 'mental', 5n, 'skill', source, applyEffect);
  expect(next.mental.currentMental).toBe(50);
  expect(next.moodOffset).toBe(0);
  expect(next.deckBoard.deckOutCount).toBe(1);
  expect(next.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(5n);
});

it('ActionType41はミリ秒期限とDeactivator解除を適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { ...effect, duration: { kind: 'milliseconds', value: 500n }, deactivationKey: 'induced' },
    source,
  );
  expect(advanceTo(active, 0.6).inducedSkillEffects).toHaveLength(0);
  expect(
    act(active, { type: 'deactivate-induced-skill-effect', deactivationKey: 'induced' })
      .inducedSkillEffects,
  ).toHaveLength(0);
  const permanent = applyEffect(
    initial,
    {
      ...effect,
      duration: { kind: 'milliseconds', value: 500n },
      invocationType: 0x388,
      deactivationKey: 'permanent',
    },
    source,
  );
  expect(advanceTo(permanent, 0.6).inducedSkillEffects).toHaveLength(1);
  expect(
    act(permanent, { type: 'deactivate-induced-skill-effect', deactivationKey: 'permanent' })
      .inducedSkillEffects,
  ).toHaveLength(0);
});
