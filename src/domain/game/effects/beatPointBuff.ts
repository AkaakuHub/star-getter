import type { Card, GameState } from '../model';
import type { BeatPointBuffEffect } from '../beatPointBuffTypes';
import { moodValue } from '../projection';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { applyStarGatherSkillBoost } from '../live/skillBoost';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { skillBoostPercent } from './skillValue';

export function activateBeatPointBuff(
  state: GameState,
  effect: BeatPointBuffEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  const correction = effect.moodBonus
    ? calculateSkillMoodCorrection(
        effect.moodBonus.target,
        moodValue(state),
        effect.moodBonus.perPoint,
      )
    : 0;
  const numToValue = Math.fround(effect.amount / 10_000);
  const combined = Math.fround(
    Math.fround(Math.fround(correction + numToValue) + addValue) * multiplier,
  );
  const skillBoosted = applyStarGatherSkillBoost(
    Math.trunc(combined),
    skillBoostPercent(state, card),
  );
  const action52 =
    skillBoosted > 0
      ? applyAction52SkillBoostForCard(state, card, skillBoosted)
      : { state, value: skillBoosted };
  const suppressed = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  return {
    ...action52.state,
    beatPointBuffs: [
      ...action52.state.beatPointBuffs,
      {
        value: Math.trunc(action52.value),
        remainingSections:
          effect.duration.kind === 'sections' && !suppressed ? effect.duration.value : null,
        deactivationKey: effect.deactivationKey ?? null,
      },
    ],
  };
}

export function expireBeatPointBuffSections(state: GameState): GameState {
  return {
    ...state,
    beatPointBuffs: state.beatPointBuffs.flatMap((buff) => {
      if (buff.remainingSections === null) return [buff];
      const remainingSections = buff.remainingSections - 1;
      return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
    }),
  };
}

export function deactivateBeatPointBuffs(state: GameState, deactivationKey: string): GameState {
  return {
    ...state,
    beatPointBuffs: state.beatPointBuffs.filter((buff) => buff.deactivationKey !== deactivationKey),
  };
}
