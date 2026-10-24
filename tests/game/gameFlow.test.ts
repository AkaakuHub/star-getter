import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import type { GameState, Track } from '../../src/domain/game/model';
import { canUseCard, cardAt, durationSeconds } from '../../src/domain/game/projection';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(): GameState {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, resolveDeck(defaultDeckIds), 12625), { type: 'start' });
}

describe('ライブの進行', () => {
  it('描画の間隔にかかわらず同じゲーム時刻で同じ状態になる', () => {
    const initial = game();
    let frequent = initial;
    for (let frame = 1; frame <= 600; frame++) frequent = advanceTo(frequent, frame / 60);
    expect(frequent).toEqual(advanceTo(initial, 10));
    expect(frequent.hearts.length).toBeGreaterThan(0);
    expect(frequent.stamina).toBeLessThan(100);
  });

  it('開始前と一時停止中は時刻も資源も進めない', () => {
    const initial = game();
    expect(advanceTo({ ...initial, phase: 'ready' }, 30).tick).toBe(0);
    const paused = act(advanceTo(initial, 5), { type: 'pause' });
    expect(advanceTo(paused, 50)).toBe(paused);
    expect(act(paused, { type: 'card', index: 0 })).toBe(paused);
    expect(act(paused, { type: 'collect' })).toBe(paused);
    expect(advanceTo(act(paused, { type: 'resume' }), 6).tick).toBe(360);
  });

  it('エネルギーが回復し、上限を超えない', () => {
    const empty = { ...game(), energy: 0 };
    expect(advanceTo(empty, 0.5).energy).toBe(1);
    expect(advanceTo(empty, 0.6).energy).toBeGreaterThan(1);
    expect(advanceTo(empty, 30).energy).toBe(10);
  });

  it('スタミナが尽きると休憩し、回復してからカードを使用できる', () => {
    const resting = advanceTo({ ...game(), stamina: 0, energy: 5 }, 1);
    expect(resting.resting).toBe(true);
    expect(resting.hearts).toHaveLength(0);
    expect(canUseCard(resting, 0)).toBe(false);
    const recovered = advanceTo(resting, 11);
    expect(recovered.resting).toBe(false);
    expect(recovered.stamina).toBeGreaterThan(39);
    expect(recovered.hearts.length).toBeGreaterThan(0);
  });

  it('終了時に残ったハートを回収し、その後の入力を受け付けない', () => {
    let state = game();
    const end = durationSeconds(state);
    state = advanceTo(state, end - 0.1);
    state = { ...state, hearts: [{ id: 9999, bornTick: state.tick }] };
    const finished = advanceTo(state, end + 10);
    expect(finished.phase).toBe('finished');
    expect(finished.hearts).toHaveLength(0);
    expect(finished.score).toBeGreaterThan(state.score);
    expect(act(finished, { type: 'card', index: 0 })).toBe(finished);
    expect(advanceTo(finished, end + 20)).toBe(finished);
  });

  it('不正な時刻や区間設定を拒否する', () => {
    expect(() => advanceTo(game(), Number.NaN)).toThrow();
    const invalid: Track = { ...game().track, sections: [] };
    expect(() => createGame(invalid, resolveDeck(defaultDeckIds), 7)).toThrow();
  });
});

describe('カードと編成', () => {
  it('異なる9枚と3人の参加を必要とする', () => {
    const track = game().track;
    expect(() => createGame(track, resolveDeck(defaultDeckIds.slice(1)), 7)).toThrow();
    expect(() =>
      createGame(track, resolveDeck(Array.from({ length: 9 }, () => 'spark')), 7),
    ).toThrow();
    expect(() => createGame(track, resolveDeck(defaultDeckIds), 0)).toThrow();
  });

  it('費用を払えないカードと範囲外の入力は状態を変更しない', () => {
    const state = { ...game(), energy: 0 };
    expect(act(state, { type: 'card', index: 0 })).toBe(state);
    expect(act(state, { type: 'card', index: -1 })).toBe(state);
    expect(act(state, { type: 'card', index: 1.5 })).toBe(state);
    expect(act(state, { type: 'card', index: 5 })).toBe(state);
  });

  it('費用を消費して補充し、山札を繰り返してもカードが増減しない', () => {
    let state = game();
    for (let turn = 0; turn < 150; turn++) {
      state = { ...state, energy: 10, tick: state.tick + 15 };
      const index = turn % 5;
      const card = cardAt(state, index);
      const next = act(state, { type: 'card', index });
      if (state.bloom) expect(next.energy).toBe(state.energy);
      else expect(next.energy).toBeGreaterThanOrEqual(10 - card.cost);
      expect(next.hand).toHaveLength(5);
      const owned = [...next.hand, ...next.drawPile, ...next.discard];
      expect(new Set(owned).size).toBe(9);
      expect(owned.sort()).toEqual([...defaultDeckIds].sort());
      state = next;
    }
  });

  it('連打によるカードの重複使用を防ぐ', () => {
    const state = act({ ...game(), energy: 10 }, { type: 'card', index: 0 });
    expect(act(state, { type: 'card', index: 1 })).toBe(state);
    expect(state.stats.cardsUsed).toBe(1);
  });
});
