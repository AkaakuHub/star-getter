import thresholds from '../../../content/master/voltageThresholds.json';

export function voltageLevel(points: number): number {
  return thresholds.findLastIndex((threshold) => threshold <= points) + 1;
}

export function voltageProgress(points: number): number {
  const level = voltageLevel(points);
  const lower = level === 0 ? 0 : thresholds[level - 1];
  const upper = thresholds[level];
  if (upper === undefined) return 100;
  if (lower === undefined) throw new Error('熱気の段階がありません。');
  return ((points - lower) / (upper - lower)) * 100;
}
