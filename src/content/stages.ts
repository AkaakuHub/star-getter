import { calculateQuestLiveBaseGaugeIntervalSeconds } from '@akaakuhub/suku-sute-core/questLive/live/gaugeTiming';
import { type StageGauges } from '@akaakuhub/suku-sute-core/game/live/gaugeTiming';

export const standardStage: StageGauges = {
  maxEnergy: 20,
  apIncreaseIntervalSeconds: Math.fround(1160 / 1000),
  mentalDecreaseIntervalSeconds: calculateQuestLiveBaseGaugeIntervalSeconds(1000, 11605),
  voltageIncreaseIntervalSeconds: calculateQuestLiveBaseGaugeIntervalSeconds(500, 11605),
};
