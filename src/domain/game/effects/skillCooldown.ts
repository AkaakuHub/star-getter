import type { GameState } from '../model';
import type { SkillCooldownEffectInput } from '../skillCooldownTypes';

export function activateSkillCooldown(
  state: GameState,
  effect: SkillCooldownEffectInput,
): GameState {
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  const base: GameState['skillCooldownEffects'][number] = {
    id: state.nextSkillCooldownEffectId,
    num: effect.num,
    deckUnderAdd: effect.deckUnderAdd,
    deckOverAdd: effect.deckOverAdd,
    deckUnderLimit: effect.deckUnderLimit,
    deckOverLimit: effect.deckOverLimit,
    deckCardMax: effect.deckCardMax,
    deckCardCountAtActivation: state.deck.length,
    duration: effect.duration,
    updatesWithDeckCount: !suppressDuration,
    remainingSeconds:
      suppressDuration || effect.duration.kind !== 'milliseconds'
        ? null
        : Math.fround(effect.duration.value / 1000),
    remainingSections:
      suppressDuration || effect.duration.kind !== 'sections' ? null : effect.duration.value,
    deactivationKey: effect.deactivationKey ?? null,
  };
  return {
    ...state,
    skillCooldownEffects: [...state.skillCooldownEffects, base],
    nextSkillCooldownEffectId: state.nextSkillCooldownEffectId + 1,
  };
}

export function skillCooldownSeconds(
  state: GameState,
  effect: GameState['skillCooldownEffects'][number],
): number {
  const value = Math.fround(
    Math.fround(Math.fround(effect.num / 10_000) * Math.fround(state.track.songTime)) / 10_000,
  );
  if (effect.deckCardMax === null) return value;
  const deckCardCount = effect.updatesWithDeckCount
    ? state.deck.length
    : effect.deckCardCountAtActivation;
  const diff = deckCardCount - effect.deckCardMax;
  const under = Math.fround(effect.deckUnderAdd / 10_000);
  const over = Math.fround(effect.deckOverAdd / 10_000);
  const add =
    diff < 0
      ? Math.fround(under * Math.min(-diff, effect.deckUnderLimit))
      : Math.fround(over * Math.min(diff, effect.deckOverLimit));
  return Math.fround(value * Math.fround(1 + add));
}

export function advanceSkillCooldownEffects(state: GameState, elapsedSeconds: number): GameState {
  return {
    ...state,
    skillCooldownEffects: state.skillCooldownEffects.flatMap((effect) => {
      if (effect.remainingSeconds === null) return [effect];
      const remainingSeconds = Math.fround(effect.remainingSeconds - Math.fround(elapsedSeconds));
      return remainingSeconds > 0 ? [{ ...effect, remainingSeconds }] : [];
    }),
  };
}

export function expireSkillCooldownSections(state: GameState): GameState {
  return {
    ...state,
    skillCooldownEffects: state.skillCooldownEffects.flatMap((effect) => {
      if (effect.remainingSections === null) return [effect];
      const remainingSections = effect.remainingSections - 1;
      return remainingSections > 0 ? [{ ...effect, remainingSections }] : [];
    }),
  };
}

export function deactivateSkillCooldownEffects(
  state: GameState,
  deactivationKey: string,
): GameState {
  return {
    ...state,
    skillCooldownEffects: state.skillCooldownEffects.filter(
      (effect) => effect.deactivationKey !== deactivationKey,
    ),
  };
}
