export function applyStarGatherSkillBoost(value: number, boostPercent: number): number {
  if (!Number.isFinite(value)) throw new Error('StarGather SkillBoost value is invalid');
  if (value <= 0) return value;
  const clampedPercent = Math.max(boostPercent, -100);
  return Math.fround(value + (value * clampedPercent) / 100);
}
