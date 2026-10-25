import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { addHearts, collectHearts } from '../../src/domain/game/hearts';
import { game, withHand } from './support/game';

it('開花中の元気条件は成立し、雨100のときだけ対象限定の追加効果を付与する', () => {
  const initial = game();
  const state = withHand(
    {
      ...initial,
      moodOffset: -100,
      stamina: 80,
      amplification: 100,
      targetBoosts: [],
      bloom: { progress: 1n, strength: 3.5, rollback: { energy: 0, stamina: 80, excitement: 0 } },
    },
    ['sunrise'],
  );
  const sun = state.deck.find((card) => card.id === 'sunrise');
  if (!sun) throw new Error('晴れ間の輪がありません。');
  const effects = sun.effects.filter((effect) => effect.kind === 'conditional');
  const next = effects.reduce((current, effect) => applyEffect(current, effect, sun), state);
  expect(next.resourceBoosts).toEqual([
    { target: 'excitement', percent: 450, uses: 3, members: [1042] },
    { target: 'attract', percent: 1350, uses: 3, members: [1042] },
  ]);
  const other = next.deck.find((card) => card.id === 'frost-pulse');
  const kozu = next.deck.find((card) => card.id === 'rain-preparation');
  if (!other || !kozu) throw new Error('対象カードがありません。');
  expect(
    applyEffect(next, { kind: 'excitement', amount: 100 }, other).resourceBoosts[0]?.uses,
  ).toBe(3);
  expect(applyEffect(next, { kind: 'excitement', amount: 100 }, kozu).resourceBoosts[0]?.uses).toBe(
    2,
  );
  const sunny = effects.reduce((current, effect) => applyEffect(current, effect, sun), {
    ...state,
    moodOffset: 0,
  });
  expect(sunny.resourceBoosts).toHaveLength(0);
});

it('雨100で3000回収すると一度だけ区間保護と自然発生1個を付与する', () => {
  const initial = game();
  let state = withHand(
    { ...initial, moodOffset: -100, hearts: { ...initial.hearts, heartLimit: 10000 } },
    ['sunrise'],
  );
  state = collectHearts(addHearts(state, 3000));
  expect(state.sectionMentalProtected).toBe(true);
  expect(state.sectionBeatHeartBonus).toBe(1);
  state = collectHearts(addHearts(state, 3000));
  expect(state.sectionBeatHeartBonus).toBe(1);
});

it('きらめき獲得の次1回だけHeartUpを消費する', () => {
  let state = withHand(
    {
      ...game(),
      amplification: 100,
      targetBoosts: [],
      hearts: { ...game().hearts, stageHearts: [], hiddenHeartBatches: [] },
    },
    [],
  );
  state = applyEffect(state, { kind: 'heart-boost', percent: 100, uses: 1 });
  state = applyEffect(state, { kind: 'hearts', amount: 10 });
  expect(state.heartBoosts).toHaveLength(0);
  expect(state.hearts.stageHearts.length).toBe(20);
});
