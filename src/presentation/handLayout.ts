export function handGeometry(
  index: number,
  count: number,
): Readonly<{ x: number; y: number; width: number; height: number; rotation: number }> {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
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
  const bottom = 193 + (Math.cos(angle) - 1) * radius - 114;
  return {
    x: 540 + Math.sin(angle) * radius - 84,
    y: 1920 - bottom - 228,
    width: 168,
    height: 228,
    rotation: (angle * 180) / Math.PI,
  };
}

export function handLayout(index: number, count: number) {
  const rect = handGeometry(index, count);
  return {
    left: rect.x / 10.8 + '%',
    bottom: (1920 - rect.y - rect.height) / 10.8 + 'cqw',
    transform: `rotate(${rect.rotation}deg)`,
  };
}
