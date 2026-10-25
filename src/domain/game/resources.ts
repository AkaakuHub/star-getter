import type { GameState } from './model';
import { voltageLevel, voltageThreshold } from './live/voltageLevel';
import { changeBloomResource } from './bloom';
import { breakMentalShields } from './effects/mentalShield';
import { absorbNaturalMentalDecrease, absorbSkillMentalDamage } from './live/mentalBarriers';
import type { Card } from './model';
import { convertVoltageIncrease } from './effects/voltageConversion';
import { induceMentalHearts } from './effects/mentalHeartInduce';
import { induceSkillEffects, type EffectApplier } from './effects/induceSkillEffect';
import { absorbSkillEffect } from './effects/proxySkill';
import { registerVoltageZeroMission } from './ingameMissions';
import { notifyHandVoltageIncrease } from './cards/handInduce';

export function changeResource(
  state: GameState,
  resource: 'energy' | 'stamina' | 'excitement',
  amount: bigint,
  source: 'skill' | 'natural' = 'skill',
  card?: Card,
  applyEffect?: EffectApplier,
  induceVoltageUp = false,
): GameState {
  if (resource === 'excitement') amount = BigInt.asIntN(32, amount);
  if (resource === 'energy' && amount >= 0n) {
    const absorption = absorbSkillEffect(state, 14, BigInt.asIntN(32, amount));
    if (absorption.absorbed) return absorption.state;
  }
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
  if (resource === 'excitement' && amount > 0n) {
    const mastery = addMasteryVoltage(state, Math.fround(Number(amount)));
    state = mastery.state;
    if (mastery.gain > 0) {
      const gained = BigInt(mastery.gain);
      const conversion = convertVoltageIncrease(state, gained, undefined, applyEffect);
      state = conversion.state;
      if (!conversion.converted) amount += gained;
    }
  }
  if (
    state.gaugeInfinities.some(
      (infinity) => infinity.gauge === resourceToGauge(resource) && !infinity.suspended,
    ) &&
    !(resource === 'stamina' && (state.resting || amount < 0n))
  ) {
    if (!applyEffect || amount < 0n) return state;
    if (resource === 'stamina' && source === 'skill')
      return induceSkillEffects(state, 'mental-recover', Number(amount), applyEffect);
    if (resource === 'excitement' && (amount > 0n || induceVoltageUp))
      return induceSkillEffects(state, 'voltage', Number(amount), applyEffect);
    return state;
  }
  if (resource === 'stamina' && amount < 0n && source === 'skill' && !state.bloom) {
    const absorbed = absorbSkillMentalDamage(state, amount);
    state = absorbed.state;
    amount = absorbed.amount;
    if (amount === 0n) return state;
  }
  if (resource === 'stamina' && amount < 0n) {
    const shielded = breakMentalShields(state, Number(-amount));
    state = shielded.state;
    amount = -BigInt(Math.trunc(shielded.remainingDamage));
    if (amount === 0n) return state;
    if (
      state.gaugeInfinities.some(
        (infinity) => infinity.gauge === 'mental' && !infinity.suspended,
      ) &&
      !state.resting
    )
      return state.bloom ? changeBloomResource(state, 'stamina', amount) : state;
  }
  if (state.bloom) {
    const changed = changeBloomResource(state, resource, amount);
    const withHandInduce =
      resource === 'excitement'
        ? notifyVoltageBaseLevelChange(state, changed, applyEffect)
        : changed;
    const withMissionEvent =
      resource === 'excitement' && state.excitement > 0 && withHandInduce.excitement === 0
        ? registerVoltageZeroMission(withHandInduce)
        : withHandInduce;
    return resource === 'excitement' && (amount > 0n || induceVoltageUp) && applyEffect
      ? induceSkillEffects(withMissionEvent, 'voltage', Number(amount), applyEffect)
      : withMissionEvent;
  }
  const maximum =
    resource === 'energy'
      ? state.maxEnergy
      : resource === 'excitement'
        ? voltageThreshold(state.maximumVoltageLevel)
        : state.maximumMental;
  const nextValue = Math.max(0, Math.min(maximum, state[resource] + Number(amount)));
  let next: GameState = { ...state, [resource]: nextValue };
  if (resource === 'excitement') next = notifyVoltageBaseLevelChange(state, next, applyEffect);
  if (resource === 'excitement' && state.excitement > 0 && nextValue === 0)
    next = registerVoltageZeroMission(next);
  if (resource === 'stamina' && nextValue !== state.stamina)
    next = induceMentalHearts(next, Math.trunc(nextValue));
  if (!applyEffect) return next;
  if (resource === 'stamina' && source === 'skill' && amount >= 0n)
    return induceSkillEffects(next, 'mental-recover', Number(amount), applyEffect);
  if (resource === 'excitement' && (amount > 0n || induceVoltageUp))
    return induceSkillEffects(next, 'voltage', Number(amount), applyEffect);
  return next;
}

export function setVoltageValue(
  state: GameState,
  amount: number,
  _applyEffect?: EffectApplier,
): GameState {
  const target = Math.max(0, Math.trunc(Math.fround(amount)));
  const delta = Math.trunc(Math.fround(target - state.excitement));
  if (state.bloom) {
    return changeBloomResource(state, 'excitement', BigInt(delta));
  }
  if (state.gaugeInfinities.some((infinity) => infinity.gauge === 'voltage' && !infinity.suspended))
    return state;
  const next = notifyVoltageBaseLevelChange(state, { ...state, excitement: target }, _applyEffect);
  return state.excitement > 0 && target === 0 ? registerVoltageZeroMission(next) : next;
}

export function addMasteryVoltage(
  state: GameState,
  voltageUp: number,
): Readonly<{ state: GameState; gain: number }> {
  const bonus = state.track.masteryVoltageBonus;
  if (voltageUp <= 0 || bonus.demand <= 0) return { state, gain: 0 };
  const progress = Math.fround(state.masteryVoltageProgress + Math.fround(voltageUp));
  if (progress >= bonus.demand)
    return { state: { ...state, masteryVoltageProgress: 0 }, gain: Math.trunc(bonus.gain) };
  return { state: { ...state, masteryVoltageProgress: progress }, gain: 0 };
}

export function notifyVoltageBaseLevelChange(
  previous: GameState,
  current: GameState,
  applyEffect?: EffectApplier,
): GameState {
  if (!applyEffect || previous.excitement === current.excitement) return current;
  return notifyHandVoltageIncrease(
    current,
    voltageLevel(previous.excitement, previous.maximumVoltageLevel),
    voltageLevel(current.excitement, current.maximumVoltageLevel),
    applyEffect,
  );
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
      next = induceMentalHearts(
        { ...next, stamina: next.maximumMental, mentalTimerSeconds: 0 },
        next.maximumMental,
      );
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
      next = induceMentalHearts(
        { ...next, stamina: next.maximumMental, mentalTimerSeconds: 0 },
        next.maximumMental,
      );
    if (gauge === 'voltage')
      next = { ...next, excitement: voltageThreshold(Math.min(10, next.maximumVoltageLevel)) };
  }
  return next;
}
