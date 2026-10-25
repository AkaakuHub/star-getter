import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { act } from '../../src/domain/game/actions';
import { game } from './support/game';

it('ActionType32は対象カードの元気回復を増幅し、指定回数で解除する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const target = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source || !target) throw new Error('検証用カードがありません。');
  const clean = {
    ...initial,
    stamina: 0,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
    resourceBoosts: [],
  };
  const buffed = applyEffect(
    clean,
    {
      kind: 'recover-mental-additional-buff',
      calculation: 1,
      num: 1_000_000,
      target: { kind: 'member', member: target.member },
      duration: { kind: 'milliseconds', value: 10_000 },
      disabledType: 1,
      disabledCount: 1,
      deactivationKey: 'mental-recover-test',
    },
    source,
  );
  const recovered = applyEffect(buffed, { kind: 'stamina', amount: 20 }, target);
  expect(recovered.stamina).toBe(40);
  expect(recovered.mentalRecoverAdditionalBuffs).toHaveLength(0);
  const unmatched = applyEffect(buffed, { kind: 'stamina', amount: 20 }, source);
  expect(unmatched.stamina).toBe(20);
  const deactivated = act(buffed, {
    type: 'deactivate-mental-recover-additional-buff',
    deactivationKey: 'mental-recover-test',
  });
  expect(deactivated.mentalRecoverAdditionalBuffs).toHaveLength(0);
});

it('ActionType32はミリ秒・パート期限とInvocationType抑止を処理する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const nextSection = initial.track.sections[1];
  if (!source || !nextSection) throw new Error('検証用データがありません。');
  const effect = {
    kind: 'recover-mental-additional-buff',
    calculation: 1,
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500 },
    disabledType: 0,
    disabledCount: 0,
  } as const;
  const timed = applyEffect(initial, effect, source);
  expect(advanceTo(timed, 0.6).mentalRecoverAdditionalBuffs).toHaveLength(0);
  const sectioned = applyEffect(
    initial,
    { ...effect, duration: { kind: 'sections', value: 1 } },
    source,
  );
  expect(
    advanceTo(sectioned, (nextSection.startBeat * 60) / sectioned.track.bpm + 1 / 60)
      .mentalRecoverAdditionalBuffs,
  ).toHaveLength(0);
  const persistent = applyEffect(initial, { ...effect, invocationType: 0x388 }, source);
  expect(advanceTo(persistent, 0.6).mentalRecoverAdditionalBuffs).toHaveLength(1);
});

it('ActionType32の登録値にActionType52を適用する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const additional = applyEffect(
    action52,
    {
      kind: 'recover-mental-additional-buff',
      calculation: 1,
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledCount: 0,
    },
    source,
  );
  expect(additional.mentalRecoverAdditionalBuffs[0]?.percent).toBe(75);
  expect(additional.action52Buffs).toHaveLength(0);
});
