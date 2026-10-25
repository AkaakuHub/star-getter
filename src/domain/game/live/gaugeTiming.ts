export function baseGaugeIntervalSeconds(base: number, songTime: number): number {
  const milliseconds = Math.fround(Math.fround(base * songTime) / Math.fround(10_000));
  const truncated = Math.trunc(milliseconds);
  const fraction = Math.fround(milliseconds - Math.fround(truncated));
  return Math.fround((fraction < Math.fround(0.1) ? truncated : Math.ceil(milliseconds)) / 1000);
}

export type StageGauges = Readonly<{
  maxEnergy: number;
  apIncreaseIntervalSeconds: number;
  mentalDecreaseIntervalSeconds: number;
  voltageIncreaseIntervalSeconds: number;
}>;
