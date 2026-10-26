import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import { advanceTo } from '../../src/domain/game/simulation';
import {
  advanceHeartLimitBuffs,
  applyHeartLimit,
  deactivateHeartLimitBuffs,
  expireHeartLimitBuffSections,
} from '../../src/domain/game/effects/heartLimit';
import { game } from './support/game';
import { validateEffect } from '../../src/domain/game/effectValidation';

it('加算変更は期限後に解除し、既存の基礎上限へ戻る', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'milliseconds', value: 1000n },
    },
    card,
  );
  expect(changed.hearts.heartLimit).toBe(102);
  expect(changed.heartLimitBuffs[0]?.value).toBe(2);
  expect(advanceHeartLimitBuffs(changed, 1).hearts.heartLimit).toBe(100);
});

it('ActionType25の表示期限0パートは次のパート変更で解除する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const effect = {
    kind: 'heart-limit-change',
    calculationType: 1,
    num: 10_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'sections', value: 0n },
  } as const;

  validateEffect(effect);
  const changed = applyEffect(state, effect, card);

  expect(changed.hearts.heartLimit).toBe(101);
  expect(expireHeartLimitBuffSections(changed).hearts.heartLimit).toBe(100);
});

it('乗算変更はC#のSkillグループ倍率式で基礎上限へ適用する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 2,
      num: 15_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
    },
    card,
  );
  expect(changed.heartLimitBuffs[0]?.value).toBe(50);
  expect(changed.hearts.heartLimit).toBe(5000);
  expect(expireHeartLimitBuffSections(changed).hearts.heartLimit).toBe(5000);
});

it('ActionType25は追加バフ対象外の負数をそのまま上限変更へ渡す', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 10_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
    },
    card,
    1,
    -2,
  );
  expect(changed.heartLimitBuffs[0]?.value).toBe(-1);
  expect(changed.hearts.heartLimit).toBe(99);
});

it('パート期限と外部解除で上限変更を解除し、直接上限変更は基礎値に加える', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'sections', value: 1n },
      deactivationKey: 'limit',
    },
    card,
  );
  expect(expireHeartLimitBuffSections(changed).hearts.heartLimit).toBe(100);
  expect(applyHeartLimit(changed, 10).hearts.heartLimit).toBe(112);
  const stacked = applyEffect(
    changed,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
      deactivationKey: 'limit',
    },
    card,
  );
  expect(stacked.hearts.heartLimit).toBe(104);
  expect(deactivateHeartLimitBuffs(stacked, 'limit').hearts.heartLimit).toBe(100);
});

it('Action49の加算・割合バフをAction25の効果へ順に適用する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const addBuff = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 2,
    num: 10_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'stage', value: 0n },
    disabledType: 0,
    disabledCount: 0n,
    target: { kind: 'all' },
  });
  const added = applyEffect(
    addBuff,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
    },
    card,
  );
  expect(added.hearts.heartLimit).toBe(103);

  const multiplyBuff = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 1,
    num: 500_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'stage', value: 0n },
    disabledType: 0,
    disabledCount: 0n,
    target: { kind: 'all' },
  });
  const multiplied = applyEffect(
    multiplyBuff,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
    },
    card,
  );
  expect(multiplied.hearts.heartLimit).toBe(103);
});

it('Action49はC#のMathf.Roundと同じ偶数丸めを適用する', () => {
  const state = game();
  const buff = applyEffect(
    state,
    {
      kind: 'heart-limit-boost',
      calculationType: 2,
      num: 15_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledCount: 0n,
      target: { kind: 'all' },
    },
    undefined,
  );
  expect(buff.heartLimitAdditionalBuffs[0]?.value).toBe(2);
});

it('Action49の対象と使用回数をAction25の発動カードで判定する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const buff = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 2,
    num: 10_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'stage', value: 0n },
    disabledType: 1,
    disabledCount: 1n,
    target: { kind: 'member', member: card.member },
  });
  const change = {
    kind: 'heart-limit-change' as const,
    calculationType: 1 as const,
    num: 20_000n,
    bonusMoodTarget: 0 as const,
    bonusMoodValue: 0n,
    duration: { kind: 'stage' as const },
  };
  const first = applyEffect(buff, change, card);
  expect(first.hearts.heartLimit).toBe(103);
  expect(first.heartLimitAdditionalBuffs).toHaveLength(0);
  const second = applyEffect(first, change, card);
  expect(second.hearts.heartLimit).toBe(105);
});

it('Action49のParamValuesはParamがNoneのためAction25で条件に使わない', () => {
  const state = game();
  const source = state.deck[0];
  if (!source) throw new Error('きらめき上限変更の発動元カードがありません。');
  const target = { ...source, tokenSeriesIds: [42] };
  const seriesBuff = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 2,
    num: 1_000_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'stage', value: 0n },
    disabledType: 0,
    disabledCount: 0n,
    target: { kind: 'all' },
    tokenCardSeriesIds: [42n],
  });
  const changed = applyEffect(
    seriesBuff,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 10_000n,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
      duration: { kind: 'stage' },
    },
    target,
  );
  expect(changed.hearts.heartLimit).toBe(state.hearts.heartLimit + 101);
});

it('Action49は時間・パート期限と外部解除を処理する', () => {
  const state = game();
  const timed = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 2,
    num: 10_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'milliseconds', value: 1000n },
    disabledType: 0,
    disabledCount: 0n,
    target: { kind: 'all' },
    deactivationKey: 'limit-boost',
  });
  const nextSection = state.track.sections[1];
  if (!nextSection) throw new Error('パートがありません。');
  const section = applyEffect(state, {
    kind: 'heart-limit-boost',
    calculationType: 2,
    num: 10_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'sections', value: 1n },
    disabledType: 0,
    disabledCount: 0n,
    target: { kind: 'all' },
  });
  expect(advanceTo(timed, 1.1).heartLimitAdditionalBuffs).toHaveLength(0);
  expect(section.heartLimitAdditionalBuffs).toHaveLength(1);
  expect(
    advanceTo(section, (nextSection.startBeat * 60) / state.track.bpm + 1 / 60)
      .heartLimitAdditionalBuffs,
  ).toHaveLength(0);
  const manuallyDeactivated = act(timed, {
    type: 'deactivate-heart-limit-boost',
    deactivationKey: 'limit-boost',
  });
  expect(manuallyDeactivated.heartLimitAdditionalBuffs).toHaveLength(0);
});
