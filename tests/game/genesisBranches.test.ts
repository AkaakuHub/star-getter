import { expect, it } from 'vite-plus/test';
import { activateBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
import { addHearts, collectHearts } from '../../src/domain/game/hearts';
import { voltageThreshold } from '../../src/domain/game/live/voltageLevel';
import type { GameState } from '../../src/domain/game/model';
import { game, withHand } from './support/game';

function rainState(): GameState {
  return withHand(
    {
      ...game(),
      moodOffset: -100,
      excitement: 0,
      stamina: 80,
      amplification: 100,
      targetBoosts: [],
      resourceBoosts: [],
    },
    ['frost-echo'],
  );
}

function applyRainSkill(state: GameState): GameState {
  const card = state.deck.find((item) => item.id === 'frost-echo');
  if (!card) throw new Error('雨音のカードがありません。');
  return card.effects.reduce((next, effect) => applyEffect(next, effect, card), state);
}

it('開花中は通常値を保持したまま全段階を高い枝から順に発動する', () => {
  const state = activateBloom(rainState(), 1);
  const next = applyRainSkill(state);
  expect(next.excitement).toBe(0);
  expect(next.stamina).toBe(80);
  expect(next.hearts.heartLimit).toBe(58100);
  expect(next.boosts.map((boost) => boost.percent)).toEqual([
    225000, 135000, 90000, 45000, 22500, 4500,
  ]);
});

it('通常時は熱気ゲインの後に次のroot効果の段階を再判定する', () => {
  const state = { ...rainState(), excitement: voltageThreshold(200) - 1 };
  const next = applyRainSkill(state);
  expect(next.hearts.heartLimit).toBe(2600);
  expect(next.boosts.map((boost) => boost.percent)).toEqual([22500]);
});

it('開花中の50万回収は通常の元気と熱気が未達でも枝と検索を実行する', () => {
  const initial = activateBloom(rainState(), 1);
  if (!initial.bloom) throw new Error('開花がありません。');
  const state = addHearts(
    {
      ...initial,
      bloom: { ...initial.bloom, progress: 1_000_000n },
      hearts: { ...initial.hearts, heartLimit: 500_000 },
    },
    500_000,
  );
  const next = collectHearts(state);
  expect(next.stats.heartsCollected).toBe(500_000);
  expect(next.excitement).toBe(0);
  expect(next.stamina).toBe(80);
  expect(next.bloom?.progress).toBeLessThan(1_000_000n);
  expect(next.hand).not.toEqual(state.hand);
});
