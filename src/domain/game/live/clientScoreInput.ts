export type LoveGatherCardAppealParameters = Readonly<{
  smile: number;
  pure: number;
  cool: number;
}>;

type LoveGatherStageScoreMultiplier = Readonly<{
  minimumHeartCount: number;
  maximumHeartCount: number;
  baseMultiplier: bigint;
  additionalMultiplier: bigint;
}>;

const addScoreMaxBase = 2_147_483_647;
const longMax = 9_223_372_036_854_775_807n;

export function calculateLoveGatherCardAppealValue(
  parameters: LoveGatherCardAppealParameters,
  musicType: 0 | 1 | 2 | 3,
  timelineDurationSeconds: number,
): number {
  if (
    !Number.isFinite(timelineDurationSeconds) ||
    timelineDurationSeconds <= 0 ||
    Object.values(parameters).some((value) => !Number.isFinite(value) || value < 0)
  ) {
    throw new Error('LoveGather card appeal input is invalid');
  }
  return (
    appeal(parameters.smile, musicType === 0 || musicType === 1) +
    appeal(parameters.pure, musicType === 0 || musicType === 2) +
    appeal(parameters.cool, musicType === 0 || musicType === 3)
  );

  function appeal(value: number, matchingMusicType: boolean): number {
    return (value * (matchingMusicType ? 1.5 : 1)) / timelineDurationSeconds / 1000;
  }
}

export function calculateLoveGatherMasteryLoveBonusEffect(loveCorrectionValue: number): number {
  if (!Number.isSafeInteger(loveCorrectionValue) || loveCorrectionValue < 0) {
    throw new Error('LoveGather LOVE correction value is invalid');
  }
  return loveCorrectionValue > 0 ? loveCorrectionValue / 10_000 + 1 : 1;
}

export function loveGatherValueToFactor(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('LoveGather skill effect value is invalid');
  }
  return value / 10_000;
}

export function calculateLoveGatherAddScoreMax(
  collectCount: number,
  multipliers: readonly LoveGatherStageScoreMultiplier[],
): bigint {
  if (!Number.isSafeInteger(collectCount) || collectCount < 0) {
    throw new Error('LoveGather add score max collect count is invalid');
  }
  const matches = multipliers.filter(
    (row) => collectCount >= row.minimumHeartCount && collectCount <= row.maximumHeartCount,
  );
  const row = matches[0];
  if (matches.length > 1) {
    throw new Error('LoveGather add score max multiplier overlaps');
  }
  const multiplier =
    row === undefined
      ? 1
      : Number(
          row.baseMultiplier +
            row.additionalMultiplier * BigInt(collectCount - row.minimumHeartCount),
        ) / 10_000;
  const result = Math.trunc(multiplier * addScoreMaxBase);
  return result >= Number(longMax) ? longMax : BigInt(result);
}
