import type { GameState } from './model';
import { voltageThreshold } from './live/voltageLevel';
import { changeBloomResource } from './bloom';
import { absorbNaturalMentalDecrease, absorbSkillMentalDamage } from './live/mentalBarriers';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
  source: 'skill' | 'natural' = 'skill',
): GameState {
  if (
    state.gaugeInfinities.some((infinity) => infinity.gauge === resourceToGauge(resource)) &&
    !(resource === 'stamina' && state.resting)
  )
    return state;
  if (resource === 'stamina' && amount < 0n && source === 'skill') {
    const absorbed = absorbSkillMentalDamage(state, amount);
    state = absorbed.state;
    amount = absorbed.amount;
    if (amount === 0n) return state;
  }
  if (resource === 'stamina' && amount < 0n && source === 'skill') {
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

export function decreaseMentalNaturally(state: GameState): GameState {
  const barrier = absorbNaturalMentalDecrease(state);
  if (barrier.absorbed) return barrier.state;
  return changeResource(state, 'stamina', -1n, 'natural');
}

function resourceToGauge(
  resource: 'energy' | 'stamina' | 'excitement',
): 'ap' | 'mental' | 'voltage' {
  switch (resource) {
    case 'energy':
      return 'ap';
    case 'stamina':
      return 'mental';
    case 'excitement':
      return 'voltage';
  }
}

export function spendEnergy(state: GameState, amount: number): GameState {
  return changeResource(
    state.energy >= state.maxEnergy ? { ...state, apTimerSeconds: 0 } : state,
    'energy',
    -BigInt(amount),
  );
}

export function expireGaugeInfinities(
  state: GameState,
  duration: 'milliseconds' | 'sections',
  elapsed: number,
): GameState {
  const before = state.gaugeInfinities;
  const ended = new Set<'ap' | 'voltage' | 'mental'>();
  const active = before.flatMap((infinity) => {
    const remaining =
      duration === 'milliseconds'
        ? infinity.remainingSeconds === null
          ? null
          : Math.fround(infinity.remainingSeconds - Math.fround(elapsed))
        : infinity.remainingSections === null
          ? null
          : infinity.remainingSections - elapsed;
    if (remaining !== null && remaining <= 0) {
      ended.add(infinity.gauge);
      return [];
    }
    if (duration === 'milliseconds' && remaining !== null)
      return [{ ...infinity, remainingSeconds: remaining }];
    if (duration === 'sections' && remaining !== null)
      return [{ ...infinity, remainingSections: remaining }];
    return [infinity];
  });
  let next = { ...state, gaugeInfinities: active };
  for (const gauge of ended) {
    if (active.some((infinity) => infinity.gauge === gauge)) continue;
    if (gauge === 'mental') next = { ...next, stamina: 100, mentalTimerSeconds: 0 };
    if (gauge === 'voltage') {
      next = {
        ...next,
        excitement: voltageThreshold(Math.min(10, next.maximumVoltageLevel)),
      };
    }
  }
  return next;
}
