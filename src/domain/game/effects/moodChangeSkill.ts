import { calculateSkillMoodCorrection } from '../live/skillMood';
import type { Card, Effect, GameState } from '../model';
import { moodValue, moodValueWithoutLimit } from '../projection';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { absorbSkillEffect } from './proxySkill';

type MoodChangeSkillEffect = Extract<Effect, { kind: 'mood-change-skill' }>;

export function activateMoodChangeSkill(
  state: GameState,
  effect: MoodChangeSkillEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
): GameState {
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const currentMood = moodValueWithoutLimit(state);
  const num = Math.fround(effect.num / 10_000);
  const bonusMood = effect.bonusMood
    ? calculateSkillMoodCorrection(
        effect.bonusMood.target,
        moodValue(state),
        Math.fround(effect.bonusMood.value / 10_000),
      )
    : 0;
  let value: number;
  let calculation: 'add' | 'fixed';
  let isPositive = true;
  switch (effect.calculationType) {
    case 1:
      value = multiplyFloat32(Math.fround(bonusMood + num + addValue), multiplier, effectPower);
      calculation = 'add';
      break;
    case 2:
      value = multiplyFloat32(
        effectPower,
        multiplier,
        Math.fround(addValue + Math.fround(Math.fround(num * currentMood) - currentMood)),
      );
      isPositive = num >= 1;
      calculation = 'add';
      break;
    case 3:
      value = num;
      calculation = 'fixed';
      break;
    case 4:
      if (currentMood === 0) return state;
      value = multiplyFloat32(Math.fround(bonusMood + num + addValue), multiplier, effectPower);
      if (currentMood < 0) value = Math.fround(-value);
      calculation = 'add';
      break;
  }
  const boosted = applyAction52SkillBoostForCard(state, card, Math.abs(value));
  const intMagnitude = toSignedInt32(boosted.value);
  const intValue = value < 0 ? toSignedInt32(-intMagnitude) : intMagnitude;
  const candidate = {
    ...boosted.state,
    moodSkillBuffs: [
      ...boosted.state.moodSkillBuffs,
      {
        calculation,
        value: intValue,
        remainingSeconds:
          effect.invocationType === 0x388 ||
          effect.invocationType === 0x38b ||
          effect.duration.kind !== 'milliseconds'
            ? null
            : Math.fround(effect.duration.value / 1000),
        remainingSections:
          effect.invocationType === 0x388 ||
          effect.invocationType === 0x38b ||
          effect.duration.kind !== 'sections'
            ? null
            : effect.duration.value,
        deactivationKey: effect.deactivationKey ?? null,
      },
    ],
  } satisfies GameState;
  if (isPositive) {
    const delta = moodValueWithoutLimit(candidate) - currentMood;
    const absorption = absorbSkillEffect(boosted.state, 48, BigInt(delta));
    if (absorption.absorbed) return absorption.state;
  }
  return candidate;
}

export function advanceMoodChangeSkills(state: GameState, elapsedSeconds: number): GameState {
  return {
    ...state,
    moodSkillBuffs: state.moodSkillBuffs.flatMap((buff) => {
      if (buff.remainingSeconds === null) return [buff];
      const remainingSeconds = Math.fround(buff.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...buff, remainingSeconds }] : [];
    }),
  };
}

export function expireMoodChangeSkillSections(state: GameState): GameState {
  return {
    ...state,
    moodSkillBuffs: state.moodSkillBuffs.flatMap((buff) => {
      if (buff.remainingSections === null) return [buff];
      const remainingSections = buff.remainingSections - 1;
      return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
    }),
  };
}

export function deactivateMoodChangeSkills(state: GameState, deactivationKey: string): GameState {
  return {
    ...state,
    moodSkillBuffs: state.moodSkillBuffs.filter((buff) => buff.deactivationKey !== deactivationKey),
  };
}

function multiplyFloat32(first: number, second: number, third: number): number {
  return Math.fround(Math.fround(first * Math.fround(second)) * Math.fround(third));
}

function toSignedInt32(value: number): number {
  if (!Number.isFinite(value)) return -2_147_483_648;
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}
