import { calculateSkillMoodCorrection } from '../live/skillMood';
import { moodValue } from '../projection';
import { applyAction52SkillBoost } from './action52SkillBoost';
import type { Card, GameState } from '../model';
import type {
  LoveUpAdditionalBuffEffect,
  LoveUpAdditionalBuffTarget,
} from '../loveUpAdditionalBuffTypes';

export function activateLoveUpAdditionalBuff(
  state: GameState,
  effect: LoveUpAdditionalBuffEffect,
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
  const base = Math.fround(
    Math.fround(Math.fround(correction + Math.fround(effect.num / 10_000)) + addValue) * multiplier,
  );
  const value = toInt32(base);
  if (value <= 0) return state;
  if (!source) throw new Error('STAR追加バフの発動元カードがありません。');
  const boosted = applyAction52SkillBoost(state, source, value);
  const percent = toInt32(boosted.value);
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  const buff: GameState['loveUpAdditionalBuffs'][number] = {
    id: boosted.state.nextSkillAdditionalBuffId,
    percent,
    target: effect.target,
    remainingSeconds:
      suppressDuration || effect.duration.kind !== 'milliseconds'
        ? null
        : Math.fround(effect.duration.value / 1000),
    remainingSections:
      suppressDuration || effect.duration.kind !== 'sections' ? null : effect.duration.value,
    remainingUses: effect.disabledType === 1 ? effect.disabledCount : null,
    deactivationKey: effect.deactivationKey ?? null,
  };
  return {
    ...boosted.state,
    loveUpAdditionalBuffs: [...boosted.state.loveUpAdditionalBuffs, buff],
    nextSkillAdditionalBuffId: boosted.state.nextSkillAdditionalBuffId + 1,
  };
}

export function applyLoveUpAdditionalBuffs(
  state: GameState,
  card: Card | undefined,
  value: number,
): Readonly<{ state: GameState; value: number }> {
  if (!(value > 0) || !card) return { state, value };
  const matching = state.loveUpAdditionalBuffs.filter((buff) => matches(buff.target, card));
  if (matching.length === 0) return { state, value };
  const percent = Math.max(
    -100,
    matching.reduce((sum, buff) => Math.fround(sum + Math.fround(buff.percent)), 0),
  );
  const consumedIds = new Set(
    matching.filter((buff) => buff.remainingUses !== null).map((buff) => buff.id),
  );
  return {
    value: Math.fround((percent * value) / 100 + value),
    state: {
      ...state,
      loveUpAdditionalBuffs: state.loveUpAdditionalBuffs.flatMap((buff) => {
        if (!consumedIds.has(buff.id) || buff.remainingUses === null) return [buff];
        const remainingUses = buff.remainingUses - 1;
        return remainingUses < 1 ? [] : [{ ...buff, remainingUses }];
      }),
    },
  };
}

export function advanceLoveUpAdditionalBuffs(state: GameState, elapsedSeconds: number): GameState {
  return {
    ...state,
    loveUpAdditionalBuffs: state.loveUpAdditionalBuffs.flatMap((buff) => {
      if (buff.remainingSeconds === null) return [buff];
      const remainingSeconds = Math.fround(buff.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...buff, remainingSeconds }] : [];
    }),
  };
}

export function expireLoveUpAdditionalBuffSections(state: GameState): GameState {
  return {
    ...state,
    loveUpAdditionalBuffs: state.loveUpAdditionalBuffs.flatMap((buff) => {
      if (buff.remainingSections === null) return [buff];
      const remainingSections = buff.remainingSections - 1;
      return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
    }),
  };
}

export function deactivateLoveUpAdditionalBuffs(
  state: GameState,
  deactivationKey: string,
): GameState {
  return {
    ...state,
    loveUpAdditionalBuffs: state.loveUpAdditionalBuffs.filter(
      (buff) => buff.deactivationKey !== deactivationKey,
    ),
  };
}

function matches(target: LoveUpAdditionalBuffTarget, card: Card): boolean {
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
