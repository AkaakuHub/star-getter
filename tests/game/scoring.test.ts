import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { addHearts } from '../../src/domain/game/hearts';
import type { GameState } from '../../src/domain/game/model';
import { canUseCard, durationSeconds, scoreGrade } from '../../src/domain/game/projection';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game(): GameState {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, resolveDeck(defaultDeckIds), 456), { type: 'start' });
}

describe('ハートと得点', () => {
  it('回収すると得点とチャージを得て、同じハートを二重回収しない', () => {
    const state = addHearts(game(), 10);
    const collected = act(state, { type: 'collect' });
    expect(collected.score).toBeGreaterThan(0);
    expect(collected.charge).toBe(8);
    expect(collected.stats.heartsCollected).toBe(10);
    expect(collected.hearts).toHaveLength(0);
    expect(act(collected, { type: 'collect' })).toBe(collected);
  });

  it('時間切れのハートは通常回収の20%の得点になる', () => {
    const state = { ...addHearts(game(), 10), resting: true, stamina: 0 };
    const normal = act(state, { type: 'collect' });
    const expired = advanceTo(state, 10);
    expect(expired.stats.heartsMissed).toBe(10);
    expect(expired.stats.heartsCollected).toBe(0);
    expect(expired.score).toBe(Math.floor(normal.score * 0.2));
  });

  it('上限を超えた分だけが失効し、新しいハートを保持する', () => {
    const state = addHearts(addHearts(game(), 35), 12);
    expect(state.hearts).toHaveLength(40);
    expect(state.hearts[0]?.id).toBe(7);
    expect(state.stats.heartsMissed).toBe(7);
  });

  it('得点増加の効果が切れると倍率が戻る', () => {
    const base = game();
    const normal = act(addHearts(base, 10), { type: 'collect' });
    const boosted = { ...base, boosts: [{ multiplier: 2, untilTick: 60 }] };
    expect(act(addHearts(boosted, 10), { type: 'collect' }).score).toBe(normal.score * 2);
    const expired = advanceTo(boosted, 1);
    expect(expired.boosts).toHaveLength(0);
    const unboosted = advanceTo(base, 1);
    expect(act(addHearts(expired, 10), { type: 'collect' }).score).toBe(
      act(addHearts(unboosted, 10), { type: 'collect' }).score,
    );
  });

  it('チャージが満ちた時だけ全員のスキルを使用できる', () => {
    const state = game();
    expect(act(state, { type: 'special' })).toBe(state);
    const special = act({ ...state, charge: 100, energy: 2, stamina: 60 }, { type: 'special' });
    expect(special.charge).toBe(0);
    expect(special.energy).toBe(5);
    expect(special.stamina).toBe(70);
    expect(special.hearts).toHaveLength(8);
    expect(special.stats.specialsUsed).toBe(1);
    expect(special.boosts).toHaveLength(1);
    expect(act(special, { type: 'special' })).toBe(special);
  });
});

describe('楽曲を最後まで遊べる', () => {
  for (const track of tracks) {
    it(`${track.name}でカード・回収・全員スキルを使って結果へ到達する`, () => {
      let state = act(createGame(track, resolveDeck(defaultDeckIds), 1234), { type: 'start' });
      for (let frame = 1; frame <= Math.ceil(durationSeconds(state) * 4); frame++) {
        state = advanceTo(state, frame / 4);
        const cardIndex = state.hand.findIndex(
          (cardId, index) => Boolean(cardId) && canUseCard(state, index),
        );
        if (cardIndex >= 0) state = act(state, { type: 'card', index: cardIndex });
        state = act(state, { type: 'special' });
        if (frame % 12 === 0) state = act(state, { type: 'collect' });
      }
      expect(state.phase).toBe('finished');
      expect(state.stats.cardsUsed).toBeGreaterThan(5);
      expect(state.stats.specialsUsed).toBeGreaterThan(0);
      expect(state.stats.heartsMissed).toBe(0);
      expect(state.score).toBeGreaterThan(track.targetScore);
      expect(['A', 'S']).toContain(scoreGrade(state));
    });
  }
});
