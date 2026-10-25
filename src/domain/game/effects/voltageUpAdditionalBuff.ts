import { calculateSkillMoodCorrection } from '../live/skillMood';
import { moodValue } from '../projection';
import { applyAction52SkillBoost } from './action52SkillBoost';
import type { Card, GameState } from '../model';
import type {
  VoltageUpAdditionalBuffEffect,
  VoltageUpAdditionalBuffTarget,
} from '../voltageUpAdditionalBuffTypes';

export function activateVoltageUpAdditionalBuff(
  state: GameState,
  effect: VoltageUpAdditionalBuffEffect,
  source: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  if (effect.calculation !== 1) return state;
  const correction = effect.moodBonus
    ? calculateSkillMoodCorrection(
        effect.moodBonus.target,
        moodValue(state),
        effect.moodBonus.perPoint,
      )
    : 0;
  const numValue = Math.fround(Math.fround(effect.num) / Math.fround(10_000));
  const base = Math.fround(
    roundToEven(
      Math.fround(
        Math.fround(Math.fround(correction + numValue) + Math.fround(addValue)) *
          Math.fround(multiplier),
      ),
    ),
  );
  const boosted =
    base > 0 && source ? applyAction52SkillBoost(state, source, base) : { state, value: base };
  const percent = base > 0 && source ? toInt32(boosted.value) : base;
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  const buff: GameState['voltageUpAdditionalBuffs'][number] = {
    id: boosted.state.nextSkillAdditionalBuffId,
    percent,
    target: effect.target,
    remainingSeconds:
      suppressDuration || effect.duration.kind !== 'milliseconds'
        ? null
        : Math.fround(effect.duration.value / 1000),
    remainingSections:
      suppressDuration || effect.duration.kind !== 'sections' ? null : effect.duration.value,
    deactivationKey: effect.deactivationKey ?? null,
  };
  return {
    ...boosted.state,
    voltageUpAdditionalBuffs: [...boosted.state.voltageUpAdditionalBuffs, buff],
    nextSkillAdditionalBuffId: boosted.state.nextSkillAdditionalBuffId + 1,
  };
}

export function matchingVoltageUpAdditionalBuffs(
  state: GameState,
  card: Card | undefined,
): readonly GameState['voltageUpAdditionalBuffs'][number][] {
  return card ? state.voltageUpAdditionalBuffs.filter((buff) => matches(buff.target, card)) : [];
}

export function advanceVoltageUpAdditionalBuffs(
  state: GameState,
  elapsedSeconds: number,
): GameState {
  return {
    ...state,
    voltageUpAdditionalBuffs: state.voltageUpAdditionalBuffs.flatMap((buff) => {
      if (buff.remainingSeconds === null) return [buff];
      const remainingSeconds = Math.fround(buff.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...buff, remainingSeconds }] : [];
    }),
  };
}

export function expireVoltageUpAdditionalBuffSections(state: GameState): GameState {
  return {
    ...state,
    voltageUpAdditionalBuffs: state.voltageUpAdditionalBuffs.flatMap((buff) => {
      if (buff.remainingSections === null) return [buff];
      const remainingSections = buff.remainingSections - 1;
      return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
    }),
  };
}

function roundToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

function matches(target: VoltageUpAdditionalBuffTarget, card: Card): boolean {
  switch (target.kind) {
    case 'all':
      return true;
    case 'member':
      return card.member === target.member;
    case 'unit':
      return card.unit === target.unit;
    case 'token-series':
      return card.tokenSeriesIds?.includes(target.seriesId) === true;
  }
}

function toInt32(value: number): number {
  return !Number.isFinite(value) || value < -2_147_483_648 || value > 2_147_483_647
    ? -2_147_483_648
    : Math.trunc(value);
}
