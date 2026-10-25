import { calculateSkillMoodCorrection } from '../live/skillMood';
import { changeStarGatherHeartLimit } from '../live/heartLimit';
import { moodValue } from '../projection';
import { absorbSkillEffect } from './proxySkill';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import type { Card, Effect, GameState } from '../model';

type HeartLimitChangeEffect = Extract<Effect, { kind: 'heart-limit-change' }>;
type HeartLimitBuff = GameState['heartLimitBuffs'][number];

const heartLimitMaximum = 10_000_000;
const minimumInt32 = -2_147_483_648;

export function applyHeartLimit(state: GameState, amount: number): GameState {
  const base = state.heartLimitBuffs.length === 0 ? state.hearts.heartLimit : state.heartLimitBase;
  return materializeHeartLimit(state, base + Math.ceil(amount), state.heartLimitBuffs);
}

export function applyHeartLimitEffect(
  state: GameState,
  amount: number,
  card: Card | undefined,
  effectPower: number,
): GameState {
  const base = Math.fround(amount * effectPower);
  const boosted = applyAction52SkillBoostForCard(state, card, base);
  return applyHeartLimit(boosted.state, Math.trunc(boosted.value));
}

export function activateHeartLimitChange(
  state: GameState,
  effect: HeartLimitChangeEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
): GameState {
  if (!card) return state;
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');

  const moodBonus =
    effect.bonusMoodTarget === 0
      ? 0
      : calculateSkillMoodCorrection(
          effect.bonusMoodTarget,
          moodValue(state),
          effect.bonusMoodValue,
        );
  const num = Math.fround(Math.fround(effect.num) / 10_000);
  const baseLimit =
    state.heartLimitBuffs.length === 0 ? state.hearts.heartLimit : state.heartLimitBase;
  const oldLimitWithoutLimit = Math.trunc(
    calculateHeartLimitWithoutLimit(baseLimit, state.heartLimitBuffs),
  );
  const oldLimit = Math.max(0, oldLimitWithoutLimit);
  const correction = Math.fround(moodBonus + num);
  const calculated =
    effect.calculationType === 1
      ? Math.fround(Math.fround(correction + addValue) * multiplier)
      : Math.fround(
          Math.fround(
            Math.fround(addValue + Math.fround(correction * Math.fround(oldLimit))) - oldLimit,
          ) * multiplier,
        );
  const powered = Math.fround(calculated * effectPower);
  const boosted = applyAction52SkillBoostForCard(state, card, powered);
  const buffValue = powered > 0 ? Math.trunc(boosted.value) : minimumInt32;
  const buff: HeartLimitBuff = {
    id: state.nextHeartLimitBuffId,
    calculation: effect.calculationType === 1 ? 'add' : 'multiply',
    value: buffValue,
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
  };
  const buffs = [...state.heartLimitBuffs, buff];
  const nextLimit = Math.trunc(calculateHeartLimitWithoutLimit(baseLimit, buffs));
  const delta = nextLimit - oldLimitWithoutLimit;
  const absorb = effect.calculationType === 1 || correction >= 1;
  if (absorb && delta > -1) {
    const absorbed = absorbSkillEffect(boosted.state, 25, BigInt(delta));
    if (absorbed.absorbed) return absorbed.state;
  }
  return materializeHeartLimit(
    {
      ...boosted.state,
      nextHeartLimitBuffId: state.nextHeartLimitBuffId + 1,
    },
    baseLimit,
    buffs,
  );
}

export function advanceHeartLimitBuffs(state: GameState, elapsedSeconds: number): GameState {
  const heartLimitBuffs = state.heartLimitBuffs.flatMap((buff) => {
    if (buff.remainingSeconds === null) return [buff];
    const remainingSeconds = Math.fround(buff.remainingSeconds - Math.fround(elapsedSeconds));
    return remainingSeconds > 0 ? [{ ...buff, remainingSeconds }] : [];
  });
  return heartLimitBuffs.length === state.heartLimitBuffs.length
    ? state
    : materializeHeartLimit(state, state.heartLimitBase, heartLimitBuffs);
}

export function expireHeartLimitBuffSections(state: GameState): GameState {
  const heartLimitBuffs = state.heartLimitBuffs.flatMap((buff) => {
    if (buff.remainingSections === null) return [buff];
    const remainingSections = buff.remainingSections - 1;
    return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
  });
  return heartLimitBuffs.length === state.heartLimitBuffs.length
    ? state
    : materializeHeartLimit(state, state.heartLimitBase, heartLimitBuffs);
}

export function deactivateHeartLimitBuffs(state: GameState, deactivationKey: string): GameState {
  const heartLimitBuffs = state.heartLimitBuffs.filter(
    (buff) => buff.deactivationKey !== deactivationKey,
  );
  return heartLimitBuffs.length === state.heartLimitBuffs.length
    ? state
    : materializeHeartLimit(state, state.heartLimitBase, heartLimitBuffs);
}

function calculateHeartLimitWithoutLimit(base: number, buffs: readonly HeartLimitBuff[]): number {
  let value = base;
  for (const buff of buffs) {
    if (buff.calculation === 'add') value += buff.value;
  }
  const multipliers = buffs.filter((buff) => buff.calculation === 'multiply');
  if (multipliers.length === 0) return value;
  const sum = multipliers.reduce(
    (total, buff) => Math.fround(total + Math.fround(buff.value - 1)),
    0,
  );
  return Math.fround(Math.max(sum, -1) + 1) * value;
}

function materializeHeartLimit(
  state: GameState,
  base: number,
  heartLimitBuffs: readonly HeartLimitBuff[],
): GameState {
  const heartLimit = Math.min(
    heartLimitMaximum,
    Math.max(0, Math.trunc(calculateHeartLimitWithoutLimit(base, heartLimitBuffs))),
  );
  return {
    ...state,
    hearts: changeStarGatherHeartLimit(state.hearts, heartLimit).state,
    heartLimitBase: base,
    heartLimitBuffs,
  };
}
