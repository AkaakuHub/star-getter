import type { GameState } from './model';
import { integerSqrt, limitValue } from './scoring';

export function activateBloom(state: GameState, strength: bigint): GameState {
  if (state.bloom) return { ...state, bloom: { ...state.bloom, strength } };
  return {
    ...state,
    bloom: {
      progress: BigInt(
        Math.trunc(
          state.stamina / 4 + (Math.floor(state.excitement / 2) + Math.floor(state.energy)) * 5,
        ),
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
  const scale = { energy: 10_000n, stamina: 40_000n, excitement: 500_000n }[resource];
  const magnitude = amount < 0n ? -amount : amount;
  const delta = (integerSqrt(magnitude * scale) * state.bloom.strength) / 10_000n;
  return {
    ...state,
    bloom: {
      ...state.bloom,
      progress: limitValue(state.bloom.progress + (amount < 0n ? -delta : delta)),
    },
  };
}

export function finishBloom(state: GameState): GameState {
  if (!state.bloom) return state;
  return { ...state, ...state.bloom.rollback, bloom: null };
}
