import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { addHearts } from '../../src/domain/game/hearts';
import { applyEffect } from '../../src/domain/game/effects';
import { fillHand, shuffleHand } from '../../src/domain/game/cards/drawing';
import { game, withHand } from './support/game';

it('最低値1の30万回収で1.5%の熱気回復増幅を全ステージに付与し、回数で消費しない', () => {
  const initial = game();
  let state = withHand(
    {
      ...initial,
      targetBoosts: [],
      moodOffset: -150,
      energy: 0,
      excitement: 0,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
    },
    ['frost-pulse'],
  );
  state = act(addHearts(state, 299_999), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(0);
  state = act(addHearts(state, 1), { type: 'collect' });
  expect(state.resourceBoosts).toEqual([{ target: 'excitement', percent: 1.5, uses: null }]);
  state = applyEffect(state, { kind: 'excitement', amount: 100 });
  expect(state.excitement).toBe(102);
  expect(state.resourceBoosts[0]?.uses).toBeNull();
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(1);
  state = fillHand({ ...shuffleHand(state), drawContext: 'skill', lastUsedUnit: 2 });
  expect(state.hand).toContain('frost-pulse');
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.resourceBoosts).toHaveLength(2);
});

it('共演の30万回収は最低値1の0.1APを切り上げて回復し、同じ手札では一度だけ発動する', () => {
  const initial = game('library');
  let state = withHand(
    {
      ...initial,
      energy: 0,
      hearts: { ...initial.hearts, heartLimit: 1_000_000, stageHearts: [], hiddenHeartBatches: [] },
    },
    ['library-ensemble'],
  );
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.energy).toBe(1);
  state = act(addHearts(state, 300_000), { type: 'collect' });
  expect(state.energy).toBe(1);
});
