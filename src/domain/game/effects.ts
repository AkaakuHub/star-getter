import { activateBloom, changeBloomResource } from './bloom';
import { addHearts, collectHearts } from './hearts';
import { type Effect, type GameState, rules } from './model';
import { limitValue } from './scoring';
import { applyLoveGatherSkillBoost } from './live/skillBoost';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
): GameState {
  if (state.bloom) return changeBloomResource(state, resource, amount);
  const maximum = resource === 'energy' ? rules.maxEnergy : 100;
  return { ...state, [resource]: Math.max(0, Math.min(maximum, state[resource] + Number(amount))) };
}

export function applyEffect(state: GameState, effect: Effect): GameState {
  switch (effect.kind) {
    case 'hearts':
      return addHearts(state, Math.ceil(boosted(state, effect.amount)));
    case 'energy':
      return changeResource(state, 'energy', BigInt(Math.ceil(boosted(state, effect.amount))));
    case 'stamina':
    case 'excitement': {
      const matching = state.resourceBoosts.filter((boost) => boost.target === effect.kind);
      const percent = matching.reduce((sum, boost) => sum + boost.percent, 100n);
      const next = changeResource(
        state,
        effect.kind,
        (scaled(state, effect.amount) * percent) / 100n,
      );
      return {
        ...next,
        resourceBoosts: state.resourceBoosts.flatMap((boost) =>
          boost.target !== effect.kind
            ? [boost]
            : boost.uses > 1
              ? [{ ...boost, uses: boost.uses - 1 }]
              : [],
        ),
      };
    }
    case 'collect':
      return collectHearts(state);
    case 'boost':
      return {
        ...state,
        boosts: [
          ...state.boosts,
          {
            percent: scaled(state, Math.round((effect.multiplier - 1) * 100)),
            untilTick: state.tick + Math.round(effect.seconds * rules.ticksPerSecond),
          },
        ],
      };
    case 'amplify':
      return {
        ...state,
        amplification: limitValue(state.amplification + BigInt(effect.percent)),
      };
    case 'growth':
      return {
        ...state,
        growthMultiplier: limitValue(state.growthMultiplier * BigInt(effect.multiplier)),
      };
    case 'bloom':
      return activateBloom(state, scaled(state, effect.strength));
    case 'resource-boost': {
      const eligible =
        effect.condition === 'mental100' ? state.stamina >= 100 : state.excitement >= 40;
      return eligible
        ? {
            ...state,
            resourceBoosts: [
              ...state.resourceBoosts,
              { target: effect.target, percent: scaled(state, effect.percent), uses: effect.uses },
            ],
          }
        : state;
    }
  }
}

function scaled(state: GameState, value: number): bigint {
  return limitValue(BigInt(Math.trunc(boosted(state, value))));
}

function boosted(state: GameState, value: number): number {
  return applyLoveGatherSkillBoost(value, Number(state.amplification - 100n));
}
