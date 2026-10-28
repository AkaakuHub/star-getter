import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { beatHeartCount } from '@akaakuhub/suku-sute-core/game/beat';
import { advanceHandCollectionAbilities } from '@akaakuhub/suku-sute-core/game/cards/collectionAbilities';
import { fillHand, shuffleHand } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { disposeHandEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { addHearts, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game(route: 'library' | 'genesis'): GameState {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes[route].deck, 7, 10, routes[route].tokens), {
    type: 'start',
  });
}

it('手札の回収条件は複数回の合計で成立し、自動回収の0.3秒を手動操作へ適用しない', () => {
  const initial = game('genesis');
  let state: GameState = withBoardState(
    {
      ...initial,
      handEffectCardIds: ['horizon'],
      hearts: { ...initial.hearts, stageHearts: [], hiddenHeartBatches: [], heartLimit: 10_000 },
    },
    { hand: ['horizon'] },
  );
  state = act(addHearts(state, 2_999), { type: 'collect' });
  expect(heartCount(state)).toBe(0);
  expect(state.handHeartCollectCounts.horizon).toBe(2_999);
  state = act(addHearts(state, 1), { type: 'collect' });
  expect(state.tick).toBe(0);
  expect(heartCount(state)).toBeGreaterThanOrEqual(3_000);
  expect(state.relayUsed).toContain('horizon');
  const repeated = act(state, { type: 'collect' });
  expect(repeated.tick).toBe(0);
  expect(repeated.score).toBeGreaterThan(state.score);
  expect(heartCount(repeated)).toBe(0);
});

it('一度の回収で条件を大きく超えても1回だけ発動し、引き直すと回収条件が復帰する', () => {
  const initial = game('genesis');
  let state: GameState = withBoardState(
    {
      ...initial,
      handEffectCardIds: ['horizon'],
      hearts: { ...initial.hearts, stageHearts: [], hiddenHeartBatches: [], heartLimit: 10_000 },
    },
    { hand: ['horizon'] },
  );
  state = act(addHearts(state, 9_000), { type: 'collect' });
  expect(state.handHeartCollectCounts.horizon).toBe(0);
  state = act(state, { type: 'collect' });
  expect(heartCount(state)).toBe(0);
  const redrawn = fillHand(
    withBoardState(
      { ...shuffleHand(state, { recoverDiscard: true, destination: 'draw' }) },
      {
        deck: [
          'horizon',
          ...state.deck.map((card) => card.cardInstanceId).filter((id) => id !== 'horizon'),
        ],
      },
    ),
  );
  expect(redrawn.hand).toContain('horizon');
  expect(redrawn.relayUsed).not.toContain('horizon');
  expect(heartCount(act(addHearts(redrawn, 3_000), { type: 'collect' }))).toBeGreaterThan(0);
});

it('手札誘発は回収条件を超えるたびに発動し、指定回数で止まる', () => {
  const initial = game('genesis');
  const original = initial.deck.find((item) => !item.relay);
  if (!original) throw new Error('カードがありません。');
  const card = {
    ...original,
    collectionEffects: {
      threshold: 10,
      limit: 2,
      effects: [{ kind: 'ap' as const, amount: 1 }],
    },
  };
  const state: GameState = withBoardState(
    {
      ...initial,
      deck: initial.deck.map((item) => (item.cardInstanceId === card.cardInstanceId ? card : item)),
      handHeartCollectCounts: { [card.cardInstanceId]: 0 },
    },
    { hand: [card.cardInstanceId] },
  );
  const first = advanceHandCollectionAbilities(state, 10);
  expect(first.activated.map((item) => item.cardInstanceId)).toEqual([card.cardInstanceId]);
  const second = advanceHandCollectionAbilities(first.state, 10);
  expect(second.activated.map((item) => item.cardInstanceId)).toEqual([card.cardInstanceId]);
  const third = advanceHandCollectionAbilities(second.state, 10);
  expect(third.activated).toHaveLength(0);
  expect(second.state.handCollectionActivationCounts[card.cardInstanceId]).toBe(2);
});

