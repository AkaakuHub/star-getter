import { expect, it } from 'vite-plus/test';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { canUseSpecial, specialCards } from '@akaakuhub/suku-sute-core/game/special';
import { game, withHand } from './support/game';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { cardCooldownTicks } from '@akaakuhub/suku-sute-core/game/projection';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';

it('空模様0でも20APを支払って開花し、支払後のAPを保持する', () => {
  const state = { ...game(), currentAp: 20, maxAp: 20 };
  expect(canUseSpecial(state, 'horizon')).toBe(true);
  const next = act(state, { type: 'special', cardId: 'horizon' });
  expect(next.currentAp).toBe(0);
  expect(next.genesis.rollback?.currentAp).toBe(0);
  expect(next.specialUsed).toContain('horizon');
});

it('開花中の追加SPは通常APを固定したまま専用値で支払う', () => {
  const state = activateGenesis(
    {
      ...game(),
      currentAp: 0,
      currentVoltage: 655_000_001,
      mental: { ...game().mental, currentMental: 80 },
    },
    3.5,
  );
  expect(state.genesis.currentGauge).toBe(5020);
  expect(canUseSpecial(state, 'library-ensemble')).toBe(true);
  const next = act(state, { type: 'special', cardId: 'library-ensemble' });
  expect(next.currentAp).toBe(0);
  expect(next.genesis.currentGauge).toBe(4977);
});

it('共鳴はセンターの通常効果と基本カードの追加効果だけを選択する', () => {
  expect(specialCards(game('library')).map((card) => card.id)).toEqual([
    'library-pages',
    'library-ensemble',
  ]);
  expect(specialCards(game()).map((card) => card.id)).toEqual([
    'horizon',
    'library-ensemble',
    'frost-pulse',
  ]);
});

it('初回の共鳴で30枚を生成し、追加の共鳴で上限を10増やして通常の共鳴を復帰させる', () => {
  const initial = { ...game('library'), currentAp: 10 };
  const prepared = act(initial, { type: 'special', cardId: 'library-pages' });
  expect(prepared.currentAp).toBe(7);
  expect(prepared.hand).toHaveLength(8);
  expect(prepared.deck).toHaveLength(36);
  expect(act(prepared, { type: 'special', cardId: 'library-pages' })).toBe(prepared);
  const extended = act(prepared, { type: 'special', cardId: 'library-ensemble' });
  expect(extended.currentAp).toBe(4);
  expect(extended.maxAp).toBe(initial.maxAp + 10);
  expect(extended.deck).toHaveLength(36);
  expect(extended.specialUsed).toEqual(['library-ensemble']);
  expect(canUseSpecial(extended, 'library-pages')).toBe(true);
  expect(act(extended, { type: 'special', cardId: 'library-ensemble' })).toBe(extended);
});

it('停止中も性能画面で使用条件を確認できるが、使用操作は進行中だけ受け付ける', () => {
  const paused = act({ ...game('library'), currentAp: 10 }, { type: 'pause' });
  expect(canUseSpecial(paused, 'library-pages')).toBe(true);
  expect(act(paused, { type: 'special', cardId: 'library-pages' })).toBe(paused);
  expect(canUseSpecial({ ...paused, currentAp: 2 }, 'library-pages')).toBe(false);
});

it('3回使用で通常の共鳴を戻して除外し、追加の共鳴は使用済みのまま維持する', () => {
  let state: GameState = { ...game('library'), specialUsed: ['library-pages', 'library-ensemble'] };
  for (let count = 1; count <= 3; count++) {
    state = withHand({ ...state, currentAp: 20, tick: state.tick + cardCooldownTicks(state) }, [
      'class',
    ]);
    state = act(state, { type: 'card', index: 0 });
    expect(state.cardUseCounts.class).toBe(count);
    expect(state.deck.some((card) => card.id === 'class')).toBe(count < 3);
    expect(state.specialUsed).toEqual(
      count < 3 ? ['library-pages', 'library-ensemble'] : ['library-ensemble'],
    );
  }
  expect([...state.hand, ...state.drawPile, ...state.discard]).not.toContain('class');
});

