import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { drainModeChanges } from '../../src/domain/game/effects/modeChange';
import { cardCost } from '../../src/domain/game/cards/cost';
import { cardAt } from '../../src/domain/game/projection';
import { createModes } from '../../src/domain/game/live/modes';
import { act } from '../../src/domain/game/actions';
import type { Card, Effect } from '../../src/domain/game/model';
import { game, withHand } from './support/game';

function modeGame() {
  return { ...game('library'), modes: createModes([2, 1, 2]), excitement: 0 };
}
const on: Effect = { kind: 'mode', modeId: 1, change: 'on' };
const off: Effect = { kind: 'mode', modeId: 1, change: 'off' };
const reaction: Effect = {
  kind: 'mode-reaction',
  modeId: 1,
  thresholds: [1, 2],
  effects: [
    { kind: 'excitement', amount: 10 },
    { kind: 'energy-limit', amount: 1 },
  ],
  buffNum: 10000,
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
    expect(state.excitement).toBe(10);
    expect(applyEffect(state, on)).toEqual(state);
    state = applyEffect(applyEffect(state, off), on);
    expect(state.excitement).toBe(30);
    expect(state.maxEnergy).toBe(modeGame().maxEnergy + 1);
    expect(state.modeReactions[0]?.count).toBe(2);
  });
  it('ActionType35のModeChangeType.Alternateは現在状態を反転する', () => {
    const toggledOn = applyEffect(modeGame(), {
      kind: 'mode',
      modeId: 1,
      change: 'alternate',
    });
    expect(toggledOn.modes.entries.find((entry) => entry.id === 1)?.on).toBe(true);
    const toggledOff = applyEffect(toggledOn, {
      kind: 'mode',
      modeId: 1,
      change: 'alternate',
    });
    expect(toggledOff.modes.entries.find((entry) => entry.id === 1)?.on).toBe(false);
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
          effects: [{ kind: 'excitement', amount: 1 }],
          skillIcon: null,
          special: null,
        },
        on: {
          cost: 3,
          effects: [{ kind: 'excitement', amount: 7 }],
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
      energy: 100,
    };
    const enabled = applyEffect(state, { kind: 'mode', modeId: 88, change: 'on' });
    expect(cardCost(state, card)).toBe(1);
    expect(cardCost(enabled, card)).toBe(3);
    expect(cardAt(enabled, 0).effects).toEqual([{ kind: 'excitement', amount: 7 }]);
    const used = act(enabled, { type: 'card', index: 0 });
    expect(used.excitement - enabled.excitement).toBe(28);
    expect(used.cardUses[0]?.cost).toBe(3);
  });
  it('切替保留中は状態を変えず、解除後にFIFOで実行する', () => {
    let state = applyEffect(modeGame(), reaction);
    state = { ...state, modes: { ...state.modes, held: true } };
    for (const effect of [on, off, on]) state = applyEffect(state, effect);
    expect(state.excitement).toBe(0);
    expect(state.modes.queue).toHaveLength(3);
    state = drainModeChanges({ ...state, modes: { ...state.modes, held: false } }, applyEffect);
    expect(state.excitement).toBe(30);
    expect(state.modes.queue).toHaveLength(0);
  });
  it('切替時効果による別モードの切替を同じキューで処理する', () => {
    let state = applyEffect(modeGame(), {
      kind: 'mode-reaction',
      modeId: 1,
      thresholds: [1],
      effects: [{ kind: 'mode', modeId: 2, change: 'on' }],
      buffNum: 0,
    });
    state = applyEffect(state, {
      kind: 'mode-reaction',
      modeId: 2,
      thresholds: [1],
      effects: [{ kind: 'energy-limit', amount: 2 }],
      buffNum: 0,
    });
    state = applyEffect(state, on);
    expect(state.modes.entries.every((entry) => entry.on)).toBe(true);
    expect(state.maxEnergy).toBe(modeGame().maxEnergy + 2);
    expect(state.modes.changing).toBe(false);
  });
  it('登録されていないモードとカード効果のID0では発動しない', () => {
    const initial = modeGame();
    expect(applyEffect(initial, { ...reaction, modeId: 99 })).toBe(initial);
    expect(
      applyEffect(initial, { ...on, modeId: 0 }).modes.entries.every((entry) => !entry.on),
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
      { ...original, deck: cards, cardPool: cards, energy: 100 },
      reaction,
    );
    const state = act(
      withHand(
        prepared,
        cards.map((card) => card.id),
      ),
      { type: 'card', index: 0 },
    );
    expect(state.excitement).toBe(10);
    expect(state.modeReactions[0]?.count).toBe(1);
    expect(state.modes.held).toBe(false);
  });
});
