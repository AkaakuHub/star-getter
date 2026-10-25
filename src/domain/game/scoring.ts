import { voltageLevel } from './live/voltageLevel';
import { scoreMultipliers } from '../../content/scoring';
import { type GameState, rules } from './model';
import { durationSeconds } from './projection';
import { calculateStarGatherClientScore } from './live/clientScore';
import {
  calculateStarGatherCardAppealValue,
  calculateStarGatherMasteryLoveBonusEffect,
  starGatherValueToFactor,
  calculateStarGatherAddScoreMax,
} from './live/clientScoreInput';
import { calculateStarGatherFlowerRank, calculateStarGatherHeartRank } from './live/heartRank';

export function limitValue(value: bigint): bigint {
  return value > rules.maxScore ? rules.maxScore : value < 0n ? 0n : value;
}

export function collectionScore(
  state: GameState,
  count: number,
  missed: boolean,
  rankHeartCount: number,
): bigint {
  const voltage = voltageLevel(state.excitement, state.maximumVoltageLevel);
  const rank = state.bloom
    ? calculateStarGatherFlowerRank(rankHeartCount, Number(state.bloom.progress))
    : calculateStarGatherHeartRank(rankHeartCount, voltage, null);
  const bonusScoreValue =
    state.boosts.reduce((sum, boost) => sum + boost.percent, 0) +
    state.temporaryScoreBoosts.reduce((sum, boost) => sum + boost.percent, 0);
  const base = calculateStarGatherClientScore(
    {
      cards: state.cardPool
        .filter((card) => !card.token)
        .map((card) => ({
          appealValue: calculateStarGatherCardAppealValue(card.appeal, 0, durationSeconds(state)),
        })),
      collectNum: count,
      heartRankMagnification: rank.magnification,
      isDisappearCollect: missed,
      masteryLoveBonusEffect: calculateStarGatherMasteryLoveBonusEffect(0),
      skillLoveBonusEffect: 1,
      currentGenesisGauge: Number(state.bloom?.progress ?? 0n),
      bonusScoreValue,
      challengeBonusFactor: 1,
    },
    {
      valueToFactor: starGatherValueToFactor,
      getAddScoreMax: (collectCount) =>
        calculateStarGatherAddScoreMax(collectCount, scoreMultipliers, {
          additionalEnabled: state.track.scoreLimit.additionalEnabled,
          bonusScoreValue,
          voltageMultiplier:
            state.track.scoreLimit.voltageMultipliers.find(
              (row) => row.minimumLevel <= voltage && voltage <= row.maximumLevel,
            )?.multiplier ?? 0n,
          bloomActive: state.bloom !== null,
          bloomGauge: Number(state.bloom?.progress ?? 0n),
        }),
    },
  );
  return base * state.scoreMultiplier;
}
