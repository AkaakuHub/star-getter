import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { collectionScore } from '../../src/domain/game/scoring';
import { advanceTo, createGame } from '../../src/domain/game/simulation';
import {
  calculateStarGatherCardAppealValue,
  calculateStarGatherAddScoreMax,
} from '../../src/domain/game/live/clientScoreInput';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const deck = resolveDeck(defaultDeckIds).map((card) => ({
    ...card,
    appeal: { smile: 125, pure: 125, cool: 125 },
  }));
  return act(createGame(track, deck, 7), { type: 'start' });
}

describe('スターギャザーの回収得点', () => {
  it('一致属性だけを1.5倍にし、楽曲秒数と1000で正規化する', () => {
    expect(
      calculateStarGatherCardAppealValue({ smile: 12000, pure: 10000, cool: 8000 }, 1, 120),
    ).toBe(0.3);
    expect(
      calculateStarGatherCardAppealValue({ smile: 12000, pure: 10000, cool: 8000 }, 0, 120),
    ).toBe(0.375);
  });

  it('60秒・各属性125の編成できらめき10個は11250となる', () => {
    expect(collectionScore(game(), 10, false, 10)).toBe(11250n);
  });

  it('回収数×熱気によるきらめきランクで倍率が変わる', () => {
    expect(collectionScore({ ...game(), excitement: 601 }, 10, false, 10)).toBe(22500n);
  });

  it('STAR増加は加算し、開花プログレスの1.5乗を10000分率で加える', () => {
    const base = game();
    const boosts = [
      { percent: 100, untilTick: 100 },
      { percent: 100, untilTick: 100 },
    ];
    expect(collectionScore({ ...base, boosts }, 10, false, 10)).toBe(33750n);
    expect(
      collectionScore(
        {
          ...base,
          bloom: {
            progress: 4n,
            strength: 1,
            rollback: { energy: 10, stamina: 100, excitement: 0 },
          },
        },
        10,
        false,
        10,
      ),
    ).toBe(11258n);
  });

  it('回収回数や山場だけでは独自の得点倍率を付けない', () => {
    const base = game();
    const expected = collectionScore(base, 10, false, 10);
    expect(collectionScore({ ...base, combo: 70 }, 10, false, 10)).toBe(expected);
    expect(collectionScore({ ...base, tick: 1200 }, 10, false, 10)).toBe(expected);
  });

  it('カード未使用なら放置しても回収だけを繰り返しても億へ到達しない', () => {
    const idle = advanceTo(game(), 60);
    let collecting = game();
    for (let tick = 1; tick <= 3600; tick++) {
      collecting = act(advanceTo(collecting, tick / 60), { type: 'collect' });
    }
    expect(idle.stats.cardsUsed).toBe(0);
    expect(collecting.stats.cardsUsed).toBe(0);
    expect(idle.score).toBeLessThan(1_000_000n);
    expect(collecting.score).toBeLessThan(1_000_000n);
  });

  it('1回の通常回収は本家の既定上限を適用する', () => {
    expect(calculateStarGatherAddScoreMax(100, [])).toBe(2147483647n);
    const huge = { ...game(), boosts: [{ percent: 10 ** 20, untilTick: 100 }] };
    expect(collectionScore(huge, 100, false, 100)).toBe(2147483647n);
  });
});

it('基本カードを除外しても開始時の基礎アピールを変えない', () => {
  const initial = game();
  const excluded = { ...initial, deck: initial.deck.filter((card) => card.id !== 'class') };
  expect(collectionScore(excluded, 10, false, 10)).toBe(collectionScore(initial, 10, false, 10));
});
