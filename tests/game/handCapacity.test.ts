import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { fillHand, handCapacity } from '../../src/domain/game/cards/drawing';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
}

it('手札上限を増やすと8枚まで補充し、パート終了時に5枚へ戻す', () => {
  const expanded = fillHand(applyEffect(game(), { kind: 'hand-limit', amount: 3 }));
  expect(handCapacity(expanded)).toBe(8);
  expect(expanded.hand).toHaveLength(8);
  const nextSection = expanded.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const nextPart = advanceTo(expanded, (nextSection.startBeat * 60) / expanded.track.bpm);
  expect(handCapacity(nextPart)).toBe(5);
  expect(nextPart.hand).toHaveLength(5);
});

it('手札枚数変更の小数値を0方向へ切り捨てる', () => {
  const next = applyEffect(game(), { kind: 'hand-limit', amount: 1.9 });
  expect(next.handLimit).toBe(6);
});

it('手札内の減少効果を合算してから、上限を3〜8枚に制限する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('カードがありません。');
  const compressed = {
    ...state,
    hand: [card.id],
    drawPile: state.deck.filter((item) => item.id !== card.id).map((item) => item.id),
    discard: [],
    deck: state.deck.map((item) =>
      item.id === card.id ? { ...item, passive: { heartsPercent: 100, handLimitDelta: -3 } } : item,
    ),
  };
  expect(handCapacity(compressed)).toBe(3);
  expect(fillHand(compressed).hand).toHaveLength(3);
  expect(handCapacity({ ...compressed, handLimit: 11 })).toBe(8);
});
