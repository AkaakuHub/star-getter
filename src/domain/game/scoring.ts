import { type GameState, rules } from './model';
import { durationSeconds } from './projection';
import { calculateLoveGatherClientScore } from './live/clientScore';
import {
  calculateLoveGatherCardAppealValue,
  calculateLoveGatherMasteryLoveBonusEffect,
  loveGatherValueToFactor,
  calculateLoveGatherAddScoreMax,
} from './live/clientScoreInput';
import { calculateLoveGatherHeartRank } from './live/heartRank';

export function limitValue(value: bigint): bigint {
  return value > rules.maxScore ? rules.maxScore : value < 0n ? 0n : value;
}

export function collectionScore(state: GameState, count: number, missed: boolean): bigint {
  const voltage = Math.floor(state.excitement / 2);
  const rank = calculateLoveGatherHeartRank(count, voltage, null);
  return calculateLoveGatherClientScore(
    {
      cards: state.deck.map((card) => ({
        appealValue: calculateLoveGatherCardAppealValue(card.appeal, 0, durationSeconds(state)),
      })),
      collectNum: count,
      heartRankMagnification: rank.magnification,
      isDisappearCollect: missed,
      masteryLoveBonusEffect: calculateLoveGatherMasteryLoveBonusEffect(0),
      skillLoveBonusEffect: 1,
      currentGenesisGauge: Number(state.bloom?.progress ?? 0n),
      bonusScoreValue: Number(state.boosts.reduce((sum, boost) => sum + boost.percent * 100n, 0n)),
      challengeBonusFactor: 1,
    },
    {
      valueToFactor: loveGatherValueToFactor,
      getAddScoreMax: (collectCount) => calculateLoveGatherAddScoreMax(collectCount, []),
    },
  );
}
