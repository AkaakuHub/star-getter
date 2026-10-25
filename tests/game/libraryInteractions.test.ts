import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { applyEffect, skillValue } from '../../src/domain/game/effects';
import { applyDrawAbility } from '../../src/domain/game/cards/drawAbilities';
import { cardCost } from '../../src/domain/game/cards/cost';
import type { Card, GameState } from '../../src/domain/game/model';
import { moodValue } from '../../src/domain/game/projection';
import { collectionScore } from '../../src/domain/game/scoring';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.library.deck, 7, 10, routes.library.tokens), {
    type: 'start',
  });
}

function token(state: GameState, kind: Card['token']): Card {
  const card = state.deck.find((item) => item.token === kind);
  if (!card) throw new Error('追加カードがありません。');
  return card;
}

function generated(): GameState {
  let state = applyEffect(game(), { kind: 'tokens', token: 'clock', count: 1 });
  state = applyEffect(state, { kind: 'tokens', token: 'story', count: 1 });
  const clock = token(state, 'clock');
  const story = token(state, 'story');
  const hand = [clock.id, story.id, 'halo', 'orbit', 'ember'];
  return {
    ...state,
    hand,
    drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
    discard: [],
  };
}

it('同じ2枚でも、空模様を変えてから使ったときだけ晴れ100%の追加効果を得る', () => {
  const initial = generated();
  const clock = token(initial, 'clock');
  const story = token(initial, 'story');
  const play = (first: Card, second: Card) => {
    let state = act(initial, { type: 'card', index: initial.hand.indexOf(first.id) });
    state = advanceTo(state, 0.2);
    return act(state, { type: 'card', index: state.hand.indexOf(second.id) });
  };
  const prepared = play(clock, story);
  const reversed = play(story, clock);
  expect(prepared.stats.cardsUsed).toBe(2);
  expect(reversed.stats.cardsUsed).toBe(2);
  expect(moodValue(prepared)).toBe(100);
  expect(prepared.hearts.heartLimit).toBe(496);
  expect(reversed.hearts.heartLimit).toBe(136);
  expect(prepared.boosts.reduce((sum, boost) => sum + boost.percent, 0)).toBe(4950);
  expect(reversed.boosts.reduce((sum, boost) => sum + boost.percent, 0)).toBe(375);
  expect(collectionScore(prepared, 100, false)).toBeGreaterThan(
    collectionScore(reversed, 100, false) * 5n,
  );
});

it('80枚のドロー能力は生成カードだけを増幅し、全体の増幅にはしない', () => {
  let state = generated();
  for (const count of [30, 30, 9])
    state = applyEffect(state, { kind: 'tokens', token: 'story', count });
  expect(state.deck).toHaveLength(80);
  const clock = token(state, 'clock');
  const story = token(state, 'story');
  state = { ...state, hand: [clock.id] };
  const drawn = applyDrawAbility(state, clock);
  expect(drawn.apIntervalFactor).toBe(0.5);
  expect(drawn.storyAmplification).toBe(1251.25);
  expect(drawn.amplification).toBe(state.amplification);
  const effect = { kind: 'hearts', amount: 10 } as const;
  expect(skillValue(drawn, 10, effect, clock)).toBe(skillValue(state, 10, effect, clock));
  expect(skillValue(drawn, 10, effect, story)).toBeGreaterThan(
    skillValue(state, 10, effect, story) * 10,
  );
});

it('山札を育ててから招待状を引くと、対応カードの消費量が減少する', () => {
  let state = generated();
  for (const count of [30, 30, 9])
    state = applyEffect(state, { kind: 'tokens', token: 'story', count });
  const invitation = state.deck.find((card) => card.id === 'halo');
  const other = state.deck.find((card) => card.id === 'prism');
  if (!invitation || !other) throw new Error('基本カードがありません。');
  const story = token(state, 'story');
  expect(cardCost(state, story)).toBe(5);
  const drawn = applyDrawAbility(state, invitation);
  expect(cardCost(drawn, story)).toBe(1);
  expect(cardCost(drawn, other)).toBe(cardCost(state, other));
});

it('しおりの回復は使用時ではなく引いたときに発生し、引き直しても発動する', () => {
  let state = applyEffect(game(), { kind: 'tokens', token: 'bookmark', count: 1 });
  const bookmark = token(state, 'bookmark');
  state = { ...state, energy: 0 };
  const first = applyDrawAbility(state, bookmark);
  const second = applyDrawAbility(first, bookmark);
  expect(first.energy).toBe(1);
  expect(second.energy).toBe(2);
});

for (const count of [79, 80]) {
  it(`共演は編成${count}枚で一斉使用し、80枚以上のときだけ追加カード3種類を3枚ずつ生成する`, () => {
    let state = addTokens(game(), 'ensemble', 1);
    for (const amount of [30, 30, count - 70]) state = addTokens(state, 'story', amount);
    expect(state.deck).toHaveLength(count);
    const ensemble = token(state, 'ensemble');
    const hand = [ensemble.id, 'orbit', 'ember', 'prism', 'flare'];
    state = {
      ...state,
      hand,
      drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
      discard: [],
      costReductions: Object.fromEntries(state.deck.map((card) => [card.id, 100])),
    };
    const stories = state.deck.filter((card) => card.token === 'story').length;
    const used = act(state, { type: 'card', index: 0 });
    expect(used.stats.cardsUsed).toBe(5);
    expect(used.deck.some((card) => card.id === ensemble.id)).toBe(true);
    expect(used.discard).toContain(ensemble.id);
    expect(used.deck.filter((card) => card.token === 'story')).toHaveLength(
      stories + (count === 80 ? 3 : 0),
    );
    expect(used.deck.filter((card) => card.token === 'clock')).toHaveLength(count === 80 ? 3 : 0);
    expect(used.deck.filter((card) => card.token === 'bookmark')).toHaveLength(
      count === 80 ? 3 : 0,
    );
  });
}

it('花のページ・時計・しおりは使用後に除外し、同じ追加カードを山札へ再循環させない', () => {
  for (const kind of ['story', 'clock', 'bookmark'] as const) {
    let state = addTokens(game(), kind, 1);
    const source = token(state, kind);
    const hand = [source.id, 'orbit', 'ember', 'prism', 'flare'];
    state = {
      ...state,
      hand,
      drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
    };
    const used = act(state, { type: 'card', index: 0 });
    expect(used.stats.cardsUsed).toBe(1);
    expect(used.deck.some((card) => card.id === source.id)).toBe(false);
    expect([...used.hand, ...used.drawPile, ...used.discard]).not.toContain(source.id);
  }
});
