import { describe, expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { spendAp } from '@akaakuhub/suku-sute-core/game/resources';
import { game, withHand } from './support/game';

describe('エナジー消費時の回復タイマー', () => {
  it('上限で消費すると回復途中の時間を0へ戻す', () => {
    const state = game();
    const next = spendAp(
      { ...state, ap: { ...state.ap, currentAp: state.ap.maxAp, timerSeconds: 0.8 } },
      1,
    );
    expect(next.ap.currentAp).toBe(state.ap.maxAp - 1);
    expect(next.ap.timerSeconds).toBe(0);
  });
  it('上限未満の消費では途中の時間を保持する', () => {
    const state = game();
    const next = spendAp({ ...state, ap: { ...state.ap, currentAp: 5, timerSeconds: 0.8 } }, 1);
    expect(next.ap.currentAp).toBe(4);
    expect(next.ap.timerSeconds).toBe(0.8);
  });
  it('消費0でも上限時はタイマーをリセットする', () => {
    const state = game();
    expect(
      spendAp({ ...state, ap: { ...state.ap, currentAp: state.ap.maxAp, timerSeconds: 0.8 } }, 0).ap
        .timerSeconds,
    ).toBe(0);
  });
  it('通常のカードと共鳴の両方で同じ消費経路を使う', () => {
    const state = game();
    const ready = { ...state, ap: { ...state.ap, currentAp: state.ap.maxAp, timerSeconds: 0.8 } };
    const card = act(withHand(ready, ['class']), { type: 'card', index: 0 });
    const special = act(ready, { type: 'special', cardId: 'horizon' });
    expect(card.stats.cardsUsed).toBe(1);
    expect(card.ap.timerSeconds).toBe(0);
    expect(special.stats.specialsUsed).toBe(1);
    expect(special.ap.timerSeconds).toBe(0);
  });
  it('効果によるエナジー減少では消費時のリセットを実行しない', () => {
    const state = game();
    const next = applyEffect(
      { ...state, ap: { ...state.ap, currentAp: state.ap.maxAp, timerSeconds: 0.8 } },
      { kind: 'ap', amount: -1 },
    );
    expect(next.ap.timerSeconds).toBe(0.8);
  });
});
