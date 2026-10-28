import { describe, expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { spendAp } from '@akaakuhub/suku-sute-core/game/resources';
import { canUseCard } from '@akaakuhub/suku-sute-core/game/projection';
import { canUseSpecial } from '@akaakuhub/suku-sute-core/game/special';
import { game, withHand } from './support/game';

it('AP無限中は最大APを超えるカードと共鳴を使用できる', () => {
  const state = game();
  const source = state.deck[0];
  if (!source?.special) throw new Error('共鳴付きカードがありません。');
  const special = source.special;
  const costly = withHand(
    {
      ...state,
      deck: state.deck.map((card) =>
        card.cardInstanceId === source.cardInstanceId
          ? {
              ...card,
              consumeAp: state.ap.maxAp + 10,
              special: { ...special, consumeAp: state.ap.maxAp + 10 },
            }
          : card,
      ),
    },
    [source.cardInstanceId],
  );
  expect(canUseCard(costly, 0)).toBe(false);
  expect(canUseSpecial(costly, source.cardInstanceId)).toBe(false);
  const active = applyEffect(costly, {
    kind: 'infinity-gauge',
    gauge: 'ap',
    duration: { kind: 'stage', value: 0 },
  });
  expect(canUseCard(active, 0)).toBe(true);
  expect(canUseSpecial(active, source.cardInstanceId)).toBe(true);
  expect(act(active, { type: 'card', index: 0 }).stats.cardsUsed).toBeGreaterThan(0);
  expect(act(active, { type: 'special', cardId: source.cardInstanceId }).stats.specialsUsed).toBe(
    1,
  );
});

it('APの空模様補正と追加値を倍率・EffectPowerより先に適用する', () => {
  const state = game('library');
  const initial = { ...state, moodOffset: 100, ap: { ...state.ap, currentAp: 0 } };
  const after = applyEffect(
    initial,
    {
      kind: 'ap',
      amount: 2.5,
      moodBonus: { target: 1, perPoint: 0.01 },
    },
    undefined,
    2,
    0.5,
    1.5,
  );
  expect(after.ap.currentAp).toBe(12);
});

it('範囲外のAP回復量はint32へ飽和させてから通常APの上限を適用する', () => {
  const state = game('library');
  const after = applyEffect(
    { ...state, ap: { ...state.ap, currentAp: 0 } },
    {
      kind: 'ap',
      amount: 3000000000,
    },
  );
  expect(after.ap.currentAp).toBe(state.ap.maxAp);
});

describe('エナジー消費時の回復タイマー', () => {
  it('0消費ではAP回復用のProxyを消費しない', () => {
    const state = game();
    const source = state.deck[0];
    if (!source) throw new Error('発動元カードがありません。');
    const active = applyEffect(
      state,
      {
        kind: 'proxy-skill',
        absorbLimit: 1,
        periodType: 1,
        periodParam: 3000n,
        induceTiming: 1,
        induceCondition: 1,
        inducePowerType: 1,
        inducePowerParam: 0,
        targets: [{ actionType: 14, targetAmount: 3 }],
        effects: [],
      },
      source,
    );
    expect(spendAp(active, 0).proxyAbsorptions).toBe(active.proxyAbsorptions);
  });
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
