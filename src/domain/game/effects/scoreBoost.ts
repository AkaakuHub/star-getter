import { durationSeconds } from '../projection';
import { rules } from '../model';
import type { Card, GameState } from '../model';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { applyLoveUpAdditionalBuffs } from './loveUpAdditionalBuff';
import { absorbSkillEffect } from './proxySkill';

export function applyScoreBoost(
  state: GameState,
  amount: number,
  card: Card | undefined,
): GameState {
  const loveUp = applyLoveUpAdditionalBuffs(state, card, amount);
  const action52 = applyAction52SkillBoostForCard(loveUp.state, card, Math.trunc(loveUp.value));
  const proxy = absorbSkillEffect(
    action52.state,
    2,
    Number.isFinite(action52.value)
      ? BigInt.asIntN(64, BigInt(Math.trunc(action52.value)))
      : -(1n << 63n),
  );
  if (proxy.absorbed) return proxy.state;
  return {
    ...proxy.state,
    boosts: [
      ...action52.state.boosts,
      {
        percent: Math.trunc(action52.value),
        untilTick: Math.round(durationSeconds(state) * rules.ticksPerSecond),
      },
    ],
  };
}
