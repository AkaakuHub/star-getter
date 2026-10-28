import { expect, it } from 'vite-plus/test';
import {
  beginTokenGeneration,
  finishTokenGeneration,
  requestTokens,
} from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { boostTokenRequests } from '@akaakuhub/suku-sute-core/game/cards/tokenBoost';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';
import { tokenCardEffect } from './support/tokenCardEffect';

it('追加カードの増幅は元指定枚数を超えて配分せず、同一スキル中は使用回数を一度だけ消費する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'multiply-percent',
      num: 1_000_000n,
      target: { kind: 'member', member: source.member },
      seriesIds: [42n],
      uses: 1n,
    },
    source,
  );
  let state = beginTokenGeneration(boosted, source.id);
  state = requestTokens(state, 'story', 2, source.id, [42]);
  state = requestTokens(state, 'clock', 2, source.id, [42]);
  const finished = finishTokenGeneration(state, source.id).state;
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
      num: 20_000n,
      target: { kind: 'member', member: source.member },
      seriesIds: [42n],
      uses: 2n,
    },
    source,
  );
  const unmatched = requestTokens(boosted, 'story', 1, source.id, [11]);
  expect(unmatched.tokenBoosts[0]?.remainingUses).toBe(2n);
  const matched = requestTokens(unmatched, 'story', 1, source.id, [42]);
  expect(matched.tokenBoosts[0]?.remainingUses).toBe(1n);
  expect(matched.deck.filter((card) => card.token === 'story')).toHaveLength(4);
});

it('ActionType38は負の計算値をバフとして登録しない', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: -10_000n,
      target: { kind: 'member', member: source.member },
    },
    source,
  );
  expect(boosted.tokenBoosts).toHaveLength(0);
  const generated = requestTokens(boosted, 'story', 2, source.id);
  expect(generated.deck.filter((card) => card.token === 'story')).toHaveLength(2);
});

it('追加カードの増幅は時間またはパート期限で解除する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const timed = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 10_000n,
      target: { kind: 'all' },
      duration: { kind: 'milliseconds', value: 500n },
    },
    source,
  );
  expect(advanceTo(timed, 0.6).tokenBoosts).toHaveLength(0);
  const section = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 10_000n,
      target: { kind: 'all' },
      duration: { kind: 'sections', value: 1n },
    },
    source,
  );
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
      num: 1_000_000n,
      target: { kind: 'card-series', seriesId: 7 },
      uses: 1n,
    },
    source,
  );
  const generated = requestTokens(boosted, 'story', 2, source.id);
  expect(generated.deck.filter((card) => card.token === 'story')).toHaveLength(4);
  expect(generated.tokenBoosts).toHaveLength(0);
});

it('ActionType28はMasterからTokenCardを生成し、系列情報を保持する', () => {
  const initial = game('library');
  const generated = applyEffect(initial, tokenCardEffect(481, 2n, [42n], 2), undefined);
  const added = generated.deck.filter((card) => card.id.startsWith('token-card-positive-481-'));
  expect(added).toHaveLength(2);
  expect(added.every((card) => card.style === 2)).toBe(true);
  expect(added.every((card) => card.tokenCard && card.performer === null)).toBe(true);
});

it('ActionType28のlong枚数は通常生成でfloat32化し、一斉生成ではint32化する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('カードがありません。');
  const state = {
    ...initial,
    deck: [source],
    cardPool: [source],
    drawPile: [source.id],
    hand: [],
    tokenCatalog: [],
    tokenGroups: [],
  };
  const count = (1n << 32n) + 1n;
  const ordinary = applyEffect(state, tokenCardEffect(481, count), source);
  expect(ordinary.deck).toHaveLength(1);

  const grouped = finishTokenGeneration(
    applyEffect(beginTokenGeneration(state, source.id), tokenCardEffect(481, count), source),
    source.id,
  ).state;
  expect(grouped.deck).toHaveLength(2);
});

it('ActionType28はActionType52を消費せず、生成数を変えない', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
      skillTokenSeriesIds: [42n],
    },
    source,
  );
  const generated = applyEffect(boosted, tokenCardEffect(481, 2n, [42n]), source);
  expect(generated.deck.filter((card) => card.tokenCard)).toHaveLength(2);
  expect(generated.action52Buffs).toHaveLength(1);
});

it('ActionType28は同一スキル内で指定カードを増幅後に交互追加する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 10_000n,
      target: { kind: 'member', member: source.member },
      seriesIds: [42n],
      uses: 1n,
    },
    source,
  );
  let state = beginTokenGeneration(boosted, source.id);
  state = applyEffect(state, tokenCardEffect(481, 2n, [42n]), source);
  state = finishTokenGeneration(state, source.id).state;
  expect(state.deck.filter((card) => card.id.startsWith('token-card-positive-481-'))).toHaveLength(
    2,
  );
  expect(state.tokenBoosts).toHaveLength(0);
});

it('ActionType28は各加算バフ後にfloat32へ戻す', () => {
  const initial = game('library');
  const tokenBoosts = [1, 2].map(() => ({
    calculation: 'add' as const,
    value: 1,
    target: { kind: 'all' as const },
    remainingUses: null,
    remainingSeconds: null,
    remainingSections: null,
    deactivationKey: null,
  }));
  const state = { ...initial, tokenBoosts };
  const result = boostTokenRequests(
    state,
    [{ template: { kind: 'token-id', token: 'story' }, count: 16_777_216 }],
    null,
    false,
  );
  expect(result.counts).toEqual([16_777_216]);
});

it('ActionType38は登録時にActionType52を適用し、DeactivatorとInvocationTypeを反映する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const skillBoost = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const effect = {
    kind: 'token-boost',
    calculation: 'add',
    num: 500_000n,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500n },
    invocationType: 0x388,
    deactivationKey: 'token-boost',
  } as const;
  const active = applyEffect(skillBoost, effect, source);
  expect(active.tokenBoosts[0]?.value).toBe(75);
  expect(active.action52Buffs).toHaveLength(0);
  expect(advanceTo(active, 0.6).tokenBoosts).toHaveLength(1);
  expect(
    act(active, { type: 'deactivate-token-boost', deactivationKey: 'token-boost' }).tokenBoosts,
  ).toHaveLength(0);
});

it('ActionType38は詳細値をint32へ変換し、0以下なら登録しない', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const effect = {
    kind: 'token-boost',
    calculation: 'add',
    target: { kind: 'all' },
  } as const;
  const wrapped = applyEffect(initial, { ...effect, num: 2_147_483_648n }, source);
  const zero = applyEffect(initial, { ...effect, num: 0n }, source);
  expect(wrapped.tokenBoosts).toHaveLength(0);
  expect(zero.tokenBoosts).toHaveLength(0);
});

it('ActionType38はlong詳細値をfloat32へ変換してからNumToValueを適用する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const wrapped = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 2_147_483_648n,
      target: { kind: 'all' },
    },
    source,
  );
  expect(wrapped.tokenBoosts).toHaveLength(0);

  const float32Value = applyEffect(
    initial,
    {
      kind: 'token-boost',
      calculation: 'add',
      num: 16_777_217n,
      target: { kind: 'all' },
    },
    source,
  );
  expect(float32Value.tokenBoosts[0]?.value).toBe(
    Math.fround(Math.fround(16_777_216) / Math.fround(10_000)),
  );
});
