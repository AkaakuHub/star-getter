import type { Card, Effect, GameState } from '../model';
import type { EffectInduceEffect } from '../induceSkillEffectTypes';
import type { EffectApplier } from './induceSkillEffect';
import { deactivateMentalBarriers } from '../live/mentalBarriers';
import { act } from '../actions';
const deactivationActions: readonly ((deactivationKey: string) => import('../model').Action)[] = [
  (deactivationKey) => ({ type: 'deactivate-token-deck', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-hand-limit', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-hand-max-card', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-ap-speed', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-voltage-convert', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-skill-boost', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mental-heart-induce', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-combo-induce', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-heart-limit', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-voltage-increase', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-additional-heart', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-love-up-additional-buff', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mental-recover-additional-buff', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mental-barrier-additional-buff', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mental-down', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-token-boost', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-infinity-gauge', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-skill-cooldown', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-induced-skill-effect', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-beat-heart-value-buff', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mood-change-skill', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-heart-limit-boost', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-mood-value-boost', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-beat-point-buff', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-gauge-regeneration', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-search', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-heart-boost', deactivationKey }),
  (deactivationKey) => ({ type: 'deactivate-skill-cost-change', deactivationKey }),
];

export function activateEffectInduce(
  state: GameState,
  effect: EffectInduceEffect,
  card: Card | undefined,
): GameState {
  if (!card) throw new Error('効果誘発の発動元カードがありません。');
  const sourceEffectId = `${card.id}:${effect.sourceEffectId}`;
  if (state.effectInducers.some((inducer) => inducer.sourceEffectId === sourceEffectId))
    return state;
  return {
    ...state,
    effectInducers: [
      ...state.effectInducers,
      {
        sourceCardId: card.id,
        sourceEffectId,
        target: effect.target,
        threshold: effect.threshold,
        effects: effect.effects,
        active: false,
      },
    ],
  };
}

export function refreshEffectInducers(state: GameState, apply: EffectApplier): GameState {
  let next = state;
  for (const sourceEffectId of state.effectInducers.map((inducer) => inducer.sourceEffectId)) {
    const inducer = next.effectInducers.find((item) => item.sourceEffectId === sourceEffectId);
    if (!inducer) continue;
    const active = isEffectInducerActive(next, inducer);
    if (active === inducer.active) continue;
    const deactivationKey = `effect-induce:${inducer.sourceEffectId}`;
    next = {
      ...next,
      effectInducers: next.effectInducers.map((item) =>
        item.sourceEffectId === sourceEffectId ? { ...item, active } : item,
      ),
    };
    if (!active) {
      for (const createAction of deactivationActions)
        next = act(next, createAction(deactivationKey));
      next = {
        ...next,
        boosts: next.boosts.filter((boost) => boost.deactivationKey !== deactivationKey),
      };
      next = deactivateMentalBarriers(next, deactivationKey);
      continue;
    }
    const card = next.cardPool.find((item) => item.id === inducer.sourceCardId);
    if (!card) throw new Error('効果誘発の発動元カードがありません。');
    for (const effect of inducer.effects)
      next = apply(next, withDeactivationKey(effect, deactivationKey), card);
  }
  return next;
}

function isEffectInducerActive(
  state: GameState,
  inducer: GameState['effectInducers'][number],
): boolean {
  let value: number;
  if (inducer.target === 'mental-barrier') {
    const barriers = state.mentalBarriers.filter((item) => item.kind === 'endurance');
    if (!barriers.length) return false;
    const unlimited = barriers.some(
      (barrier) => barrier.endurance <= 0 || barrier.currentEndurance >= barrier.endurance,
    );
    value = unlimited
      ? -1
      : barriers.reduce(
          (sum, barrier) =>
            Math.fround(sum + Math.fround(barrier.endurance - barrier.currentEndurance)),
          0,
        );
    if (value < 0) return inducer.threshold.kind !== 'at-most';
  } else {
    const boosts = state.boosts.filter((boost) => boost.untilTick > state.tick);
    const temporaryBoosts = state.temporaryScoreBoosts;
    if (!boosts.length && !temporaryBoosts.length) return false;
    value = [...boosts, ...temporaryBoosts].reduce((sum, boost) => sum + boost.percent, 0);
  }
  switch (inducer.threshold.kind) {
    case 'none':
      return true;
    case 'at-least':
      return inducer.threshold.value <= value;
    case 'at-most':
      return value <= inducer.threshold.value;
  }
}

function withDeactivationKey(effect: Effect, deactivationKey: string): Effect {
  if ('deactivationKey' in effect) return { ...effect, deactivationKey };
  switch (effect.kind) {
    case 'boost':
    case 'mental-barrier':
      return { ...effect, deactivationKey };
    default:
      return effect;
  }
}
