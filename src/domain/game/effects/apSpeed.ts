import type { Card, Effect, GameState } from '../model';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { moodValue } from '../projection';
import { skillValue } from './skillValue';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { isProxyTargetReached } from './proxySkill';

type ApSpeedChange = Extract<Effect, { kind: 'ap-speed-change' }>;

export function apIncreaseIntervalSeconds(state: GameState): number {
  const originalBase = Math.fround(state.track.stage.apIncreaseIntervalSeconds);
  let value = originalBase;
  const additions = state.apTimeEffects.filter((effect) => effect.calculation === 'add');
  for (const effect of additions) value = Math.fround(value + Math.fround(effect.value));
  const multipliers = state.apTimeEffects.filter((effect) => effect.calculation === 'multiply');
  if (multipliers.length > 0) {
    const sum = multipliers.reduce(
      (total, effect) => Math.fround(total + Math.fround(effect.value - 1)),
      0,
    );
    value = Math.fround(value * Math.fround(Math.max(-1, sum) + 1));
  }
  const bounded = Math.fround(Math.max(originalBase * 0.1, value));
  return Math.fround(Math.ceil(Math.fround(bounded * 10)) / 10);
}

export function applyApSpeedChange(
  state: GameState,
  effect: ApSpeedChange,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const correction =
    effect.bonusMoodTarget === 0
      ? 0
      : calculateSkillMoodCorrection(
          effect.bonusMoodTarget,
          moodValue(state),
          Math.fround(effect.bonusMoodValue / 10_000),
        );
  let calculation: 'add' | 'multiply';
  let value: number;
  let absorbedAmount: number;
  let currentState = state;
  let rate = Math.fround(
    Math.fround(multiplier) *
      Math.fround(
        Math.fround(Math.fround(addValue * 100) + (10_000 - Math.trunc(effect.num))) -
          Math.fround(correction * 10_000),
      ),
  );
  if (rate > 0 && card) {
    if (effect.calculationType === 2) {
      const legacyBoosted = skillValue(currentState, rate, { kind: 'energy', amount: rate }, card);
      const boosted = applyAction52SkillBoostForCard(currentState, card, legacyBoosted);
      currentState = boosted.state;
      rate = Math.trunc(boosted.value);
    } else {
      currentState = applyAction52SkillBoostForCard(currentState, card, rate).state;
    }
  }
  if (effect.calculationType === 2) {
    value = Math.fround(1 - Math.fround(rate / 10_000));
    absorbedAmount = Math.trunc((1 - value) * 100);
    calculation = 'multiply';
  } else {
    value = Math.fround(Math.fround(correction + effect.num + addValue) * multiplier);
    const currentInterval = apIncreaseIntervalSeconds(state);
    absorbedAmount = Math.trunc((-value / currentInterval) * 100);
    calculation = 'add';
  }
  if ((calculation === 'multiply' && value === 1) || (calculation === 'add' && value === 0))
    return state;
  const absorption = absorbedAmount > 0 ? absorbApSpeed(currentState, absorbedAmount) : null;
  if (absorption?.absorbed) return { ...currentState, proxyAbsorptions: absorption.absorptions };
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  const entry: GameState['apTimeEffects'][number] = {
    calculation,
    value,
    remainingSeconds:
      suppressDuration || effect.duration.kind !== 'milliseconds'
        ? null
        : Math.fround(effect.duration.value / 1000),
    remainingSections:
      suppressDuration || effect.duration.kind !== 'sections' ? null : effect.duration.value,
    deactivationKey: effect.deactivationKey ?? null,
  };
  return updateApTimeEffects(
    currentState,
    [...currentState.apTimeEffects, entry],
    absorption?.absorptions,
  );
}

export function applyApSpeedPercent(
  state: GameState,
  percent: number,
  duration: 'stage' | 'section',
): GameState {
  const entry: GameState['apTimeEffects'][number] = {
    calculation: 'multiply',
    value: Math.fround(1 - Math.fround(percent / 100)),
    remainingSeconds: null,
    remainingSections: duration === 'section' ? 1 : null,
    deactivationKey: null,
  };
  return updateApTimeEffects(state, [...state.apTimeEffects, entry]);
}

export function advanceApSpeedEffects(state: GameState, elapsedSeconds: number): GameState {
  const effects = state.apTimeEffects.flatMap((effect) => {
    if (effect.remainingSeconds === null) return [effect];
    const remainingSeconds = Math.fround(effect.remainingSeconds - Math.fround(elapsedSeconds));
    return remainingSeconds > 0 ? [{ ...effect, remainingSeconds }] : [];
  });
  return updateApTimeEffects(state, effects);
}

export function expireApSpeedSections(state: GameState): GameState {
  const effects = state.apTimeEffects.flatMap((effect) => {
    if (effect.remainingSections === null) return [effect];
    const remainingSections = effect.remainingSections - 1;
    return remainingSections > 0 ? [{ ...effect, remainingSections }] : [];
  });
  return updateApTimeEffects(state, effects);
}

export function deactivateApSpeedEffects(state: GameState, deactivationKey: string): GameState {
  return updateApTimeEffects(
    state,
    state.apTimeEffects.filter((effect) => effect.deactivationKey !== deactivationKey),
  );
}

function updateApTimeEffects(
  state: GameState,
  apTimeEffects: GameState['apTimeEffects'],
  proxyAbsorptions: GameState['proxyAbsorptions'] = state.proxyAbsorptions,
): GameState {
  if (apTimeEffects === state.apTimeEffects && proxyAbsorptions === state.proxyAbsorptions)
    return state;
  const before = apIncreaseIntervalSeconds(state);
  const candidate = { ...state, apTimeEffects, proxyAbsorptions };
  const after = apIncreaseIntervalSeconds(candidate);
  return {
    ...candidate,
    apTimerSeconds:
      before > 0 && after > 0
        ? Math.fround(Math.fround(after / before) * state.apTimerSeconds)
        : state.apTimerSeconds,
  };
}

function absorbApSpeed(
  state: GameState,
  amount: number,
): Readonly<{ absorptions: GameState['proxyAbsorptions']; absorbed: boolean }> | null {
  for (
    let absorptionIndex = 0;
    absorptionIndex < state.proxyAbsorptions.length;
    absorptionIndex++
  ) {
    const absorption = state.proxyAbsorptions[absorptionIndex];
    if (!absorption) continue;
    for (let effectIndex = 0; effectIndex < absorption.effects.length; effectIndex++) {
      const target = absorption.effects[effectIndex];
      if (!target || target.actionType !== 21) continue;
      if (absorption.hasAbsorbLimit && isProxyTargetReached(absorption, target))
        return { absorptions: state.proxyAbsorptions, absorbed: true };
      const effects = absorption.effects.map((item, index) =>
        index === effectIndex ? { ...item, totalAmount: item.totalAmount + BigInt(amount) } : item,
      );
      const absorptions = state.proxyAbsorptions.map((item, index) =>
        index === absorptionIndex ? { ...item, effects } : item,
      );
      return { absorptions, absorbed: true };
    }
  }
  return null;
}
