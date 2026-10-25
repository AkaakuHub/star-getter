import { expect, it } from 'vite-plus/test';
import {
  beginTokenGeneration,
  finishTokenGeneration,
  requestTokenCard,
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

it('カードの追加シリーズを対象とする増幅は生成元のシリーズで判定する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('カードがありません。');
  const state = {
    ...initial,
    cardPool: initial.cardPool.map((card) =>
      card.id === source.id ? { ...card, tokenSeriesIds: [7] } : card,
    ),
  };
  const boosted = applyEffect(
    state,
    {
      kind: 'token-boost',
      calculation: 'multiply-percent',
      num: 1_000_000,
      target: { kind: 'card-series', seriesId: 7 },
      uses: 1,
    },
    source,
  );
  const generated = requestTokens(boosted, 'story', 2, source.id);
  expect(generated.deck.filter((card) => card.token === 'story')).toHaveLength(4);
  expect(generated.tokenBoosts).toHaveLength(0);
});

it('ActionType28は指定したトークンカードを直接追加し、データ項目を保つ', () => {
  const initial = game('library');
  const template = initial.tokenCatalog.find((card) => card.token === 'story');
  if (!template) throw new Error('トークンカードがありません。');
  const customized = {
    ...initial,
    tokenCatalog: initial.tokenCatalog.map((card) =>
      card.id === template.id ? { ...card, id: 'action28-template', style: 2 as const } : card,
    ),
  };
  const generated = applyEffect(
    customized,
    { kind: 'token-card', templateId: 'action28-template', count: 2, seriesIds: [42] },
    undefined,
  );
  const added = generated.deck.filter((card) => card.id.startsWith('action28-template-'));
  expect(added).toHaveLength(2);
  expect(added.every((card) => card.style === 2)).toBe(true);
  expect(generated.drawPile.filter((id) => id.startsWith('action28-template-'))).toHaveLength(2);
});

it('ActionType28は同一スキル内で指定カードを増幅後に交互追加する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  const template = initial.tokenCatalog.find((card) => card.token === 'story');
  if (!source || !template) throw new Error('カードがありません。');
  const customized = {
    ...initial,
    tokenCatalog: initial.tokenCatalog.map((card) =>
      card.id === template.id ? { ...card, id: 'action28-template' } : card,
    ),
  };
  const boosted = applyEffect(
    customized,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 10_000,
      target: { kind: 'member', member: source.member },
      seriesIds: [42],
      uses: 1,
    },
    source,
  );
  let state = beginTokenGeneration(boosted, source.id);
  state = requestTokenCard(state, 'action28-template', 2, source.id, [42]);
  state = finishTokenGeneration(state, source.id);
  expect(state.deck.filter((card) => card.id.startsWith('action28-template-'))).toHaveLength(2);
  expect(state.tokenBoosts).toHaveLength(0);
});
