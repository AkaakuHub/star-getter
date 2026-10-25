import type { Card, Effect, GameState } from '../model';
import { moodValue } from '../projection';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { applyStarGatherSkillBoost } from '../live/skillBoost';

export function skillValue(state: GameState, value: number, effect: Effect, card?: Card): number {
  const bonus =
    'moodBonus' in effect && effect.moodBonus
      ? calculateSkillMoodCorrection(
          effect.moodBonus.target,
          moodValue(state),
          effect.moodBonus.perPoint,
        )
      : 0;
  const raw = Math.fround(value + bonus);
  const base =
    effect.kind === 'boost' || effect.kind === 'stamina' || effect.kind === 'excitement'
      ? Math.trunc(raw)
      : effect.kind === 'bloom' || effect.kind === 'amplify' || effect.kind === 'energy'
        ? raw
        : Math.ceil(raw);
  const handBoost = state.deck.reduce(
    (sum, item) =>
      sum +
      (state.handEffectCardIds.includes(item.id) &&
      (item.token === 'bookmark' || item.token === 'story') &&
      state.deck.length >= 80
        ? Math.fround(1001 + Math.max(0, moodValue(state)) * 5.005)
        : 0),
    0,
  );
  const story = card?.token === 'story' ? state.storyAmplification + handBoost : 0;
  const targeted = card
    ? state.targetBoosts.reduce(
        (sum, boost) => sum + (boost.members.includes(card.member) ? boost.percent : 0),
        0,
      )
    : 0;
  const passive = card
    ? state.deck.reduce((sum, item) => {
        const boost = item.passive?.skillBoost;
        if (!state.handEffectCardIds.includes(item.id) || !boost?.members.includes(card.member))
          return sum;
        const mood = boost.moodBonus
          ? calculateSkillMoodCorrection(
              boost.moodBonus.target,
              moodValue(state),
              boost.moodBonus.perPoint,
            )
          : 0;
        return sum + boost.percent + mood;
      }, 0)
    : 0;
  return applyStarGatherSkillBoost(base, state.amplification - 100 + story + targeted + passive);
}
