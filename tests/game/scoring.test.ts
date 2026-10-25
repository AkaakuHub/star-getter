import { describe, expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { addHearts, advanceHearts, heartCount } from '../../src/domain/game/hearts';
import { type GameState } from '../../src/domain/game/model';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(): GameState {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const state = act(createGame(track, routes.bloom.deck, 456, 100, routes.bloom.tokens), {
    type: 'start',
  });
  return {
    ...state,
    relayUsed: [...state.hand],
    hearts: { ...state.hearts, stageHearts: [], hiddenHeartBatches: [] },
  };
}

describe('きらめきと得点', () => {
  it('回収すると得点を得て、同じきらめきを二重回収しない', () => {
    const state = addHearts(game(), 10);
    const collected = act(state, { type: 'collect' });
    expect(collected.score).toBeGreaterThan(0);
    expect(collected.stats.heartsCollected).toBe(10);
    expect(heartCount(collected)).toBe(0);
    expect(act(collected, { type: 'collect' })).toBe(collected);
  });

  it('時間切れの回収は基礎得点の20%になる', () => {
    const state = { ...addHearts(game(), 1), resting: true, stamina: 0, excitement: 100 };
    const normal = act(state, { type: 'collect' });
    let expired = state;
    for (let tick = 1; tick <= 600; tick++) expired = advanceHearts({ ...expired, tick });
    expect(expired.stats.heartsMissed).toBe(1);
    expect(expired.stats.heartsCollected).toBe(0);
    expect(expired.score).toBe(normal.score / 5n);
  });

  it('上限を超えた追加分だけが失効し、既存のきらめきを保持する', () => {
    const state = addHearts(addHearts(game(), 95), 12);
    expect(heartCount(state)).toBe(100);
    expect(state.hearts.stageHearts[0]?.spawnElapsedSeconds).toBe(0);
    expect(state.stats.heartsMissed).toBe(7);
  });

  it('得点増加の効果が切れると倍率が戻る', () => {
    const base = game();
    const normal = act(addHearts(base, 10), { type: 'collect' });
    const boosted = { ...base, boosts: [{ percent: 100, untilTick: 60 }] };
    expect(act(addHearts(boosted, 10), { type: 'collect' }).score).toBe(normal.score * 2n);
    const expired = advanceTo(boosted, 1);
    expect(expired.boosts).toHaveLength(0);
    const unboosted = advanceTo(base, 1);
    expect(act(addHearts(expired, 10), { type: 'collect' }).score).toBe(
      act(addHearts(unboosted, 10), { type: 'collect' }).score,
    );
  });
});
