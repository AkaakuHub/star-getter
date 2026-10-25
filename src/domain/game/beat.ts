import type { GameState } from './model';
import { moodValue } from './projection';
import { calculateStarGatherBeatHeart } from './live/beatHeart';

const goodMood = { nova: 1, lumen: 3, tetra: 2 } as const;

export function beatHeartCount(state: GameState): number {
  return calculateStarGatherBeatHeart(
    {
      cards: state.cardPool
        .filter((card) => !card.token)
        .map((card) => ({
          beatPoint: card.beatPoint,
          goodMood: goodMood[card.performer],
        })),
      musicBeatPoint: 1.0112,
      moodValue: moodValue(state),
      heartAppearRatio: 1,
    },
    {
      applyBeatPointBuff: (value) => value,
      applyBeatHeartBuff: (value) => value + state.sectionBeatHeartBonus,
    },
  ).createCount;
}
