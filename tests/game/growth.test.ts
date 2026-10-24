import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { rules } from '../../src/domain/game/model';
import { scoreGrade } from '../../src/domain/game/projection';
import { collectionScore } from '../../src/domain/game/scoring';
import { createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, resolveDeck(defaultDeckIds), 7), { type: 'start' });
}

describe('ライブ中の複利成長', () => {
  it('成長カードを使うたびに倍率を乗算し、ライブ終了後へ持ち越さない', () => {
    let state = game();
    for (let used = 1; used <= 11; used++) {
      state = applyEffect(state, { kind: 'growth', multiplier: 1_000_000 });
      expect(state.growthMultiplier).toBe(10n ** BigInt(used * 6));
    }
    expect(applyEffect(state, { kind: 'growth', multiplier: 1_000_000 }).growthMultiplier).toBe(
      rules.maxScore,
    );
    expect(game().growthMultiplier).toBe(1n);
  });

  it('基礎計算の後にBigIntで乗算し、大きな倍率の下位桁も保持する', () => {
    const base = game();
    const multiplier = 10n ** 40n + 12345n;
    expect(collectionScore({ ...base, growthMultiplier: multiplier }, 10, false)).toBe(
      collectionScore(base, 10, false) * multiplier,
    );
  });

  it('十分に成長した回収で9999無量大数へ到達し、上限を超えない', () => {
    const state = { ...game(), growthMultiplier: 10n ** 72n };
    expect(collectionScore(state, 10, false)).toBe(rules.maxScore);
  });

  it('83万700はC評価で、S以上を目標の桁に合わせる', () => {
    const base = game();
    expect(scoreGrade({ ...base, score: 830700n })).toBe('C');
    expect(scoreGrade({ ...base, score: 10n ** 60n })).toBe('S');
    expect(scoreGrade({ ...base, score: 10n ** 68n })).toBe('SS');
    expect(scoreGrade({ ...base, score: rules.maxScore - 1n })).toBe('SS');
    expect(scoreGrade({ ...base, score: rules.maxScore })).toBe('SSS');
  });
});
