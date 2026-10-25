import { beatHeartCount } from '../beat';
import { addHeartsWithLifeTime } from '../hearts';
import { moodValue } from '../projection';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { consumeHeartBoosts } from '../live/heartBoosts';
import type { Card, GameState } from '../model';
import type { Effect } from '../modelTypes';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { applyAdditionalBuff } from './additionalBuff';

type SkillHeartsEffect = Extract<Effect, { kind: 'skill-hearts' }>;

export function createSkillHeartsFromEffect(
  state: GameState,
  effect: SkillHeartsEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
): GameState {
  const amount = int32(effect.amount);
  const moodCorrection = effect.moodBonus
    ? calculateSkillMoodCorrection(
        effect.moodBonus.target,
        moodValue(state),
        effect.moodBonus.perPoint,
      )
    : 0;
  const amountValue = Math.fround(Math.fround(amount) / Math.fround(10_000));
  const combined = Math.fround(
    Math.fround(Math.fround(moodCorrection + amountValue) + Math.fround(addValue)) *
      Math.fround(multiplier),
  );
  const calculationValue = effect.calculation === 'fixed' ? Math.trunc(combined) : combined;
  const additional = applyAdditionalBuff(state, 'attract', calculationValue, card);
  let value = Math.trunc(additional.value);
  let next = additional.state;
  if (value > 0) {
    const action52 = applyAction52SkillBoostForCard(next, card, value);
    next = action52.state;
    value = Math.trunc(action52.value);
  }

  const baseCount =
    effect.calculation === 'fixed'
      ? Math.fround(value)
      : Math.fround(Math.fround(value) * Math.fround(beatHeartCount(next)));
  const heartBoost = consumeHeartBoosts(next, card, baseCount);
  next = heartBoost.state;
  const requestedCount = Math.fround(
    baseCount + Math.fround((baseCount * heartBoost.percent) / 100),
  );
  const count = Math.max(1, Math.trunc(Math.fround(requestedCount * Math.fround(effectPower))));
  const lifetimeSeconds =
    effect.displayTime.kind === 'milliseconds'
      ? Math.fround(int32(effect.displayTime.value) / 1000)
      : 9999;
  return addHeartsWithLifeTime(next, count, lifetimeSeconds);
}

function int32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}
