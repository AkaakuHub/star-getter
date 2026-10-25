import { expect, it } from 'vite-plus/test';
import type { GameState } from '../../src/domain/game/model';
import { act } from '../../src/domain/game/actions';
import { canUseSpecial, specialCards } from '../../src/domain/game/special';
import { game, withHand } from './support/game';

it('共鳴はセンターの通常効果と基本カードの追加効果だけを選択する', () => {
  expect(specialCards(game('library')).map((card) => card.id)).toEqual([
    'library-pages',
    'library-ensemble',
  ]);
  expect(specialCards(game()).map((card) => card.id)).toEqual([
    'horizon',
    'library-ensemble',
    'frost-pulse',
  ]);
});

it('初回の共鳴で30枚を生成し、追加の共鳴で上限を20へ増やして通常の共鳴を復帰させる', () => {
  const initial = { ...game('library'), energy: 10 };
  const prepared = act(initial, { type: 'special', cardId: 'library-pages' });
  expect(prepared.energy).toBe(7);
  expect(prepared.hand).toHaveLength(8);
  expect(prepared.deck).toHaveLength(36);
  expect(act(prepared, { type: 'special', cardId: 'library-pages' })).toBe(prepared);
  const extended = act(prepared, { type: 'special', cardId: 'library-ensemble' });
  expect(extended.energy).toBe(4);
  expect(extended.maxEnergy).toBe(20);
  expect(extended.deck).toHaveLength(36);
  expect(extended.specialUsed).toEqual(['library-ensemble']);
  expect(canUseSpecial(extended, 'library-pages')).toBe(true);
  expect(act(extended, { type: 'special', cardId: 'library-ensemble' })).toBe(extended);
});

it('停止中も性能画面で使用条件を確認できるが、使用操作は進行中だけ受け付ける', () => {
  const paused = act({ ...game('library'), energy: 10 }, { type: 'pause' });
  expect(canUseSpecial(paused, 'library-pages')).toBe(true);
  expect(act(paused, { type: 'special', cardId: 'library-pages' })).toBe(paused);
  expect(canUseSpecial({ ...paused, energy: 2 }, 'library-pages')).toBe(false);
});

it('3回使用で通常の共鳴を戻して除外し、追加の共鳴は使用済みのまま維持する', () => {
  let state: GameState = { ...game('library'), specialUsed: ['library-pages', 'library-ensemble'] };
  for (let count = 1; count <= 3; count++) {
    state = withHand({ ...state, energy: 20, tick: count * 20 }, ['class']);
    state = act(state, { type: 'card', index: 0 });
    expect(state.cardUseCounts.class).toBe(count);
    expect(state.deck.some((card) => card.id === 'class')).toBe(count < 3);
    expect(state.specialUsed).toEqual(
      count < 3 ? ['library-pages', 'library-ensemble'] : ['library-ensemble'],
    );
  }
  expect([...state.hand, ...state.drawPile, ...state.discard]).not.toContain('class');
});
