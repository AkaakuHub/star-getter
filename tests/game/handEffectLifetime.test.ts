import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game, withHand } from './support/game';

it('開始時は901を実行せず、903/904だけ手札へ登録する', () => {
  for (const route of ['library', 'genesis'] as const) {
    const state = game(route);
    expect(heartCount(state)).toBe(0);
    expect(state.mental.currentMental).toBe(100);
    expect(state.apTimeEffects).toHaveLength(0);
    expect(state.costReductions).toEqual({});
    expect([...state.handEffectCardIds].sort()).toEqual([...state.hand].sort());
  }
});

it('一斉使用した常在カードの増幅を後続の子へ適用し、補充後は手札外の効果を残さない', () => {
  const initial = game();
  const state = withHand(
    {
      ...initial,
      moodOffset: -150,
      costReductions: Object.fromEntries(initial.deck.map((card) => [card.id, 100])),
      ap: { ...initial.ap, currentAp: 20, maxAp: 20 },
    },
    ['aurora-ensemble', 'perennial', 'horizon'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.voltage.currentVoltage).toBeGreaterThan(100_000n);
  expect([...used.handEffectCardIds].sort()).toEqual([...used.hand].sort());
  expect(used.activation).toBeNull();
});

it('本人使用でも解除前のDOLL手札反応を実行して9APを回復する', () => {
  const baseState = game();
  const state = withHand({ ...baseState, ap: { ...baseState.ap, currentAp: 20, maxAp: 20 } }, [
    'frost-echo',
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(1);
  expect(used.ap.currentAp).toBe(15);
  expect([...used.handEffectCardIds].sort()).toEqual([...used.hand].sort());
});
