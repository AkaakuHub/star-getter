import type { Card, GameState, PerformerId } from './model';
import { moodValue } from './projection';
import { calculateStarGatherBeatHeart } from './live/beatHeart';
import { applyOrderedBuffs } from './parameters/buffs';

const goodMood = { nova: 1, lumen: 3, tetra: 2 } as const;

export function beatHeartCount(state: GameState): number {
  return calculateStarGatherBeatHeart(
    {
      cards: state.cardPool.filter(isScoringCard).map((card) => ({
        beatPoint: card.beatPoint,
        goodMood: goodMood[card.performer],
      })),
      musicBeatPoint: 1.0112,
      moodValue: moodValue(state),
      heartAppearRatio: 1,
    },
    {
      applyBeatPointBuff: (value) =>
        state.beatPointBuffs.reduce((current, buff) => current + buff.value, value),
      applyBeatHeartBuff: (value) =>
        applyOrderedBuffs(
          value,
          state.beatHeartValueBuffs.map((buff) => ({
            kind: buff.calculation,
            value: buff.value,
            group: 'skill' as const,
          })),
        ) + state.sectionBeatHeartBonus,
    },
  ).createCount;
}

function isScoringCard(card: Card): card is Card & { performer: PerformerId } {
  return !card.token && !card.tokenCard && card.performer !== null;
}
