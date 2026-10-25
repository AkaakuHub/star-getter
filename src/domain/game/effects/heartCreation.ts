import { beatHeartCount } from '../beat';
import { addHearts, addHeartsWithLifeTime } from '../hearts';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import { skillValue } from './skillValue';
import { consumeHeartBoosts } from '../live/heartBoosts';
import { applyAdditionalBuff } from './additionalBuff';
import type { Card, GameState } from '../model';

export function createSkillHearts(
  state: GameState,
  count: number,
  lifetimeSeconds: number,
  card: Card | undefined,
): GameState {
  const base = Math.max(0, count);
  const boosted = consumeHeartBoosts(state, card, base);
  const created = Math.max(1, Math.trunc(Math.fround(base + (base * boosted.percent) / 100)));
  return addHeartsWithLifeTime(boosted.state, created, lifetimeSeconds);
}

export function createHeartsFromEffect(
  state: GameState,
  amount: number,
  card: Card | undefined,
  byBeat: boolean,
  effectPower = 1,
  lifetimeSeconds?: number,
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
  const additional = applyAdditionalBuff(state, 'attract', base, card);
  const action52 = applyAction52SkillBoostForCard(additional.state, card, additional.value);
  const heartBase = Math.trunc(action52.value);
  const boosted = consumeHeartBoosts(action52.state, card, heartBase);
  const count = Math.max(
    1,
    Math.trunc(
      Math.fround(Math.fround(heartBase + (heartBase * boosted.percent) / 100) * effectPower),
    ),
  );
  return lifetimeSeconds === undefined
    ? addHearts(boosted.state, count)
    : addHeartsWithLifeTime(boosted.state, count, lifetimeSeconds);
}
