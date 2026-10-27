import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { refreshEffectInducers } from '@akaakuhub/suku-sute-core/game/effects/effectInduce';
import { game } from './support/game';

it('使用誘発は子効果を実行し、子効果の発動数で上限を判定する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const state = { ...initial, energy: 0 };
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-1',
    targetEffectId: 501n,
    limit: 1n,
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 501n }],
  };
  const first = applyEffect(state, effect, card);
  const second = applyEffect(first, effect, card);
  expect(first.energy).toBeGreaterThan(0);
  expect(second.energy).toBe(first.energy);
  expect(second.skillEffectActivationCounts[`${card.id}:501`]).toBe(1);
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
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 502n }],
  };
  const first = applyEffect({ ...initial, energy: 0 }, effect, card);
  const second = applyEffect(first, effect, card);
  expect(second.energy).toBeGreaterThan(first.energy);
  expect(second.skillEffectActivationCounts[`${card.id}:502`]).toBe(2);
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
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 503n }],
  };
  const first = applyEffect({ ...initial, energy: 0 }, effect, card);
  const second = applyEffect(first, effect, card);
  expect(second.energy).toBeGreaterThan(first.energy);
  expect(second.skillEffectActivationCounts[`${card.id}:503`]).toBe(2);
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
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 504n }],
  };
  const firstUse = applyEffect(
    { ...initial, energy: 0, skillActivationCounts: { [card.id]: 1 } },
    effect,
    card,
  );
  const secondUse = applyEffect(
    { ...firstUse, skillActivationCounts: { [card.id]: 2 } },
    effect,
    card,
  );
  const thirdUse = applyEffect(
    { ...secondUse, skillActivationCounts: { [card.id]: 3 } },
    effect,
    card,
  );
  expect(secondUse.energy).toBe(firstUse.energy);
  expect(thirdUse.energy).toBeGreaterThan(secondUse.energy);
  expect(thirdUse.skillEffectActivationCounts[`${card.id}:504`]).toBe(2);
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
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 505n }],
  };
  const activated = applyEffect(
    {
      ...initial,
      energy: 0,
      skillActivationCounts: { [card.id]: 3 },
    },
    effect,
    card,
  );
  expect(activated.energy).toBeGreaterThan(0);
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
    effects: [{ kind: 'energy' as const, amount: 1, skillEffectId: 506n }],
  };
  const state = {
    ...initial,
    energy: 0,
    skillActivationCounts: { [card.id]: -2_147_483_648 },
  };

  const result = applyEffect(state, effect, card);

  expect(result.energy).toBe(0);
});

it('ActionType905は同じ子効果を参照する誘発元で発動上限を共有する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const child = { kind: 'energy' as const, amount: 1, skillEffectId: 507n };
  const first = applyEffect(
    { ...initial, energy: 0 },
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

  expect(first.energy).toBeGreaterThan(0);
  expect(second.energy).toBe(first.energy);
  expect(second.skillEffectActivationCounts[`${card.id}:507`]).toBe(1);
});

it('ActionType905は通常実行済みの子効果回数も上限判定へ使う', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const child = { kind: 'energy' as const, amount: 1, skillEffectId: 508n };
  const usedNormally = applyEffect({ ...initial, energy: 0 }, child, card);
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

  expect(induced.energy).toBe(usedNormally.energy);
  expect(induced.skillEffectActivationCounts[`${card.id}:508`]).toBe(1);
});

it('Action907は子効果のCheckDeckOutを実行する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const state = {
    ...initial,
    deckOutCount: 1,
    mentalBarriers: [
      {
        kind: 'endurance' as const,
        endurance: 10,
        currentEndurance: 0,
        attenuation: 0,
        remainingSeconds: null,
        remainingSections: null,
      },
    ],
    effectInducers: [
      {
        sourceCardId: source.id,
        sourceEffectId: `${source.id}:effect-induce`,
        target: 'mental-barrier' as const,
        threshold: { kind: 'none' as const, value: 0 },
        effects: [{ kind: 'energy' as const, amount: 1 }],
        active: false,
        deactivationKey: null,
      },
    ],
  };
  const activated = refreshEffectInducers(state, applyEffect);
  expect(activated.deckOutCount).toBe(0);
});
