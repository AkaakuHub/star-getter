import type { GameState } from './model';
import { limitValue } from './scoring';
import { canActivateBloom } from './projection';
import {
  calculateLoveGatherInitialGenesisGauge,
  calculateLoveGatherGenesisGaugeDelta,
} from './live/genesisGauge';

const gaugeTypes = { energy: 1, stamina: 2, excitement: 3 } as const;

export function activateBloom(state: GameState, strength: bigint): GameState {
  if (!canActivateBloom(state)) return state;
  if (state.bloom) return { ...state, bloom: { ...state.bloom, strength } };
  return {
    ...state,
    bloom: {
      progress: BigInt(
        calculateLoveGatherInitialGenesisGauge({
          currentAp: Math.floor(state.energy),
          currentMental: Math.floor(state.stamina),
          currentVoltageLevel: Math.floor(state.excitement / 2),
        }),
      ),
      strength,
      rollback: { energy: state.energy, stamina: state.stamina, excitement: state.excitement },
    },
  };
}

export function changeBloomResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
): GameState {
  if (!state.bloom) throw new Error('開花が発動していません。');
  const delta = calculateLoveGatherGenesisGaugeDelta({
    actionType: 14,
    gaugeType: gaugeTypes[resource],
    effectValue: Number(amount),
    currentGenesisEffectValue: Number(state.bloom.strength) / 100,
  });
  if (delta === null) return state;
  return {
    ...state,
    bloom: {
      ...state.bloom,
      progress: limitValue(state.bloom.progress + BigInt(delta)),
    },
  };
}

export function finishBloom(state: GameState): GameState {
  if (!state.bloom) return state;
  return { ...state, ...state.bloom.rollback, bloom: null };
}
