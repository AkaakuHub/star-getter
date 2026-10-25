import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import {
  activateComboInduce,
  advanceComboInducer,
  deactivateComboInducer,
  expireComboInducerSections,
  notifyComboSkillPoint,
} from '../../src/domain/game/effects/comboInduce';
import { heartCount } from '../../src/domain/game/hearts';
import { game } from './support/game';

function setup(repeatAction: 0 | 1 | 2 = 0) {
  const initial = game();
  const deck = initial.deck.map((card) => ({ ...card, passive: {} }));
  const state = { ...initial, deck, cardPool: deck };
  const source = state.deck[0];
  const first = state.deck[1];
  if (!source || !first || source.member === first.member)
    throw new Error('コンボ誘発の検証カードがありません。');
  const effect = {
    kind: 'combo-induce',
    members: [source.member, first.member],
    apPower: 10_000,
    repeatAction,
    duration: { kind: 'stage', value: 0 },
    effects: [
      { kind: 'hearts', amount: 1 },
      { kind: 'energy', amount: 1 },
    ],
    deactivationKey: 'combo',
  } as const;
  return { state: activateComboInduce(state, effect, source, 1, 0), source, first };
}

it('指定メンバーの合計APからEffectPowerを求め、1秒後に子効果を実行する', () => {
  const { state, source, first } = setup();
  const one = notifyComboSkillPoint(state, source, 1);
  const complete = {
    ...notifyComboSkillPoint(one, first, 2),
    deckOutCount: 2,
  };
  expect(complete.comboInducer?.phase).toBe('activating');
  const activated = advanceComboInducer(complete, 1, applyEffect);
  expect(heartCount(activated)).toBe(4);
  expect(activated.energy).toBe(4);
  expect(activated.deckOutCount).toBe(0);
  expect(activated.comboInducer?.phase).toBe('resetting');
  const queued = notifyComboSkillPoint(activated, source, 3);
  const reset = advanceComboInducer(queued, 1, applyEffect);
  expect(reset.comboInducer?.phase).toBe('collecting');
  expect(reset.comboInducer?.members.map((member) => member.ap)).toEqual([3, null]);
});

it('カード使用時に実APをコンボ誘発へ渡す', () => {
  const initial = game();
  const first = initial.deck[0];
  const second = initial.deck[1];
  if (!first || !second || first.member === second.member)
    throw new Error('コンボ誘発の検証カードがありません。');
  const deck = initial.deck.map((card) => ({
    ...card,
    cost: card.id === first.id ? 1 : card.cost,
    effects: [{ kind: 'hearts', amount: 0 }] as const,
    passive: {},
  }));
  const source = deck.find((card) => card.id === first.id);
  if (!source) throw new Error('コンボ誘発の発動元カードがありません。');
  const ready = {
    ...initial,
    deck,
    cardPool: deck,
    hand: [first.id, second.id],
    drawPile: deck
      .filter((card) => card.id !== first.id && card.id !== second.id)
      .map((card) => card.id),
    energy: 100,
  };
  const armed = activateComboInduce(
    ready,
    {
      kind: 'combo-induce',
      members: [first.member, second.member],
      apPower: 10_000,
      repeatAction: 1,
      duration: { kind: 'stage', value: 0 },
      effects: [],
    },
    source,
    1,
    0,
  );
  const used = act(armed, { type: 'card', index: 0 });
  expect(used.comboInducer?.members[0]?.ap).toBe(1);
});

it('再使用設定に応じて同じメンバーのAPをリセット・上書き・無視する', () => {
  const reset = setup(0);
  const resetOnce = notifyComboSkillPoint(reset.state, reset.source, 2);
  const resetAgain = notifyComboSkillPoint(resetOnce, reset.source, 3);
  expect(resetAgain.comboInducer?.members.map((member) => member.ap)).toEqual([3, null]);

  const overwrite = setup(1);
  const overwriteOnce = notifyComboSkillPoint(overwrite.state, overwrite.source, 2);
  const overwriteAgain = notifyComboSkillPoint(overwriteOnce, overwrite.source, 3);
  expect(overwriteAgain.comboInducer?.members.map((member) => member.ap)).toEqual([3, null]);

  const ignore = setup(2);
  const ignoreOnce = notifyComboSkillPoint(ignore.state, ignore.source, 2);
  const ignoreAgain = notifyComboSkillPoint(ignoreOnce, ignore.source, 3);
  expect(ignoreAgain.comboInducer?.members.map((member) => member.ap)).toEqual([2, null]);
});

it('期限切れの収集中は以降のAPを受け付けない', () => {
  const { state, source, first } = setup();
  const inducer = state.comboInducer;
  if (!inducer) throw new Error('コンボ誘発が有効ではありません。');
  const timed = {
    ...state,
    comboInducer: { ...inducer, remainingSections: 1 },
  };
  const expired = expireComboInducerSections(timed);
  expect(expired.comboInducer).toBeNull();
  expect(notifyComboSkillPoint(expired, source, 1)).toBe(expired);
  expect(notifyComboSkillPoint(expired, first, 2)).toBe(expired);

  const timedSeconds = { ...state, comboInducer: { ...inducer, remainingSeconds: 0.01 } };
  const elapsed = advanceComboInducer(timedSeconds, 1 / 60, applyEffect);
  expect(elapsed.comboInducer).toBeNull();
  expect(deactivateComboInducer(state, 'combo').comboInducer).toBeNull();
});
