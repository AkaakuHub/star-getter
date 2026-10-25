import { expect, it } from 'vite-plus/test';
import { projectStarScore } from '../../src/presentation/score/starScore';
import { rules } from '../../src/domain/game/model';

it('ゼロでは京までの20桁を埋め、3桁ごとの区切りと4桁ごとの漢字単位を表示する', () => {
  const display = projectStarScore(0n);
  expect(display.digits.map(({ digit, comma }) => digit + (comma ? ',' : '')).join('')).toBe(
    '00,000,000000,000,000,000',
  );
  expect(display.digits.filter(({ unit }) => unit).map(({ unit }) => unit)).toEqual([
    '京',
    '兆',
    '億',
    '万',
  ]);
  expect(display.rows).toBe(2);
  expect(display.firstColumn).toBe(5);
});

it('京の4桁を超えたときに垓の桁を追加する', () => {
  expect(projectStarScore(10n ** 20n - 1n).digits).toHaveLength(20);
  const display = projectStarScore(10n ** 20n);
  expect(display.digits).toHaveLength(24);
  expect(display.digits.find(({ unit }) => unit)?.unit).toBe('垓');
});

it('9999無量大数まで全桁を保持し、1行12桁で表示する', () => {
  const value = rules.maxScore - 123n;
  const display = projectStarScore(value);
  expect(BigInt(display.digits.map(({ digit }) => digit).join(''))).toBe(value);
  expect(display.digits).toHaveLength(72);
  expect(display.digits.find(({ unit }) => unit)?.unit).toBe('無量大数');
  expect(display.rows).toBe(6);
  expect(display.columns).toBe(12);
  for (const { place, unit } of display.digits) if (unit) expect(place % 4).toBe(0);
});
