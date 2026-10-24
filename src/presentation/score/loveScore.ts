import { scoreUnits } from './units';

export function projectLoveScore(value: bigint) {
  if (value < 0n) throw new Error('LOVEは非負の整数が必要です。');
  const raw = value.toString(10);
  if (raw.length > 72) throw new Error('LOVEが無量大数の表示範囲を超えています。');
  const length = Math.max(20, Math.ceil(raw.length / 4) * 4);
  const rows = Math.ceil(length / 24);
  return {
    rows,
    columns: Math.ceil(length / rows / 4) * 4,
    digits: raw
      .padStart(length, '0')
      .split('')
      .map((digit, index) => {
        const place = length - index - 1;
        return {
          digit,
          place,
          comma: place > 0 && place % 3 === 0,
          unit: place > 0 && place % 4 === 0 ? scoreUnits[place / 4] : undefined,
        };
      }),
  };
}
