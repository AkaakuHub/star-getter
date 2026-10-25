import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { addHearts, heartCount } from '../../src/domain/game/hearts';
import type { GameState, Track } from '../../src/domain/game/model';
import { canUseCard, durationSeconds } from '../../src/domain/game/projection';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(): GameState {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 12625, 100, routes.bloom.tokens), {
    type: 'start',
  });
}

describe('ライブの進行', () => {
  it('描画の間隔にかかわらず同じゲーム時刻で同じ状態になる', () => {
    const initial = game();
    let frequent = initial;
    for (let frame = 1; frame <= 600; frame++) frequent = advanceTo(frequent, frame / 60);
    expect(frequent).toEqual(advanceTo(initial, 10));
    expect(heartCount(frequent)).toBeGreaterThan(0);
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
    expect(advanceTo(empty, 0.5).energy).toBe(0);
    expect(advanceTo(empty, 1.3).energy).toBe(1);
    expect(advanceTo(empty, 30).energy).toBe(empty.maxEnergy);
  });

  it('スタミナが尽きると休憩し、回復してからカードを使用できる', () => {
    const resting = advanceTo({ ...game(), stamina: 0, energy: 5 }, 1);
    expect(resting.resting).toBe(true);
    expect(heartCount(resting)).toBeLessThanOrEqual(heartCount(game()));
    expect(canUseCard(resting, 0)).toBe(false);
    const recovered = advanceTo(resting, 11);
    expect(recovered.resting).toBe(false);
    expect(recovered.stamina).toBeGreaterThan(39);
    expect(heartCount(recovered)).toBeGreaterThan(0);
  });

  it('終了時に残ったきらめきを回収し、その後の入力を受け付けない', () => {
    let state = game();
    const end = durationSeconds(state);
    state = advanceTo(state, end - 0.1);
    state = addHearts(state, 1);
    const finished = advanceTo(state, end + 10);
    expect(finished.phase).toBe('finished');
    expect(heartCount(finished)).toBe(0);
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
  it('3〜100枚の重複しない編成を受け入れる', () => {
    const track = game().track;
    expect(() => createGame(track, resolveDeck(defaultDeckIds.slice(1)), 7)).not.toThrow();
    expect(() => createGame(track, resolveDeck(defaultDeckIds.slice(0, 2)), 7)).toThrow();
    expect(() =>
      createGame(track, resolveDeck(Array.from({ length: 8 }, () => 'horizon')), 7),
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

  it('連打によるカードの重複使用を防ぐ', () => {
    const initial = { ...game(), energy: 10 };
    const index = initial.hand.findIndex((_, slot) => canUseCard(initial, slot));
    const state = act(initial, { type: 'card', index });
    expect(act(state, { type: 'card', index: 1 })).toBe(state);
    expect(state.stats.cardsUsed).toBe(1);
  });
});
