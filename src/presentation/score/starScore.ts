export function projectStarScore(value: bigint) {
  if (value < 0n) throw new Error('STARは非負の整数が必要です。');
  const raw = value.toString(10);
  if (raw.length > 72) throw new Error('STARが無量大数の表示範囲を超えています。');
  const padded = raw.padStart(12, '0');
  const leadingLength = value === 0n ? padded.length - 1 : padded.length - raw.length;
  const firstLineLength = ((padded.length - 1) % 12) + 1;
  const lines: Readonly<{ digit: string; leading: boolean; comma: boolean }>[][] = [];
  for (let offset = 0; offset < padded.length;) {
    const length = offset === 0 ? firstLineLength : 12;
    lines.push(
      padded
        .slice(offset, offset + length)
        .split('')
        .map((digit, index) => ({
          digit,
          leading: offset + index < leadingLength,
          comma: index < length - 1 && (length - index - 1) % 3 === 0,
        })),
    );
    offset += length;
  }
  return {
    lines,
  };
}
