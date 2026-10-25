import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  deactivateInducedEffects,
  refreshEffectInducers,
} from '../../src/domain/game/effects/effectInduce';
import { game } from './support/game';

it('ボーナス得点のしきい値を満たすと子効果を有効化し、外れると解除する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const boosted = applyEffect(initial, { kind: 'boost', multiplier: 1.1 }, source);
  const armed = applyEffect(
    boosted,
    {
      kind: 'effect-induce',
      sourceEffectId: 'bonus-score-threshold',
      target: 'bonus-score',
      threshold: { kind: 'at-least', value: 10 },
      effects: [
        { kind: 'boost', multiplier: 1.2 },
        {
          kind: 'mental-barrier',
          barrier: 'endurance',
          enduranceType: 'fixed',
          endurance: 8,
          attenuation: 0,
          duration: { kind: 'stage' },
        },
      ],
    },
    source,
  );
  expect(armed.boosts.reduce((sum, item) => sum + item.percent, 0)).toBe(30);
  const withoutBonus = refreshEffectInducers({ ...armed, boosts: [] }, applyEffect);
  expect(withoutBonus.boosts).toHaveLength(0);
  expect(withoutBonus.mentalBarriers).toHaveLength(0);
  expect(withoutBonus.effectInducers[0]?.active).toBe(false);
});

it('耐久バリアがあるときだけ子効果を有効化する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const barrier = applyEffect(
    initial,
    {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 20,
      attenuation: 0,
      duration: { kind: 'stage' },
    },
    source,
  );
  const armed = applyEffect(
    barrier,
    {
      kind: 'effect-induce',
      sourceEffectId: 'barrier-presence',
      target: 'mental-barrier',
      threshold: { kind: 'none', value: 0 },
      effects: [{ kind: 'boost', multiplier: 1.2 }],
    },
    source,
  );
  expect(armed.boosts).toHaveLength(1);
  const withoutBarrier = refreshEffectInducers({ ...armed, mentalBarriers: [] }, applyEffect);
  expect(withoutBarrier.boosts).toHaveLength(0);
  expect(withoutBarrier.effectInducers[0]?.active).toBe(false);
});

it('Deactivator解除後は効果誘発監視を破棄し、条件を満たしても再発動しない', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const boosted = applyEffect(initial, { kind: 'boost', multiplier: 1.1 }, source);
  const armed = applyEffect(
    boosted,
    {
      kind: 'effect-induce',
      sourceEffectId: 'deactivator-release',
      deactivationKey: 'parent-skill',
      target: 'bonus-score',
      threshold: { kind: 'at-least', value: 10 },
      effects: [{ kind: 'boost', multiplier: 1.2 }],
    },
    source,
  );

  const released = deactivateInducedEffects(armed, 'parent-skill');
  const refreshed = refreshEffectInducers(released, applyEffect);

  expect(released.effectInducers).toHaveLength(0);
  expect(released.boosts).toHaveLength(1);
  expect(refreshed.boosts).toEqual(released.boosts);
});
