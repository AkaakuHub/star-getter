import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { changeResource } from '../../src/domain/game/resources';
import { registerProxySkill } from '../../src/domain/game/effects/proxySkill';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

const effect = {
  kind: 'induce-skill-effect',
  condition: 'mental-recover',
  num: 10_000,
  deckUnderAdd: 5_000,
  deckOverAdd: 0,
  deckUnderLimit: 2,
  deckOverLimit: 0,
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
    { ...initial, deck: initial.deck.slice(0, 2), stamina: 40, deckOutCount: 1 },
    effect,
    source,
    2,
    3,
  );
  const next = changeResource(active, 'stamina', 10n, 'skill', source, applyEffect);
  expect(next.moodOffset).toBe(603);
  const zeroEvent = changeResource(active, 'stamina', 0n, 'skill', source, applyEffect);
  expect(zeroEvent.moodOffset).toBe(3);
  expect(zeroEvent.deckOutCount).toBe(0);
});

it('ActionType41は負のイベントを無視し、電圧上昇を対応する条件へ渡す', () => {
  const initial = game();
  const active = applyEffect(initial, {
    ...effect,
    condition: 'voltage',
    num: 10_000,
    deckUnderAdd: 0,
    deckUnderLimit: 0,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const negative = changeResource(active, 'excitement', -5n, 'skill', undefined, applyEffect);
  expect(negative.moodOffset).toBe(0);
  const positive = changeResource(negative, 'excitement', 5n, 'skill', undefined, applyEffect);
  expect(positive.moodOffset).toBe(5);
});

it('ActionType41はバリア登録が成立したときに耐久値を通知する', () => {
  const active = applyEffect(game(), {
    ...effect,
    condition: 'mental-barrier',
    deckUnderAdd: 0,
    deckUnderLimit: 0,
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

it('ActionType41はdeck補正上限をC#同様にint32へ変換する', () => {
  const initial = game();
  const active = applyEffect(initial, {
    ...effect,
    deckCardMax: initial.deck.length + 1,
    deckUnderAdd: 10_000,
    deckUnderLimit: 4_294_967_296,
    effects: [{ actionType: 1, effect: { kind: 'mood', amount: 1 } }],
  });
  const next = changeResource(active, 'stamina', 1n, 'skill', undefined, applyEffect);
  expect(next.moodOffset).toBe(1);
});

it('ActionType41の子効果はActionType5のProxy吸収時に誘発しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    { ...initial, stamina: 50, deckOutCount: 1 },
    { ...effect, effects: [{ actionType: 5, effect: { kind: 'mood', amount: 3 } }] },
    source,
  );
  const proxied = registerProxySkill(
    active,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 5, targetAmount: 10 }],
      effects: [],
    },
    source,
  );
  const next = changeResource(proxied, 'stamina', 5n, 'skill', source, applyEffect);
  expect(next.stamina).toBe(50);
  expect(next.moodOffset).toBe(0);
  expect(next.deckOutCount).toBe(1);
  expect(next.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(5n);
});

it('ActionType41はミリ秒期限とDeactivator解除を適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { ...effect, duration: { kind: 'milliseconds', value: 500 }, deactivationKey: 'induced' },
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
      duration: { kind: 'milliseconds', value: 500 },
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
