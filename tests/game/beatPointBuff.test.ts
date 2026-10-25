import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { beatHeartCount } from '../../src/domain/game/beat';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('Action47の加算は自然発生ハート数へ加算する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const buffed = applyEffect(
    initial,
    { kind: 'beat-heart-value-buff', calculation: 'add', amount: 1_000_000 },
    source,
  );
  expect(beatHeartCount(buffed) - beatHeartCount(initial)).toBe(100);
});

it('Action47は乗算・固定値の順にBuffを適用する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const multiplied = applyEffect(
    initial,
    { kind: 'beat-heart-value-buff', calculation: 'multiply', amount: 20_000 },
    source,
  );
  expect(beatHeartCount(multiplied)).toBe(beatHeartCount(initial) * 2);
  const fixed = applyEffect(
    initial,
    { kind: 'beat-heart-value-buff', calculation: 'fixed', amount: 50_000 },
    source,
  );
  expect(beatHeartCount(fixed)).toBe(5);
});

it('Action47の正値にAction52を適用し、負値には適用しない', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const buffed = applyEffect(
    action52,
    { kind: 'beat-heart-value-buff', calculation: 'add', amount: 1_000_000 },
    source,
  );
  expect(beatHeartCount(buffed) - beatHeartCount(initial)).toBe(150);
  const negative = applyEffect(
    initial,
    { kind: 'beat-heart-value-buff', calculation: 'add', amount: -1_000_000 },
    source,
  );
  expect(beatHeartCount(negative)).toBe(beatHeartCount(initial) - 100);
});

it('Action47の詳細値をC#のint32とfloat32へ変換する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const wrapped = applyEffect(
    initial,
    { kind: 'beat-heart-value-buff', calculation: 'add', amount: 2_147_483_648 },
    source,
  );
  expect(wrapped.beatHeartValueBuffs[0]?.value).toBe(-214_748.359375);
});

it('Action47は指定パートで解除される', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const buffed = applyEffect(
    initial,
    {
      kind: 'beat-heart-value-buff',
      calculation: 'add',
      amount: 1_000_000,
      duration: { kind: 'sections', value: 1 },
    },
    source,
  );
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('パートがありません。');
  const expired = advanceTo(buffed, (nextSection.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(expired.beatHeartValueBuffs).toHaveLength(0);
  expect(beatHeartCount(expired)).toBe(beatHeartCount(initial));
});

it('Action47のミリ秒期限とInvocationTypeによる期限抑止・外部解除を処理する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const timed = applyEffect(
    initial,
    {
      kind: 'beat-heart-value-buff',
      calculation: 'add',
      amount: 1_000_000,
      duration: { kind: 'milliseconds', value: 1000 },
      deactivationKey: 'beat-buff',
    },
    source,
  );
  expect(advanceTo(timed, 1.1).beatHeartValueBuffs).toHaveLength(0);
  const held = applyEffect(
    initial,
    {
      kind: 'beat-heart-value-buff',
      calculation: 'add',
      amount: 1_000_000,
      duration: { kind: 'milliseconds', value: 1000 },
      invocationType: 0x388,
      deactivationKey: 'beat-buff',
    },
    source,
  );
  expect(advanceTo(held, 1.1).beatHeartValueBuffs).toHaveLength(1);
  const deactivated = act(held, {
    type: 'deactivate-beat-heart-value-buff',
    deactivationKey: 'beat-buff',
  });
  expect(deactivated.beatHeartValueBuffs).toHaveLength(0);
});
