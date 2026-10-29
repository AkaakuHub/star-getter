import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { refreshEffectInducers } from '@akaakuhub/suku-sute-core/game/effects/effectInduce';
import { game } from './support/game';

it('使用誘発は子効果を実行し、子効果の発動数で上限を判定する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const state = { ...initial, ap: { ...initial.ap, currentAp: 0 } };
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-1',
    targetEffectId: 501n,
    limit: 1n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 501n }],
  };
  const first = applyEffect(state, effect, card);
  const second = applyEffect(first, effect, card);
  expect(first.ap.currentAp).toBeGreaterThan(0);
  expect(second.ap.currentAp).toBe(first.ap.currentAp);
  expect(second.skillEffectActivationCounts[`${card.cardInstanceId}:501`]).toBe(1);
});

it('上限0の使用誘発は発動ごとに子効果を実行する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-2',
    targetEffectId: 502n,
    limit: 0n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 502n }],
  };
  const first = applyEffect({ ...initial, ap: { ...initial.ap, currentAp: 0 } }, effect, card);
  const second = applyEffect(first, effect, card);
  expect(second.ap.currentAp).toBeGreaterThan(first.ap.currentAp);
  expect(second.skillEffectActivationCounts[`${card.cardInstanceId}:502`]).toBe(2);
});

it('ActionType905の発動上限を参照実装のint32へ変換する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-3',
    targetEffectId: 503n,
    limit: 18_014_398_509_481_984n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 503n }],
  };
  const first = applyEffect({ ...initial, ap: { ...initial.ap, currentAp: 0 } }, effect, card);
  const second = applyEffect(first, effect, card);
  expect(second.ap.currentAp).toBeGreaterThan(first.ap.currentAp);
  expect(second.skillEffectActivationCounts[`${card.cardInstanceId}:503`]).toBe(2);
});

it('使用回数誘発は参照実装の増加前カウントを使い、要求回数ごとに判定する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-count-induce' as const,
    sourceEffectId: 'induce-3',
    targetEffectId: 504n,
    requireCount: 2n,
    limit: 0n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 504n }],
  };
  const firstUse = applyEffect(
    {
      ...initial,
      skillActivationCounts: { [card.cardInstanceId]: 1 },
      ap: { ...initial.ap, currentAp: 0 },
    },
    effect,
    card,
  );
  const secondUse = applyEffect(
    { ...firstUse, skillActivationCounts: { [card.cardInstanceId]: 2 } },
    effect,
    card,
  );
  const thirdUse = applyEffect(
    { ...secondUse, skillActivationCounts: { [card.cardInstanceId]: 3 } },
    effect,
    card,
  );
  expect(secondUse.ap.currentAp).toBe(firstUse.ap.currentAp);
  expect(thirdUse.ap.currentAp).toBeGreaterThan(secondUse.ap.currentAp);
  expect(thirdUse.skillEffectActivationCounts[`${card.cardInstanceId}:504`]).toBe(2);
});

it('ActionType906のRequireCountを参照実装のint32へ変換する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-count-induce' as const,
    sourceEffectId: 'induce-4',
    targetEffectId: 505n,
    requireCount: 4_294_967_298n,
    limit: 0n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 505n }],
  };
  const activated = applyEffect(
    {
      ...initial,
      skillActivationCounts: { [card.cardInstanceId]: 3 },
      ap: { ...initial.ap, currentAp: 0 },
    },
    effect,
    card,
  );
  expect(activated.ap.currentAp).toBeGreaterThan(0);
});

it('ActionType906は使用回数int32の折返し後も参照実装と同じ余り判定をする', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-count-induce' as const,
    sourceEffectId: 'induce-wrap',
    targetEffectId: 506n,
    requireCount: 3n,
    limit: 0n,
    effects: [{ kind: 'ap' as const, amount: 1, skillEffectId: 506n }],
  };
  const state = {
    ...initial,
    skillActivationCounts: { [card.cardInstanceId]: -2_147_483_648 },
    ap: { ...initial.ap, currentAp: 0 },
  };

  const result = applyEffect(state, effect, card);

  expect(result.ap.currentAp).toBe(0);
});

it('ActionType905は同じ子効果を参照する誘発元で発動上限を共有する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const child = { kind: 'ap' as const, amount: 1, skillEffectId: 507n };
  const first = applyEffect(
    { ...initial, ap: { ...initial.ap, currentAp: 0 } },
    {
      kind: 'use-induce',
      sourceEffectId: 'induce-shared-a',
      targetEffectId: 507n,
      limit: 1n,
      effects: [child],
    },
    card,
  );
  const second = applyEffect(
    first,
    {
      kind: 'use-induce',
      sourceEffectId: 'induce-shared-b',
      targetEffectId: 507n,
      limit: 1n,
      effects: [child],
    },
    card,
  );

  expect(first.ap.currentAp).toBeGreaterThan(0);
  expect(second.ap.currentAp).toBe(first.ap.currentAp);
  expect(second.skillEffectActivationCounts[`${card.cardInstanceId}:507`]).toBe(1);
});

it('ActionType905は通常実行済みの子効果回数も上限判定へ使う', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const child = { kind: 'ap' as const, amount: 1, skillEffectId: 508n };
  const usedNormally = applyEffect(
    { ...initial, ap: { ...initial.ap, currentAp: 0 } },
    child,
    card,
  );
  const induced = applyEffect(
    usedNormally,
    {
      kind: 'use-induce',
      sourceEffectId: 'induce-after-normal-use',
      targetEffectId: 508n,
      limit: 1n,
      effects: [child],
    },
    card,
  );

  expect(induced.ap.currentAp).toBe(usedNormally.ap.currentAp);
  expect(induced.skillEffectActivationCounts[`${card.cardInstanceId}:508`]).toBe(1);
});

it('Action907は子効果のCheckDeckOutを実行する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const state = {
    ...initial,
    deckBoard: { ...initial.deckBoard, deckOutCount: 1 },
    mentalBarriers: {
      effects: [
        {
          effectId: 'endurance',
          barrierType: 'endurance' as const,
          endurance: { kind: 'finite' as const, maximum: 10, consumed: 0 },
          attenuationFactor: 0,
          duration: { kind: 'full-end' as const },
          limitTimeSeconds: Infinity,
          parentControlsLifetime: false,
          deactivationKey: null,
        },
      ],
      additionalBuffs: [],
    },
    effectInducers: [
      {
        sourceCardId: source.cardInstanceId,
        sourceEffectId: `${source.cardInstanceId}:effect-induce`,
        target: 'mental-barrier' as const,
        threshold: { kind: 'none' as const, value: 0 },
        effects: [{ kind: 'ap' as const, amount: 1 }],
        active: false,
        deactivationKey: null,
      },
    ],
  };
  const activated = refreshEffectInducers(state, applyEffect);
  expect(activated.deckBoard.deckOutCount).toBe(0);
});
