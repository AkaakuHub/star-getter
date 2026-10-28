import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { describe, expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { addHearts, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { canUseCard } from '@akaakuhub/suku-sute-core/game/projection';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game(limit?: number) {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7, limit, routes.genesis.tokens), {
    type: 'start',
  });
}

function play(limit: number) {
  let state = game(limit);
  for (let tick = 1; tick <= 3600; tick++) {
    state = advanceTo(state, tick / 60);
    if (tick % 30 === 0) {
      const index = liveCurrentHandCardInstanceIds(state).findIndex(
        (id, slot) => Boolean(id) && canUseCard(state, slot),
      );
      if (index >= 0) state = act(state, { type: 'card', index });
    }
    if (tick % 20 === 0) state = act(state, { type: 'collect' });
  }
  return {
    score: state.score,
    stats: state.stats,
    hand: liveCurrentHandCardInstanceIds(state),
    deckBoard: state.deckBoard,
    randomSeed: state.randomSeed,
  };
}

describe('きらめきの表示上限', () => {
  it('既定は100個で、表示上限を減らしても論理上の個数は減らさない', () => {
    expect(game().hearts.showLimit).toBe(100);
    for (let limit = 10; limit <= 100; limit += 10) {
      const initial = game(limit);
      const state = addHearts(
        { ...initial, hearts: { ...initial.hearts, stageHearts: [], hiddenHeartBatches: [] } },
        100,
      );
      expect(heartCount(state)).toBe(100);
      expect(state.hearts.stageHearts).toHaveLength(limit);
      expect(state.hearts.hiddenHeartBatches.reduce((sum, batch) => sum + batch.count, 0)).toBe(
        100 - limit,
      );
    }
  });

  it('10個・50個・100個の描画設定で得点・特性・カード循環が一致する', () => {
    const full = play(100);
    expect(play(10)).toEqual(full);
    expect(play(50)).toEqual(full);
  }, 15_000);
});
