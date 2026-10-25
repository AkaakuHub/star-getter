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
