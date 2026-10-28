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
      currentAp: 0,
      currentVoltage: 0,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
    },
    ['frost-pulse'],
  );
  state = act(addHearts(state, 299_999), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(0);
  state = act(addHearts(state, 1), { type: 'collect' });
  expect(state.resourceBoosts).toEqual([{ target: 'voltage', percent: 2, uses: null }]);
  state = applyEffect(state, { kind: 'voltage', amount: 100 });
  expect(state.currentVoltage).toBe(102);
  expect(state.resourceBoosts[0]?.uses).toBeNull();
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(1);
  state = fillHand({
    ...shuffleHand(state, { recoverDiscard: true, destination: 'draw' }),
    drawContext: 'skill',
    lastUsedUnit: 2,
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
      currentAp: 0,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
    },
    ['library-ensemble'],
  );
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.currentAp).toBe(0);
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.currentAp).toBe(0);
});

it('APは小数のまま増幅して最後に切り捨て、先に1へ切り上げない', () => {
  expect(
    applyEffect(
      { ...game(), currentAp: 0, hand: [], handEffectCardIds: [], amplification: 100 },
      { kind: 'ap', amount: 0.1 },
    ).currentAp,
  ).toBe(0);
  expect(
    applyEffect(
      { ...game(), currentAp: 0, hand: [], handEffectCardIds: [], amplification: 1100 },
      { kind: 'ap', amount: 0.1 },
    ).currentAp,
  ).toBe(1);
  expect(
    applyEffect(
      { ...game(), currentAp: 0, hand: [], handEffectCardIds: [], amplification: 150 },
      { kind: 'ap', amount: 3 },
    ).currentAp,
  ).toBe(4);
});
