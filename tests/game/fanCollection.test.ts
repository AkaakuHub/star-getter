import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { addHearts } from '@akaakuhub/suku-sute-core/game/hearts';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { fillHand, shuffleHand } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { game, withHand } from './support/game';

it('最低値1の30万回収で2%の熱気回復増幅を全ステージに付与し、回数で消費しない', () => {
  const initial = game();
  let state = withHand(
    {
      ...initial,
      targetBoosts: [],
      moodOffset: -150,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
      ap: { ...initial.ap, currentAp: 0 },
      voltage: { ...initial.voltage, currentVoltage: BigInt(0) },
    },
    ['frost-pulse'],
  );
  state = act(addHearts(state, 299_999), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(0);
  state = act(addHearts(state, 1), { type: 'collect' });
  expect(state.resourceBoosts).toEqual([{ target: 'voltage', percent: 2, uses: null }]);
  state = applyEffect(state, { kind: 'voltage', amount: 100 });
  expect(state.voltage.currentVoltage).toBe(102n);
  expect(state.resourceBoosts[0]?.uses).toBeNull();
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(1);
  state = fillHand({
    ...shuffleHand(state, { recoverDiscard: true, destination: 'draw' }),
    drawContext: 'skill',
    usedCard: { charactersId: 0, unitIds: [2] },
  });
  expect(state.hand).toContain('frost-pulse');
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(2);
});

it('共演の30万回収は最低値1の0.1APを最後に切り捨て、増幅後に1以上なら回復する', () => {
  const initial = game('library');
  let state = withHand(
    {
      ...initial,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
      ap: { ...initial.ap, currentAp: 0 },
    },
    ['library-ensemble'],
  );
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.ap.currentAp).toBe(0);
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.ap.currentAp).toBe(0);
});

it('APは小数のまま増幅して最後に切り捨て、先に1へ切り上げない', () => {
  const baseState = game();
  expect(
    applyEffect(
      {
        ...baseState,
        hand: [],
        handEffectCardIds: [],
        amplification: 100,
        ap: { ...baseState.ap, currentAp: 0 },
      },
      { kind: 'ap', amount: 0.1 },
    ).ap.currentAp,
  ).toBe(0);
  const baseState2 = game();
  expect(
    applyEffect(
      {
        ...baseState2,
        hand: [],
        handEffectCardIds: [],
        amplification: 1100,
        ap: { ...baseState2.ap, currentAp: 0 },
      },
      { kind: 'ap', amount: 0.1 },
    ).ap.currentAp,
  ).toBe(1);
  const baseState3 = game();
  expect(
    applyEffect(
      {
        ...baseState3,
        hand: [],
        handEffectCardIds: [],
        amplification: 150,
        ap: { ...baseState3.ap, currentAp: 0 },
      },
      { kind: 'ap', amount: 3 },
    ).ap.currentAp,
  ).toBe(4);
});
