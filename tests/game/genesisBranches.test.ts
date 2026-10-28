import { expect, it } from 'vite-plus/test';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { addHearts, collectHearts } from '@akaakuhub/suku-sute-core/game/hearts';
import { voltageThreshold } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { game, withHand } from './support/game';

function rainState(): GameState {
  return withHand(
    {
      ...game(),
      moodOffset: -100,
      currentVoltage: 0,
      currentMental: 80,
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
  const state = activateGenesis(rainState(), 1);
  const next = applyRainSkill(state);
  expect(next.currentVoltage).toBe(0);
  expect(next.currentMental).toBe(80);
  expect(next.hearts.heartLimit).toBe(58100);
  expect(next.boosts.map((boost) => boost.percent)).toEqual([
    225000, 135000, 90000, 45000, 22500, 4500,
  ]);
});

it('通常時は熱気ゲインの後に次のroot効果の段階を再判定する', () => {
  const state = { ...rainState(), currentVoltage: voltageThreshold(200) - 1 };
  const next = applyRainSkill(state);
  expect(next.hearts.heartLimit).toBe(2600);
  expect(next.boosts.map((boost) => boost.percent)).toEqual([22500]);
});

it('開花中の50万回収は通常の元気と熱気が未達でも枝と検索を実行する', () => {
  const initial = activateGenesis(rainState(), 1);
  if (initial.genesis.effects.length === 0) throw new Error('開花がありません。');
  const state = addHearts(
    {
      ...initial,
      genesis: { ...initial.genesis, currentGauge: 1_000_000 },
      hearts: { ...initial.hearts, heartLimit: 500_000 },
    },
    500_000,
  );
  const next = collectHearts(state);
  expect(next.stats.heartsCollected).toBe(500_000);
  expect(next.currentVoltage).toBe(0);
  expect(next.currentMental).toBe(80);
  expect(next.genesis.currentGauge).toBeLessThan(1_000_000);
  expect(next.hand).not.toEqual(state.hand);
});

it('熱気増幅の対象は追加メンバーを含む同じユニット全員になる', () => {
  const state = game();
  const pulse = state.deck.find((card) => card.id === 'frost-pulse');
  if (!pulse) throw new Error('凍空の鼓動がありません。');
  const next = pulse.effects.reduce((current, effect) => applyEffect(current, effect, pulse), {
    ...state,
    moodOffset: -100,
  });
  expect(next.targetBoosts.some((boost) => boost.members.includes(1042))).toBe(true);
});
