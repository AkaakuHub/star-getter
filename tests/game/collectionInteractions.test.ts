import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { beatHeartCount } from '../../src/domain/game/beat';
import { fillHand, shuffleHand } from '../../src/domain/game/cards/drawing';
import { addTokens } from '../../src/domain/game/cards/tokens';
import { addHearts, heartCount } from '../../src/domain/game/hearts';
import type { GameState } from '../../src/domain/game/model';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(route: 'library' | 'bloom'): GameState {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes[route].deck, 7, 10, routes[route].tokens), {
    type: 'start',
  });
}

it('手札の回収条件は複数回の合計で成立し、自動回収の0.3秒を手動操作へ適用しない', () => {
  const initial = game('bloom');
  let state: GameState = {
    ...initial,
    hand: ['spark'],
    hearts: { ...initial.hearts, heartLimit: 10_000 },
  };
  state = act(addHearts(state, 2_999), { type: 'collect' });
  expect(heartCount(state)).toBe(0);
  expect(state.handHeartCollectCounts.spark).toBe(2_999);
  state = act(addHearts(state, 1), { type: 'collect' });
  expect(state.tick).toBe(0);
  expect(heartCount(state)).toBeGreaterThanOrEqual(3_000);
  expect(state.relayUsed).toContain('spark');
  const repeated = act(state, { type: 'collect' });
  expect(repeated.tick).toBe(0);
  expect(repeated.score).toBeGreaterThan(state.score);
  expect(heartCount(repeated)).toBe(0);
});

it('一度の回収で条件を大きく超えても1回だけ発動し、引き直すと回収条件が復帰する', () => {
  const initial = game('bloom');
  let state: GameState = {
    ...initial,
    hand: ['spark'],
    hearts: { ...initial.hearts, heartLimit: 10_000 },
  };
  state = act(addHearts(state, 9_000), { type: 'collect' });
  expect(state.handHeartCollectCounts.spark).toBe(0);
  state = act(state, { type: 'collect' });
  expect(heartCount(state)).toBe(0);
  const redrawn = fillHand({
    ...shuffleHand(state),
    drawPile: ['spark', ...state.deck.map((card) => card.id).filter((id) => id !== 'spark')],
  });
  expect(redrawn.hand).toContain('spark');
  expect(redrawn.relayUsed).not.toContain('spark');
  expect(heartCount(act(addHearts(redrawn, 3_000), { type: 'collect' }))).toBeGreaterThan(0);
});

function preparedLibrary(): GameState {
  let state = game('library');
  state = addTokens(state, 'story', 30);
  state = addTokens(state, 'story', 30);
  state = addTokens(state, 'bookmark', 30);
  state = addTokens(state, 'clock', 1);
  const bookmark = state.deck.find((card) => card.token === 'bookmark');
  const stories = state.deck.filter((card) => card.token === 'story').slice(0, 4);
  if (!bookmark) throw new Error('追加カードがありません。');
  const hand = [bookmark.id, ...stories.map((card) => card.id)];
  return addHearts(
    {
      ...state,
      hand,
      drawPile: state.deck.map((card) => card.id).filter((id) => !hand.includes(id)),
      discard: [],
      storyAmplification: 10_000,
      hearts: { ...state.hearts, heartLimit: 10_000_000 },
    },
    500_000,
  );
}

it('書架は累積50万回収から引き直し、ドロー時のきらめきを同じ時刻の次のタッチで回収する', () => {
  let state = preparedLibrary();
  state = act(state, { type: 'collect' });
  expect(state.tick).toBe(0);
  expect(state.handHeartCollectCounts[state.hand[0] ?? '']).toBe(0);
  expect(heartCount(state)).toBeGreaterThan(500_000);
  const next = act(state, { type: 'collect' });
  expect(next.tick).toBe(state.tick);
  expect(next.score).toBeGreaterThan(state.score);
  expect(next.stats.heartsCollected).toBeGreaterThan(state.stats.heartsCollected);
  expect(next.stats.cardsUsed).toBe(0);
});

it('仕込んだ書架では手動連打の回収回数が0.3秒間隔の自動回収を上回る', () => {
  const initial = preparedLibrary();
  let manual = initial;
  for (let tap = 0; tap < 3; tap++) manual = act(manual, { type: 'collect' });
  const automatic = advanceTo(initial, 0.3);
  expect(manual.stats.heartsCollected).toBeGreaterThan(automatic.stats.heartsCollected);
  expect(manual.score).toBeGreaterThan(automatic.score);
  expect(manual.tick).toBe(0);
});

for (const mood of [-100, 0, 100]) {
  it(`開花の回収特性は空模様${mood}%に応じて3000〜3750回分のきらめきを獲得する`, () => {
    const initial = game('bloom');
    const state = {
      ...initial,
      track: {
        ...initial.track,
        sections: initial.track.sections.map((section) => ({ ...section, moodValue: mood })),
      },
      hand: ['spark'],
      hearts: { ...initial.hearts, heartLimit: 1_000_000 },
    };
    const collected = act(addHearts(state, 3_000), { type: 'collect' });
    expect(heartCount(collected)).toBe(beatHeartCount(state) * (mood === 0 ? 3_000 : 3_750));
  });
}
