import { durationSeconds } from '../projection';
import { rules } from '../model';
import type { Card, GameState } from '../model';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { applyLoveUpAdditionalBuffs } from './loveUpAdditionalBuff';

export function applyScoreBoost(
  state: GameState,
  amount: number,
  card: Card | undefined,
): GameState {
  const loveUp = applyLoveUpAdditionalBuffs(state, card, amount);
  const action52 = applyAction52SkillBoostForCard(loveUp.state, card, Math.trunc(loveUp.value));
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
