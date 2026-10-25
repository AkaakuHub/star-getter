import { beatHeartCount } from '../beat';
import { addHearts } from '../hearts';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { skillValue } from './skillValue';
import { consumeHeartBoosts } from '../live/heartBoosts';
import type { Card, GameState } from '../model';

export function createHeartsFromEffect(
  state: GameState,
  amount: number,
  card: Card | undefined,
  byBeat: boolean,
): GameState {
  const percent = state.deck.reduce(
    (sum, item) =>
      sum +
      (state.handEffectCardIds.includes(item.id) && item.passive
        ? skillValue(state, item.passive.heartsPercent ?? 0, {
            kind: 'amplify',
            percent: item.passive.heartsPercent ?? 0,
            ...(item.passive.moodBonus ? { moodBonus: item.passive.moodBonus } : {}),
          })
        : 0),
    100,
  );
  const beats = byBeat ? beatHeartCount(state) : 1;
  const base = Math.ceil((amount * percent * beats) / 100);
  const action52 = applyAction52SkillBoostForCard(state, card, base);
  const heartBase = Math.trunc(action52.value);
  const boosted = consumeHeartBoosts(action52.state, card, heartBase);
  return addHearts(
    boosted.state,
    Math.ceil(Math.fround(heartBase + (heartBase * boosted.percent) / 100)),
  );
}
