export function finalizeStarGatherSkillCost(baseCost: number, deltaAp: number): number {
  if (!Number.isSafeInteger(baseCost) || baseCost < 0) {
    throw new Error('StarGather skill base cost is invalid');
  }
  if (!Number.isFinite(deltaAp)) {
    throw new Error('StarGather skill cost delta is invalid');
  }
  const value = baseCost + deltaAp;
  return baseCost < 1 ? Math.trunc(value) : Math.trunc(Math.max(value, 1));
}
