import type { Card, Effect, GameState } from '../model';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { activateBloom } from '../bloom';

type GenesisSkillEffect = Extract<Effect, { kind: 'genesis-skill' }>;

export function activateGenesisSkill(
  state: GameState,
  effect: GenesisSkillEffect,
  card: Card | undefined,
): GameState {
  if (effect.duration.kind !== 'stage' && effect.duration.value < 1) return state;
  const effectBaseNum = Number(BigInt.asIntN(32, BigInt(effect.effectBaseNum)));
  const value = Math.fround(Math.fround(effectBaseNum) / 10_000);
  const boosted = applyAction52SkillBoostForCard(state, card, value);
  return effect.duration.kind === 'stage'
    ? activateBloom(boosted.state, boosted.value)
    : boosted.state;
}
