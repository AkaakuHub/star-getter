import type { GameState } from './model';
import { voltageThreshold } from './live/voltageLevel';
import { changeBloomResource } from './bloom';
import { absorbNaturalMentalDecrease, absorbSkillMentalDamage } from './live/mentalBarriers';
import type { Card } from './model';
import { convertVoltageIncrease } from './effects/voltageConversion';
import { induceMentalHearts } from './effects/mentalHeartInduce';
import { induceSkillEffects, type EffectApplier } from './effects/induceSkillEffect';
import { absorbSkillEffect } from './effects/proxySkill';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
  source: 'skill' | 'natural' = 'skill',
  card?: Card,
  applyEffect?: EffectApplier,
  induceVoltageUp = false,
): GameState {
  if (resource === 'excitement' && amount >= 0n) {
    const absorption = absorbSkillEffect(state, 10, BigInt.asIntN(32, amount));
    if (absorption.absorbed) return absorption.state;
  }
  if (resource === 'stamina' && amount >= 0n && source === 'skill') {
    const absorption = absorbSkillEffect(state, 5, BigInt.asUintN(32, amount));
    if (absorption.absorbed) return absorption.state;
  }
  if (resource === 'excitement' && source === 'skill') {
    const conversion = convertVoltageIncrease(state, amount, card, applyEffect);
    if (conversion.converted) return conversion.state;
    state = conversion.state;
  }
  if (
    state.gaugeInfinities.some(
      (infinity) => infinity.gauge === resourceToGauge(resource) && !infinity.suspended,
    ) &&
    !(resource === 'stamina' && state.resting)
  ) {
    if (!applyEffect || amount < 0n) return state;
    if (resource === 'stamina' && source === 'skill')
      return induceSkillEffects(state, 'mental-recover', Number(amount), applyEffect);
    if (resource === 'excitement' && (amount > 0n || induceVoltageUp))
      return induceSkillEffects(state, 'voltage', Number(amount), applyEffect);
    return state;
  }
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
  if (state.bloom) {
    const changed = changeBloomResource(state, resource, amount);
    return resource === 'excitement' && (amount > 0n || induceVoltageUp) && applyEffect
      ? induceSkillEffects(changed, 'voltage', Number(amount), applyEffect)
      : changed;
  }
  const maximum =
    resource === 'energy'
      ? state.maxEnergy
      : resource === 'excitement'
        ? voltageThreshold(state.maximumVoltageLevel)
        : 100;
  const nextValue = Math.max(0, Math.min(maximum, state[resource] + Number(amount)));
  let next = { ...state, [resource]: nextValue };
  if (resource === 'stamina' && nextValue !== state.stamina)
    next = induceMentalHearts(next, Math.trunc(nextValue));
  if (!applyEffect) return next;
  if (resource === 'stamina' && source === 'skill' && amount >= 0n)
    return induceSkillEffects(next, 'mental-recover', Number(amount), applyEffect);
  if (resource === 'excitement' && (amount > 0n || induceVoltageUp))
    return induceSkillEffects(next, 'voltage', Number(amount), applyEffect);
  return next;
}

export function setVoltageValue(state: GameState, amount: number): GameState {
  const target = Math.max(0, Math.trunc(Math.fround(amount)));
  const delta = Math.trunc(Math.fround(target - state.excitement));
  if (state.bloom) return changeBloomResource(state, 'excitement', BigInt(delta));
  if (state.gaugeInfinities.some((infinity) => infinity.gauge === 'voltage' && !infinity.suspended))
    return state;
  return {
    ...state,
    excitement: target,
  };
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
  let next: GameState = { ...state, gaugeInfinities: active };
  for (const gauge of ended) {
    if (active.some((infinity) => infinity.gauge === gauge)) continue;
    if (gauge === 'mental')
      next = induceMentalHearts({ ...next, stamina: 100, mentalTimerSeconds: 0 }, 100);
    if (gauge === 'voltage') {
      next = {
        ...next,
        excitement: voltageThreshold(Math.min(10, next.maximumVoltageLevel)),
      };
    }
  }
  return next;
}

export function deactivateGaugeInfinities(state: GameState, deactivationKey: string): GameState {
  const removed = state.gaugeInfinities.filter(
    (infinity) => infinity.deactivationKey === deactivationKey,
  );
  const active = state.gaugeInfinities.filter(
    (infinity) => infinity.deactivationKey !== deactivationKey,
  );
  let next: GameState = { ...state, gaugeInfinities: active };
  for (const gauge of new Set(removed.map((infinity) => infinity.gauge))) {
    if (active.some((infinity) => infinity.gauge === gauge)) continue;
    if (gauge === 'mental')
      next = induceMentalHearts({ ...next, stamina: 100, mentalTimerSeconds: 0 }, 100);
    if (gauge === 'voltage')
      next = { ...next, excitement: voltageThreshold(Math.min(10, next.maximumVoltageLevel)) };
  }
  return next;
}
