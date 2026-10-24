export function handLayout(
  index: number,
  count: number,
): Readonly<{ left: string; bottom: string; transform: string }> {
  if (
    !Number.isInteger(count) ||
    count < 3 ||
    count > 8 ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= count
  ) {
    throw new Error('手札の配置が正しくありません。');
  }
  const angle =
    (index - (count - 1) / 2) * Math.min((7 * Math.PI) / 180, Math.PI / 6 / (count - 1));
  const radius = 1492.8203125;
  return {
    left: (540 + Math.sin(angle) * radius - 84) / 10.8 + '%',
    bottom: (193 + (Math.cos(angle) - 1) * radius - 114) / 10.8 + 'cqw',
    transform: 'rotate(' + (angle * 180) / Math.PI + 'deg)',
  };
}
