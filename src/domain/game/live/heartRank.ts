const heartRankThresholds = [100, 200, 360, 720] as const;
const heartRankMagnifications = [1, 2, 2.5, 3, 3.5] as const;

type StarGatherHeartRank = Readonly<{
  rank: number;
  magnification: number;
}>;

export function calculateStarGatherHeartRank(
  collectableHeartCount: number,
  currentVoltageLevel: number,
  rankRange: Readonly<{ minimum: number; maximum: number }> | null,
): StarGatherHeartRank {
  if (
    !Number.isSafeInteger(collectableHeartCount) ||
    collectableHeartCount < 0 ||
    !Number.isSafeInteger(currentVoltageLevel) ||
    currentVoltageLevel < 0
  ) {
    throw new Error('StarGather Heart rank input is invalid');
  }
  const heartValue = collectableHeartCount * currentVoltageLevel;
  let rank = heartRankThresholds.reduce(
    (value, threshold) => value + Number(heartValue >= threshold),
    0,
  );
  if (rankRange !== null) {
    if (
      !Number.isSafeInteger(rankRange.minimum) ||
      !Number.isSafeInteger(rankRange.maximum) ||
      rankRange.minimum < 0 ||
      rankRange.maximum >= heartRankMagnifications.length ||
      rankRange.minimum > rankRange.maximum
    ) {
      throw new Error('StarGather Heart rank range is invalid');
    }
    rank = Math.min(rankRange.maximum, Math.max(rankRange.minimum, rank));
  }
  const magnification = heartRankMagnifications[rank];
  if (magnification === undefined) {
    throw new Error('StarGather Heart rank magnification is absent');
  }
  return { rank, magnification };
}
