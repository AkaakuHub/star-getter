import type { GameState } from './model';
import { voltageThreshold } from './live/voltageLevel';
import { changeBloomResource } from './bloom';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
): GameState {
  if (resource === 'stamina' && amount < 0n) {
    const blocked = Math.min(state.mentalShield, -Number(amount));
    state = { ...state, mentalShield: state.mentalShield - blocked };
    amount += BigInt(Math.trunc(blocked));
  }
  if (state.bloom) return changeBloomResource(state, resource, amount);
  const maximum =
    resource === 'energy'
      ? state.maxEnergy
      : resource === 'excitement'
        ? voltageThreshold(state.maximumVoltageLevel)
        : 100;
  return { ...state, [resource]: Math.max(0, Math.min(maximum, state[resource] + Number(amount))) };
}

export function spendEnergy(state: GameState, amount: number): GameState {
  return changeResource(
    state.energy >= state.maxEnergy ? { ...state, apTimerSeconds: 0 } : state,
    'energy',
    -BigInt(amount),
  );
}
