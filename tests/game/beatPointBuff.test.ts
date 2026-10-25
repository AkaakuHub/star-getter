import { expect, it } from 'vite-plus/test';
import { beatHeartCount } from '../../src/domain/game/beat';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('ビートポイントの加算は自然発生数の補正より前に適用する', () => {
  const initial = game('library');
  const buffed = applyEffect(initial, { kind: 'beat-point-buff', amount: 100 });
  expect(beatHeartCount(buffed)).toBeGreaterThan(beatHeartCount(initial));
});

it('パート数で指定したビートポイント増加は期限後に自然発生数へ反映しない', () => {
  const initial = game('library');
  const buffed = applyEffect(initial, {
    kind: 'beat-point-buff',
    amount: 100,
    duration: { sections: 1 },
  });
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('パートがありません。');
  const expired = advanceTo(buffed, (nextSection.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(expired.beatPointBuffs).toHaveLength(0);
  expect(beatHeartCount(expired)).toBe(beatHeartCount(initial));
});
