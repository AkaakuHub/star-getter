import { expect, it } from 'vite-plus/test';
import {
  beginTokenGeneration,
  finishTokenGeneration,
  requestTokens,
} from '../../src/domain/game/cards/tokens';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('追加カードの増幅は元指定枚数を超えて配分せず、同一スキル中は使用回数を一度だけ消費する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'multiply-percent',
      num: 1_000_000,
      target: { kind: 'member', member: source.member },
      seriesIds: [42],
      uses: 1,
    },
    source,
  );
  let state = beginTokenGeneration(boosted, source.id);
  state = requestTokens(state, 'story', 2, source.id, [42]);
  state = requestTokens(state, 'clock', 2, source.id, [42]);
  const finished = finishTokenGeneration(state, source.id);
  expect(finished.deck.filter((card) => card.token === 'story')).toHaveLength(2);
  expect(finished.deck.filter((card) => card.token === 'clock')).toHaveLength(2);
  expect(finished.tokenBoosts).toHaveLength(0);
});

it('追加カードの増幅は対象カードと生成効果のシリーズ指定が一致したときだけ消費する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 20_000,
      target: { kind: 'member', member: source.member },
      seriesIds: [42],
      uses: 2,
    },
    source,
  );
  const unmatched = requestTokens(boosted, 'story', 1, source.id, [11]);
  expect(unmatched.tokenBoosts[0]?.remainingUses).toBe(2);
  const matched = requestTokens(unmatched, 'story', 1, source.id, [42]);
  expect(matched.tokenBoosts[0]?.remainingUses).toBe(1);
  expect(matched.deck.filter((card) => card.token === 'story')).toHaveLength(4);
});

it('追加カードの増幅は時間またはパート期限で解除する', () => {
  const initial = game('library');
  const timed = applyEffect(initial, {
    kind: 'token-boost',
    calculation: 'add',
    num: 10_000,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500 },
  });
  expect(advanceTo(timed, 0.6).tokenBoosts).toHaveLength(0);
  const section = applyEffect(initial, {
    kind: 'token-boost',
    calculation: 'add',
    num: 10_000,
    target: { kind: 'all' },
    duration: { kind: 'sections', value: 1 },
  });
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('パートがありません。');
  expect(
    advanceTo(section, (nextSection.startBeat * 60) / initial.track.bpm + 1 / 60).tokenBoosts,
  ).toHaveLength(0);
});
