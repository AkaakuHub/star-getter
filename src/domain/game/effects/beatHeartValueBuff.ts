import { calculateSkillMoodCorrection } from '../live/skillMood';
import type { Card, Effect, GameState } from '../model';
import { moodValue } from '../projection';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';

type BeatHeartValueBuffEffect = Extract<Effect, { kind: 'beat-heart-value-buff' }>;

export function activateBeatHeartValueBuff(
  state: GameState,
  effect: BeatHeartValueBuffEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  if (effect.duration?.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const correction = effect.moodBonus
    ? calculateSkillMoodCorrection(
        effect.moodBonus.target,
        moodValue(state),
        Math.fround(effect.moodBonus.perPoint / 10_000),
      )
    : 0;
  const num = Number(BigInt.asIntN(32, BigInt(Math.trunc(effect.amount))));
  const numValue = Math.fround(Math.fround(num) / Math.fround(10_000));
  let value = Math.fround(
    Math.fround(Math.fround(correction + numValue) + Math.fround(addValue)) *
      Math.fround(multiplier),
  );
  let next = state;
  if (value > 0) {
    const boosted = applyAction52SkillBoostForCard(state, card, value);
    next = boosted.state;
    value = Math.trunc(boosted.value);
  }
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  return {
    ...next,
    beatHeartValueBuffs: [
      ...next.beatHeartValueBuffs,
      {
        calculation: effect.calculation,
        value,
        remainingSeconds:
          suppressDuration || effect.duration?.kind !== 'milliseconds'
            ? null
            : Math.fround(effect.duration.value / 1000),
        remainingSections:
          suppressDuration || effect.duration?.kind !== 'sections' ? null : effect.duration.value,
        deactivationKey: effect.deactivationKey ?? null,
      },
    ],
  };
}

export function advanceBeatHeartValueBuffs(state: GameState, elapsedSeconds: number): GameState {
  return {
    ...state,
    beatHeartValueBuffs: state.beatHeartValueBuffs.flatMap((buff) => {
      if (buff.remainingSeconds === null) return [buff];
      const remainingSeconds = Math.fround(buff.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...buff, remainingSeconds }] : [];
    }),
  };
}

export function expireBeatHeartValueBuffSections(state: GameState): GameState {
  return {
    ...state,
    beatHeartValueBuffs: state.beatHeartValueBuffs.flatMap((buff) => {
      if (buff.remainingSections === null) return [buff];
      const remainingSections = buff.remainingSections - 1;
      return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
    }),
  };
}

export function deactivateBeatHeartValueBuffs(
  state: GameState,
  deactivationKey: string,
): GameState {
  return {
    ...state,
    beatHeartValueBuffs: state.beatHeartValueBuffs.filter(
      (buff) => buff.deactivationKey !== deactivationKey,
    ),
  };
}
