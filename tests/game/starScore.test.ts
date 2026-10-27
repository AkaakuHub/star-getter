import { expect, it } from 'vite-plus/test';
import { projectStarScore } from '../../src/presentation/score/starScore';
import { rules } from '@akaakuhub/suku-sute-core/game/model';

it('ゼロでは本家と同じ12桁を埋め、3桁ごとに区切って現在の0だけを強調する', () => {
  const display = projectStarScore(0n);
  const digits = display.lines.flat();
  expect(digits.map(({ digit, comma }) => digit + (comma ? ',' : '')).join('')).toBe(
    '000,000,000,000',
  );
  expect(display.lines).toHaveLength(1);
  expect(digits.filter(({ leading }) => leading)).toHaveLength(11);
  expect(digits.at(-1)?.leading).toBe(false);
});

it('現在の得点の前に埋めた0だけを抑え、得点の途中の0は強調する', () => {
  const digits = projectStarScore(1_000_005n).lines.flat();
  expect(digits.filter(({ leading }) => leading)).toHaveLength(5);
  expect(
    digits
      .filter(({ leading }) => !leading)
      .map(({ digit }) => digit)
      .join(''),
  ).toBe('1000005');
});

it('上限の72桁まで全桁を保持し、桁を省略せず12桁ずつ折り返す', () => {
  const value = rules.maxScore - 123n;
  const display = projectStarScore(value);
  expect(
    BigInt(
      display.lines
        .flat()
        .map(({ digit }) => digit)
        .join(''),
    ),
  ).toBe(value);
  expect(display.lines).toHaveLength(6);
  for (const line of display.lines) expect(line).toHaveLength(12);
});

it('12桁を超えた最上位の短い行でも、3桁の区切り位置を保つ', () => {
  const display = projectStarScore(12_345_678_901_234n);
  expect(
    display.lines.map((line) =>
      line.map(({ digit, comma }) => digit + (comma ? ',' : '')).join(''),
    ),
  ).toEqual(['12', '345,678,901,234']);
});