it('共鳴の再使用は種別・メンバーを絞り、追加共鳴とトークン共鳴を区別する', () => {
  const initial = game('library');
  const normal = initial.deck.find((card) => card.id === 'library-pages');
  const extra = initial.deck.find((card) => card.id === 'library-ensemble');
  if (!normal?.special || !extra?.special) throw new Error('共鳴カードがありません。');
  const otherExtra: Card = {
    ...extra,
    id: 'extra-other-member',
    member: 1041,
    unit: 2,
  };
  const tokenSpecial: Card = { ...normal, id: 'token-special', token: 'story' };
  const deck = [...initial.deck, otherExtra, tokenSpecial];
  const state = {
    ...initial,
    deck,
    cardPool: deck,
    specialUsed: [normal.id, extra.id, otherExtra.id, tokenSpecial.id],
  };
  const next = applyEffect(
    state,
    { kind: 'reset-special', scope: 'extra', target: { kind: 'member', member: 1021 } },
    initial.deck.find((card) => card.id === 'library-invitation'),
  );
  expect(next.specialUsed).toEqual([normal.id, otherExtra.id, tokenSpecial.id]);
});

it('全ての共鳴を戻すときも先頭以外の通常共鳴を対象に含めない', () => {
  const initial = game('library');
  const normal = initial.deck.find((card) => card.id === 'library-pages');
  const extra = initial.deck.find((card) => card.id === 'library-ensemble');
  if (!normal?.special || !extra?.special) throw new Error('共鳴カードがありません。');
  const otherNormal: Card = { ...normal, id: 'normal-other-member', member: 1041, unit: 2 };
  const deck = [...initial.deck, otherNormal];
  const state = {
    ...initial,
    deck,
    cardPool: deck,
    specialUsed: [normal.id, extra.id, otherNormal.id],
  };
  const next = applyEffect(
    state,
    { kind: 'reset-special', scope: 'all', target: { kind: 'all' } },
    initial.deck.find((card) => card.id === 'library-invitation'),
  );
  expect(next.specialUsed).toEqual([otherNormal.id]);
});

it('共鳴を使ったカード自身は再使用対象から除き、他の対象共鳴を戻す', () => {
  const initial = game('library');
  const deck = initial.deck;
  const state = {
    ...initial,
    currentSkillType: 1,
    specialUsed: ['library-pages', 'library-ensemble'],
  };
  const source = deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const next = applyEffect(
    state,
    { kind: 'reset-special', scope: 'all', target: { kind: 'all' } },
    source,
  );
  expect(next.specialUsed).toEqual(['library-pages']);
});

it('通常スキルからの共鳴再使用では発動元カード自身も対象にする', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.id === 'library-pages');
  if (!source) throw new Error('発動元カードがありません。');
  const state = {
    ...initial,
    currentSkillType: 2,
    specialUsed: ['library-pages'],
  };

  const next = applyEffect(
    state,
    { kind: 'reset-special', scope: 'all', target: { kind: 'source' } },
    source,
  );

  expect(next.specialUsed).toEqual([]);
});

it('共鳴の再使用はユニットと発動元以外の対象を適用する', () => {
  const initial = game('library');
  const normal = initial.deck.find((card) => card.id === 'library-pages');
  const extra = initial.deck.find((card) => card.id === 'library-ensemble');
  if (!normal?.special || !extra?.special) throw new Error('共鳴カードがありません。');
  const otherExtra: Card = { ...extra, id: 'extra-other-member', member: 1041, unit: 2 };
  const deck = [...initial.deck, otherExtra];
  const state = {
    ...initial,
    deck,
    cardPool: deck,
    specialUsed: [normal.id, extra.id, otherExtra.id],
  };
  const unitReset = applyEffect(
    state,
    { kind: 'reset-special', scope: 'all', target: { kind: 'unit', unit: 1 } },
    initial.deck.find((card) => card.id === 'library-invitation'),
  );
  expect(unitReset.specialUsed).toEqual([otherExtra.id]);

  const otherReset = applyEffect(
    state,
    { kind: 'reset-special', scope: 'all', target: { kind: 'others' } },
    normal,
  );
  expect(otherReset.specialUsed).toEqual([normal.id]);
});
