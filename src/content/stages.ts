import { calculateLiveBaseGaugeIntervalSeconds } from '@akaakuhub/suku-sute-core/runtime/live/gaugeTiming';
import { type StageGauges } from '@akaakuhub/suku-sute-core/game/live/gaugeTiming';

export const standardStage: StageGauges = {
  maxAp: 20,
  apIncreaseIntervalSeconds: Math.fround(1160 / 1000),
  mentalDecreaseIntervalSeconds: calculateLiveBaseGaugeIntervalSeconds(1000, 11605),
  voltageIncreaseIntervalSeconds: calculateLiveBaseGaugeIntervalSeconds(500, 11605),
};
