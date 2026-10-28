import { expect, test } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { canUseCard } from '@akaakuhub/suku-sute-core/game/projection';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { rules, type GameState } from '@akaakuhub/suku-sute-core/game/model';
import { createConfiguredGame } from '../../src/app/createConfiguredGame';
import { addHearts, collectHearts, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { withHand } from './support/game';

const setup = {
  presetId: 'genesis',
  cardIds: ['signal-maker', 'even-rhythm', 'odd-rhythm', 'camera', 'class', 'perennial'],
} as const;

function initial(): GameState {
  return act(createConfiguredGame(setup, 7, 100), { type: 'start' });
}

function use(state: GameState, id: string): GameState {
  let ready = withHand(state, [id]);
  while (!canUseCard(ready, 0)) {
    ready = advanceTo(ready, (ready.tick + 1) / rules.ticksPerSecond);
    if (ready.phase !== 'playing') throw new Error('カードを使用できません。');
  }
  return act(ready, { type: 'card', index: 0 });
}

test('信号旗の生成と除外で偶数→奇数→偶数を操作して、それぞれの報酬を得る', () => {
  const start = initial();
  const even = use(start, 'even-rhythm');
  expect(even.hearts.heartLimit).toBeGreaterThan(start.hearts.heartLimit);
  expect(even.boosts.length).toBeGreaterThan(start.boosts.length);
  const generated = use(even, 'signal-maker');
  expect(generated.deck).toHaveLength(7);
  expect(generated.amplification).toBe(even.amplification + 1000);
  const pennant = generated.deck.find((card) => card.token === 'pennant');
  if (!pennant) throw new Error('信号旗がありません。');
  const odd = use(generated, 'odd-rhythm');
  expect(odd.stats.cardsUsed).toBe(3);
  expect(odd.sectionBeatHeartBonus).toBeGreaterThan(generated.sectionBeatHeartBonus);
  const returned = use(odd, pennant.id);
  expect(returned.deck).toHaveLength(6);
  expect(returned.cardPool.some((card) => card.id === pennant.id)).toBe(true);
  expect([...returned.hand, ...returned.drawPile, ...returned.discard]).not.toContain(pennant.id);
  const repeated = use(returned, 'even-rhythm');
  expect(repeated.boosts.length).toBeGreaterThan(returned.boosts.length);
  expect(repeated.genesis.effects).toHaveLength(0);
});

test('偶数枚で三拍子を使っても、奇数枚で二拍子を使っても報酬は発動しない', () => {
  const start = initial();
  const wrongOdd = use(start, 'odd-rhythm');
  expect(wrongOdd.sectionBeatHeartBonus).toBe(start.sectionBeatHeartBonus);
  const odd = use(start, 'signal-maker');
  const wrongEven = use(odd, 'even-rhythm');
  expect(wrongEven.hearts.heartLimit).toBe(odd.hearts.heartLimit);
  expect(wrongEven.boosts).toEqual(odd.boosts);
});

test('三拍子を手札に残した回収は奇数枚でだけきらめきを補充する', () => {
  const start = applyEffect(initial(), { kind: 'heart-limit', amount: 500000 });
  const even = collectHearts(addHearts(withHand(start, ['odd-rhythm']), 500000));
  expect(heartCount(even)).toBe(0);
  const prepared = use(use(start, 'even-rhythm'), 'signal-maker');
  const odd = collectHearts(addHearts(withHand(prepared, ['odd-rhythm']), 500000));
  expect(heartCount(odd)).toBeGreaterThanOrEqual(500000);
  const pennant = odd.deck.find((card) => card.token === 'pennant');
  if (!pennant) throw new Error('信号旗がありません。');
  const returned = use(odd, pennant.id);
  const stopped = collectHearts(addHearts(withHand(returned, ['odd-rhythm']), 500000));
  expect(heartCount(stopped)).toBe(0);
});
