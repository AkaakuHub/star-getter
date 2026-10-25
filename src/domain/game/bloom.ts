import type { GameState } from './model';
import { voltageLevel } from './live/voltageLevel';
import { canActivateBloom } from './projection';
import {
  calculateStarGatherInitialGenesisGauge,
  calculateStarGatherGenesisGaugeDelta,
} from './live/genesisGauge';

const gaugeTypes = { energy: 1, stamina: 2, excitement: 3 } as const;

export function activateBloom(state: GameState, strength: number): GameState {
  if (!canActivateBloom(state)) return state;
  if (state.bloom)
    return {
      ...state,
      bloom: { ...state.bloom, strength: Math.max(state.bloom.strength, strength) },
    };
  return {
    ...state,
    bloom: {
      progress: BigInt(
        calculateStarGatherInitialGenesisGauge({
          currentAp: Math.floor(state.energy),
          currentMental: Math.floor(state.stamina),
          currentVoltageLevel: voltageLevel(state.excitement),
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
  const delta = calculateStarGatherGenesisGaugeDelta({
    actionType: 14,
    gaugeType: gaugeTypes[resource],
    effectValue: Number(amount),
    currentGenesisEffectValue: state.bloom.strength,
  });
  if (delta === null) return state;
  const progress = BigInt.asIntN(32, state.bloom.progress + BigInt(delta));
  return {
    ...state,
    bloom: {
      ...state.bloom,
      progress: progress < 0n ? 0n : progress,
    },
  };
}

export function finishBloom(state: GameState): GameState {
  if (!state.bloom) return state;
  return { ...state, ...state.bloom.rollback, bloom: null };
}
