import { durationSeconds } from '../projection';
import { rules } from '../model';
import type { Card, GameState } from '../model';
import { applyAdditionalBuff } from './additionalBuff';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';

export function applyScoreBoost(
  state: GameState,
  amount: number,
  card: Card | undefined,
): GameState {
  const additional = applyAdditionalBuff(state, 'attract', amount, card);
  const action52 = applyAction52SkillBoostForCard(
    additional.state,
    card,
    Math.trunc(additional.value),
  );
  return {
    ...action52.state,
    boosts: [
      ...action52.state.boosts,
      {
        percent: Math.trunc(action52.value),
        untilTick: Math.round(durationSeconds(state) * rules.ticksPerSecond),
      },
    ],
  };
}
