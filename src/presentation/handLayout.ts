export function handGeometry(
  index: number,
  count: number,
): Readonly<{ x: number; y: number; width: number; height: number; rotation: number }> {
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
  const intervals = count - 1;
  const maximumRange = 0.5235988;
  const step =
    Math.fround(intervals * 0.12217305) >= maximumRange
      ? Math.fround(maximumRange / intervals)
      : Math.fround(0.12217305);
  const initial =
    Math.fround(intervals * 0.12217305) >= maximumRange
      ? Math.fround(-0.2617994)
      : Math.fround(Math.fround(Math.fround(intervals) * Math.fround(-0.12217305)) * 0.5);
  const angle = Math.fround(initial + Math.fround(step * index));
  const radius = 1492.8203125;
  const localX = Math.fround(radius * Math.fround(Math.sin(angle)));
  const localY = Math.fround(Math.fround(radius * Math.fround(Math.cos(angle))) - radius);
  return {
    x: Math.fround(540 + localX - 84),
    y: Math.fround(1920 - (193 + localY + 114)),
    width: 168,
    height: 228,
    rotation: (angle * 180) / Math.PI,
  };
}

export function handLayout(index: number, count: number, selected: boolean) {
  const rect = handGeometry(index, count);
  const angle = (rect.rotation * Math.PI) / 180;
  const lift = selected ? 50 : 0;
  return {
    left: (rect.x + Math.sin(angle) * lift) / 10.8 + '%',
    bottom: (1920 - rect.y - rect.height + Math.cos(angle) * lift) / 10.8 + 'cqw',
    transform: `rotate(${rect.rotation}deg)`,
  };
}
