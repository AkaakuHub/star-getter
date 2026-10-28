import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { drainModeChanges } from '@akaakuhub/suku-sute-core/game/effects/modeChange';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { cardAt } from '@akaakuhub/suku-sute-core/game/projection';
import { createModes } from '@akaakuhub/suku-sute-core/game/live/modes';
import { activateModeAbilityEffects } from '@akaakuhub/suku-sute-core/game/cards/modeAbility';
import { disposeHandEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import type { Card, Effect } from '@akaakuhub/suku-sute-core/game/model';
import { game, withHand } from './support/game';

function modeGame() {
  return { ...game('library'), modes: createModes([2, 1, 2]), currentVoltage: 0 };
}
const on: Effect = { kind: 'mode', modeId: 1n, change: 'on' };
const off: Effect = { kind: 'mode', modeId: 1n, change: 'off' };
const reaction: Effect = {
  kind: 'mode-reaction',
  modeId: 1,
  thresholds: [1n, 2n],
  effects: [
    { kind: 'voltage', amount: 10 },
    { kind: 'ap-limit', amount: 1 },
  ],
  buffNum: 10000n,
};

describe('モード切替と切替時効果', () => {
  it('初期状態はID順・OFFで重複を含まない', () => {
    expect(modeGame().modes.entries.map(({ id, on }) => ({ id, on }))).toEqual([
      { id: 1, on: false },
      { id: 2, on: false },
    ]);
  });
  it('同じONを重複発動せず、OFFからONへの切替だけ数える', () => {
    let state = applyEffect(modeGame(), reaction);
    state = applyEffect(state, on);
    expect(state.currentVoltage).toBe(10);
    expect(applyEffect(state, on)).toEqual(state);
    state = applyEffect(applyEffect(state, off), on);
    expect(state.currentVoltage).toBe(30);
    expect(state.ap.maxAp).toBe(modeGame().ap.maxAp + 1);
    expect(state.modeReactions[0]?.count).toBe(2);
  });
  it('ActionType35のModeChangeType.Alternateは現在状態を反転する', () => {
    const toggledOn = applyEffect(modeGame(), {
      kind: 'mode',
      modeId: 1n,
      change: 'alternate',
    });
    expect(toggledOn.modes.entries.find((entry) => entry.id === 1)?.on).toBe(true);
    const toggledOff = applyEffect(toggledOn, {
      kind: 'mode',
      modeId: 1n,
      change: 'alternate',
    });
    expect(toggledOff.modes.entries.find((entry) => entry.id === 1)?.on).toBe(false);
  });

  it('ActionType35のlong ModeIdを参照実装のint32へ変換する', () => {
    const changed = applyEffect(modeGame(), {
      kind: 'mode',
      modeId: 4_294_967_297n,
      change: 'on',
    });
    expect(changed.modes.entries.find((entry) => entry.id === 1)?.on).toBe(true);
  });
  it('Action36のモード別スキル詳細をAction35の切替に合わせて選ぶ', () => {
    const initial = game();
    const template = initial.deck[0];
    if (!template) throw new Error('カードがありません。');
    const card = {
      ...template,
      modeSkillChanges: {
        modeId: 88,
        off: {
          cost: 1,
          effects: [{ kind: 'voltage', amount: 1 }],
          skillIcon: null,
          special: null,
        },
        on: {
          cost: 3,
          effects: [{ kind: 'voltage', amount: 7 }],
          skillIcon: null,
          special: null,
        },
      },
    } as const;
    const cards = initial.deck.map((item) => (item.id === card.id ? card : item));
    const state = {
      ...initial,
      deck: cards,
      cardPool: cards,
      modes: createModes([88]),
      hand: [card.id],
      phase: 'playing' as const,
      ap: { ...initial.ap, currentAp: 100 },
    };
    const enabled = applyEffect(state, { kind: 'mode', modeId: 88n, change: 'on' });
    expect(cardCost(state, card)).toBe(1);
    expect(cardCost(enabled, card)).toBe(3);
    expect(cardAt(enabled, 0).effects).toEqual([{ kind: 'voltage', amount: 7 }]);
    const used = act(enabled, { type: 'card', index: 0 });
    expect(used.currentVoltage - enabled.currentVoltage).toBe(28);
    expect(used.cardUses[0]?.cost).toBe(3);
  });
  it('Action36のモード別Abilityを切替時に解除して再起動する', () => {
    const initial = modeGame();
    const template = initial.deck[0];
    if (!template) throw new Error('カードがありません。');
    const card = {
      ...template,
      modeAbilityChanges: {
        modeId: 1,
        off: {
          modeEffects: [handCardCountEffect(1, 3, 0n)],
          ability893Effects: [{ kind: 'ap', amount: 1 }],
          ability894Effects: [],
        },
        on: {
          modeEffects: [handCardCountEffect(2, 3, 0n)],
          ability893Effects: [{ kind: 'ap', amount: 3 }],
          ability894Effects: [],
        },
      },
    } as const;
    const deck = initial.deck.map((item) => (item.id === card.id ? card : item));
    const prepared = {
      ...initial,
      deck,
      cardPool: deck,
      hand: [card.id],
      handEffectCardIds: [card.id],
    };
    const off = activateModeAbilityEffects(prepared, card, applyEffect);
    expect(off.handLimit).toBe(initial.handLimit + 1);
    const on = applyEffect(off, { kind: 'mode', modeId: 1n, change: 'on' });
    expect(on.handLimit).toBe(initial.handLimit + 2);
    const disposed = disposeHandEffects(on, [card.id]);
    expect(disposed.handLimit).toBe(initial.handLimit);
    const playing = act(
      {
        ...on,
        phase: 'playing',
        drawPile: deck.filter((item) => item.id !== card.id).map((item) => item.id),
        ap: { ...on.ap, currentAp: 20 },
      },
      { type: 'card', index: 0 },
    );
    expect(playing.ap.currentAp).toBe(20 - cardCost(on, card) + 3);
  });
  it('切替保留中は状態を変えず、解除後にFIFOで実行する', () => {
    let state = applyEffect(modeGame(), reaction);
    state = { ...state, modes: { ...state.modes, held: true } };
    for (const effect of [on, off, on]) state = applyEffect(state, effect);
    expect(state.currentVoltage).toBe(0);
    expect(state.modes.queue).toHaveLength(3);
    state = drainModeChanges({ ...state, modes: { ...state.modes, held: false } }, applyEffect);
    expect(state.currentVoltage).toBe(30);
    expect(state.modes.queue).toHaveLength(0);
  });
  it('ActionType45のNumToValueを効果加算後にEffectPowerとして適用する', () => {
    const initial = { ...modeGame(), moodOffset: 1 };
    let state = applyEffect(initial, {
      kind: 'mode-reaction',
      modeId: 1,
      thresholds: [2n],
      effects: [{ kind: 'boost', multiplier: 1.01, moodBonus: { target: 1, perPoint: 1 } }],
      buffNum: 10_000n,
    });
    state = applyEffect(state, on);
    state = applyEffect(state, off);
    state = applyEffect(state, on);
    expect(state.boosts.at(-1)?.percent).toBe(4);
  });
  it('ActionType45は参照実装のintキャストで誘発値を0方向へ切り捨てる', () => {
    const initial = modeGame();
    const registered = applyEffect(initial, {
      kind: 'mode-reaction',
      modeId: 1,
      thresholds: [1n],
      effects: [{ kind: 'voltage', amount: 1 }],
      buffNum: 15_000n,
    });

    expect(applyEffect(registered, on).currentVoltage).toBe(1);
  });
  it('ActionType45は子効果がない場合、表示・誘発を登録しない', () => {
    const state = modeGame();
    expect(
      applyEffect(state, {
        kind: 'mode-reaction',
        modeId: 1,
        thresholds: [1n],
        effects: [],
        buffNum: 10_000n,
      }),
    ).toBe(state);
  });
  it('ActionType45は子EffectごとにCheckDeckOutを1回通知する', () => {
    const initial = modeGame();
    let state = applyEffect(
      {
        ...initial,
        deckOutCount: 2,
        track: {
          ...initial.track,
          afterMentalDownEffects: [{ kind: 'voltage', amount: 5 }],
        },
      },
      {
        kind: 'mode-reaction',
        modeId: 1,
        thresholds: [1n],
        effects: [{ kind: 'ap-limit', amount: 1 }],
        buffNum: 0n,
      },
    );
    state = applyEffect(state, on);
    expect(state.deckOutCount).toBe(1);
    expect(state.afterMentalDownEvents).toBe(1);
    expect(state.currentVoltage).toBe(5);
  });
  it('切替時効果による別モードの切替を同じキューで処理する', () => {
    let state = applyEffect(modeGame(), {
      kind: 'mode-reaction',
      modeId: 1,
      thresholds: [1n],
      effects: [{ kind: 'mode', modeId: 2n, change: 'on' }],
      buffNum: 0n,
    });
    state = applyEffect(state, {
      kind: 'mode-reaction',
      modeId: 2,
      thresholds: [1n],
      effects: [{ kind: 'ap-limit', amount: 2 }],
      buffNum: 0n,
    });
    state = applyEffect(state, on);
    expect(state.modes.entries.every((entry) => entry.on)).toBe(true);
    expect(state.ap.maxAp).toBe(modeGame().ap.maxAp + 2);
    expect(state.modes.changing).toBe(false);
  });
  it('登録されていないモードとカード効果のID0では発動しない', () => {
    const initial = modeGame();
    expect(applyEffect(initial, { ...reaction, modeId: 99 })).toBe(initial);
    expect(
      applyEffect(initial, { ...on, modeId: 0n }).modes.entries.every((entry) => !entry.on),
    ).toBe(true);
  });
  it('一斉使用のカード処理中は切替時効果を保留する', () => {
    const original = modeGame();
    const first = original.deck[0];
    if (!first) throw new Error('カードがありません。');
    const cards: readonly Card[] = [
      { ...first, id: 'invoke', effects: [{ kind: 'use-hand' }] },
      { ...first, id: 'enable', effects: [on] },
      { ...first, id: 'reset', effects: [{ kind: 'voltage-set', amount: 0 }] },
    ];
    const prepared = applyEffect(
      { ...original, deck: cards, cardPool: cards, ap: { ...original.ap, currentAp: 100 } },
      reaction,
    );
    const state = act(
      withHand(
        prepared,
        cards.map((card) => card.id),
      ),
      { type: 'card', index: 0 },
    );
    expect(state.currentVoltage).toBe(10);
    expect(state.modeReactions[0]?.count).toBe(1);
    expect(state.modes.held).toBe(false);
  });
});
