import { baseGaugeIntervalSeconds, type StageGauges } from '../domain/game/live/gaugeTiming';

export const standardStage: StageGauges = {
  maxEnergy: 20,
  apIncreaseIntervalSeconds: Math.fround(1160 / 1000),
  mentalDecreaseIntervalSeconds: baseGaugeIntervalSeconds(1000, 11605),
  voltageIncreaseIntervalSeconds: baseGaugeIntervalSeconds(500, 11605),
};
