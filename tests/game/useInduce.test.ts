import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

it('使用誘発は子効果を実行し、子効果の発動数で上限を判定する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const state = { ...initial, energy: 0 };
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-1',
    limit: 1,
    effects: [{ kind: 'energy' as const, amount: 1 }],
  };
  const first = applyEffect(state, effect, card);
  const second = applyEffect(first, effect, card);
  expect(first.energy).toBeGreaterThan(0);
  expect(second.energy).toBe(first.energy);
  expect(second.useInduceActivationCounts[`${card.id}:induce-1`]).toBe(1);
});

it('上限0の使用誘発は発動ごとに子効果を実行する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = {
    kind: 'use-induce' as const,
    sourceEffectId: 'induce-2',
    limit: 0,
    effects: [{ kind: 'energy' as const, amount: 1 }],
  };
  const first = applyEffect({ ...initial, energy: 0 }, effect, card);
  const second = applyEffect(first, effect, card);
  expect(second.energy).toBeGreaterThan(first.energy);
  expect(second.useInduceActivationCounts[`${card.id}:induce-2`]).toBe(2);
});
