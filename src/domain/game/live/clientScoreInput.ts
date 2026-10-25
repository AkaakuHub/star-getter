export type StarGatherCardAppealParameters = Readonly<{
  smile: number;
  pure: number;
  cool: number;
}>;

type StarGatherStageScoreMultiplier = Readonly<{
  minimumHeartCount: number;
  maximumHeartCount: number;
  baseMultiplier: bigint;
  additionalMultiplier: bigint;
}>;

const addScoreMaxBase = 2_147_483_647;
const longMax = 9_223_372_036_854_775_807n;

export function calculateStarGatherCardAppealValue(
  parameters: StarGatherCardAppealParameters,
  musicType: 0 | 1 | 2 | 3,
  timelineDurationSeconds: number,
): number {
  if (
    !Number.isFinite(timelineDurationSeconds) ||
    timelineDurationSeconds <= 0 ||
    Object.values(parameters).some((value) => !Number.isFinite(value) || value < 0)
  ) {
    throw new Error('StarGather card appeal input is invalid');
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

export function calculateStarGatherMasteryLoveBonusEffect(loveCorrectionValue: number): number {
  if (!Number.isSafeInteger(loveCorrectionValue) || loveCorrectionValue < 0) {
    throw new Error('StarGather STAR correction value is invalid');
  }
  return loveCorrectionValue > 0 ? loveCorrectionValue / 10_000 + 1 : 1;
}

export function starGatherValueToFactor(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('StarGather skill effect value is invalid');
  }
  return value / 10_000;
}

export function calculateStarGatherAddScoreMax(
  collectCount: number,
  multipliers: readonly StarGatherStageScoreMultiplier[],
): bigint {
  if (!Number.isSafeInteger(collectCount) || collectCount < 0) {
    throw new Error('StarGather add score max collect count is invalid');
  }
  const matches = multipliers.filter(
    (row) => collectCount >= row.minimumHeartCount && collectCount <= row.maximumHeartCount,
  );
  const row = matches[0];
  if (matches.length > 1) {
    throw new Error('StarGather add score max multiplier overlaps');
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
