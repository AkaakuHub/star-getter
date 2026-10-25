import { scoreUnits } from './units';

export function projectStarScore(value: bigint) {
  if (value < 0n) throw new Error('STARは非負の整数が必要です。');
  const raw = value.toString(10);
  if (raw.length > 72) throw new Error('STARが無量大数の表示範囲を超えています。');
  const length = Math.max(20, Math.ceil(raw.length / 4) * 4);
  const columns = 12;
  const rows = Math.ceil(length / columns);
  return {
    rows,
    columns,
    firstColumn: columns * rows - length + 1,
    digits: raw
      .padStart(length, '0')
      .split('')
      .map((digit, index) => {
        const place = length - index - 1;
        return {
          digit,
          place,
          comma: place > 0 && place % 3 === 0 && place % columns !== 0,
          unit: place > 0 && place % 4 === 0 ? scoreUnits[place / 4] : undefined,
        };
      }),
  };
}
