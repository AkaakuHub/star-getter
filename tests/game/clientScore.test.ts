import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { collectionScore } from '@akaakuhub/suku-sute-core/game/scoring';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import {
  calculateLiveCardAppealValue,
  calculateLiveAddScoreMax,
} from '@akaakuhub/suku-sute-core/runtime/live/clientScoreInput';

const ordinaryLimit = {
  additionalEnabled: false,
  bonusScoreValue: 0,
  voltageMultiplier: 0n,
  bloomActive: false,
  bloomGauge: 0,
};

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
      calculateLiveCardAppealValue({ smile: 12000, pure: 10000, cool: 8000 }, 1, 120),
    ).toBeCloseTo(0.3, 7);
    expect(
      calculateLiveCardAppealValue({ smile: 12000, pure: 10000, cool: 8000 }, 0, 120),
    ).toBeCloseTo(0.375, 7);
  });

  it('90秒ではfloatで算出した平均アピールから基礎得点を切り上げ、10個が7500となる', () => {
    expect(collectionScore(game(), 10, false, 10)).toBe(7500n);
  });

  it('回収数×熱気によるきらめきランクで倍率が変わる', () => {
    expect(collectionScore({ ...game(), excitement: 601 }, 10, false, 10)).toBe(15000n);
  });

  it('STAR増加は加算し、開花プログレスの1.5乗を百分率で加える', () => {
    const base = game();
    const boosts = [
      { percent: 100, untilTick: 100 },
      { percent: 100, untilTick: 100 },
    ];
    expect(collectionScore({ ...base, boosts }, 10, false, 10)).toBe(22500n);
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
    ).toBe(8101n);
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
    expect(calculateLiveAddScoreMax(100, [], ordinaryLimit)).toBe(2147483647n);
    const huge = { ...game(), boosts: [{ percent: 10 ** 20, untilTick: 100 }] };
    expect(collectionScore(huge, 100, false, 100)).toBe(2147483647n);
  });
});

it('基本カードを除外しても開始時の基礎アピールを変えない', () => {
  const initial = game();
  const excluded = { ...initial, deck: initial.deck.filter((card) => card.id !== 'class') };
  expect(collectionScore(excluded, 10, false, 10)).toBe(collectionScore(initial, 10, false, 10));
});