it('手札誘発の回数は離脱時に初期化し、記憶指定時は保持する', () => {
  const initial = game('genesis');
  const original = initial.deck[0];
  if (!original) throw new Error('カードがありません。');
  const resetCard = {
    ...original,
    collectionEffects: { threshold: 10, effects: [{ kind: 'ap' as const, amount: 1 }] },
  };
  const retainCard = {
    ...original,
    collectionEffects: {
      threshold: 10,
      limitMemory: 'retain' as const,
      effects: [{ kind: 'ap' as const, amount: 1 }],
    },
  };
  const state = {
    ...initial,
    deck: [
      resetCard,
      { ...retainCard, cardInstanceId: `${retainCard.cardInstanceId}-retain` },
      ...initial.deck.slice(1),
    ],
    handCollectionActivationCounts: {
      [resetCard.cardInstanceId]: 1,
      [`${retainCard.cardInstanceId}-retain`]: 2,
    },
  };
  const next = disposeHandEffects(state, [
    resetCard.cardInstanceId,
    `${retainCard.cardInstanceId}-retain`,
  ]);
  expect(next.handCollectionActivationCounts).toEqual({
    [`${retainCard.cardInstanceId}-retain`]: 2,
  });
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
  const hand = [bookmark.cardInstanceId, ...stories.map((card) => card.cardInstanceId)];
  return addHearts(
    withBoardState(
      {
        ...state,
        hand,
        handEffectCardIds: hand,
        storyAmplification: 10_000,
        hearts: { ...state.hearts, heartLimit: 10_000_000 },
      },
      {
        deck: state.deck.map((card) => card.cardInstanceId).filter((id) => !hand.includes(id)),
        graveyard: [],
      },
    ),
    500_000,
  );
}

it('うなばらは累積50万回収から引き直し、ドロー時のきらめきを同じ時刻の次のタッチで回収する', () => {
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

it('上限1000万でも回収49万9999個では引き直さず、累計50万個で残りの山札から引く', () => {
  const prepared = preparedLibrary();
  const initial = {
    ...prepared,
    hearts: { ...prepared.hearts, stageHearts: [], hiddenHeartBatches: [] },
  };
  const below = act(addHearts(initial, 499_999), { type: 'collect' });
  expect(below.hand).toEqual(initial.hand);
  for (const id of initial.hand) expect(below.handHeartCollectCounts[id]).toBe(499_999);
  const reached = act(addHearts(below, 1), { type: 'collect' });
  expect(reached.stats.heartsCollected).toBe(500_000);
  expect(reached.hand.every((id) => !initial.hand.includes(id))).toBe(true);
  for (const id of initial.hand)
    expect(boardCardIds(reached, liveBoardState.graveyard)).toContain(id);
  expect(reached.hearts.heartLimit).toBe(10_000_000);
});

it('1000万個を一度に回収しても50万個以上の条件が成立して引き直す', () => {
  const initial = preparedLibrary();
  const reached = act(addHearts(initial, 10_000_000), { type: 'collect' });
  expect(reached.stats.heartsCollected).toBe(10_000_000);
  expect(reached.hand.every((id) => !initial.hand.includes(id))).toBe(true);
  for (const id of initial.hand)
    expect(boardCardIds(reached, liveBoardState.graveyard)).toContain(id);
});

it('94枚では回収50万個を満たしても供給も引き直しも発動しない', () => {
  const prepared = preparedLibrary();
  const removed = boardCardIds(prepared, liveBoardState.deck).slice(0, prepared.deck.length - 94);
  const initial = withBoardState(
    { ...prepared, deck: prepared.deck.filter((card) => !removed.includes(card.cardInstanceId)) },
    { deck: boardCardIds(prepared, liveBoardState.deck).filter((id) => !removed.includes(id)) },
  );
  expect(initial.deck).toHaveLength(94);
  const reached = act(initial, { type: 'collect' });
  expect(reached.hand).toEqual(initial.hand);
  expect(heartCount(reached)).toBe(0);
});

it('仕込んだうなばらでは手動連打の回収回数が0.3秒間隔の自動回収を上回る', () => {
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
    const initial = game('genesis');
    const state = withBoardState(
      {
        ...initial,
        track: {
          ...initial.track,
          moodKeys: [{ songTimeSeconds: 0, keyValue: mood }],
        },
        handEffectCardIds: ['horizon'],
        hearts: {
          ...initial.hearts,
          stageHearts: [],
          hiddenHeartBatches: [],
          heartLimit: 1_000_000,
        },
      },
      { hand: ['horizon'] },
    );
    const collected = act(addHearts(state, 3_000), { type: 'collect' });
    expect(heartCount(collected)).toBe(beatHeartCount(state) * (mood === 0 ? 3_000 : 3_750));
  });
}
