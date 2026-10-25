import { expect, it } from 'vite-plus/test';
import { moodAtTime, validateMoodTimeline } from '../../src/domain/game/live/moodTimeline';
import { moodValue, sectionAt } from '../../src/domain/game/projection';
import { advanceTo } from '../../src/domain/game/simulation';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

it('キーの時刻へ到達するまで前の値を保ち、補間せず切り替える', () => {
  const keys = [
    { songTimeSeconds: 0, keyValue: 0 },
    { songTimeSeconds: 3, keyValue: 55 },
    { songTimeSeconds: 5, keyValue: -40 },
  ];
  expect(moodAtTime(keys, 2.99)).toBe(0);
  expect(moodAtTime(keys, 3)).toBe(55);
  expect(moodAtTime(keys, 4.99)).toBe(55);
  expect(moodAtTime(keys, 5)).toBe(-40);
  expect(() => validateMoodTimeline([...keys].reverse(), 60)).toThrow();
});

it('最初の25秒間にも空模様が変わり、区間を越えたときだけパート効果を解除する', () => {
  const initial = game();
  const before = advanceTo(initial, 14);
  const after = advanceTo(before, 15);
  expect(moodValue(before)).toBe(0);
  expect(moodValue(after)).toBe(55);
  expect(sectionAt(before)).toBe(sectionAt(after));
  const lowered = applyEffect(after, { kind: 'mood', amount: -50 });
  expect(moodValue(lowered)).toBe(5);
  const held = advanceTo(lowered, 24.9);
  expect(moodValue(held)).toBe(5);
  const boundary = advanceTo(held, 25);
  expect(sectionAt(boundary)).not.toBe(sectionAt(held));
  expect(boundary.moodOffset).toBe(0);
  expect(moodValue(boundary)).toBe(40);
});
