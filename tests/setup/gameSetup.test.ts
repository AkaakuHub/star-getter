import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { expect, test } from 'vite-plus/test';
import {
  createPresetSetup,
  moveSetupCard,
  setupCards,
  setupProblem,
  toggleSetupCard,
} from '../../src/app/setup/gameSetup';
import { createConfiguredGame } from '../../src/app/createConfiguredGame';
import { routes } from '../../src/content/routes';

test('編成の変更と並べ替えは元のプリセットを変更しない', () => {
  const initial = createPresetSetup('library');
  const original = [...initial.cardDatasIds];
  const added = toggleSetupCard(initial, 'frost-pulse');
  const moved = moveSetupCard(added, 'frost-pulse', -1);
  const removed = toggleSetupCard(moved, 'camera');
  expect(initial.cardDatasIds).toEqual(original);
  expect(createPresetSetup('library').cardDatasIds).toEqual(original);
  expect(routes.library.deck.map((card) => card.cardInstanceId)).toEqual(original);
  expect(removed.cardDatasIds).not.toContain('camera');
  expect(moved.cardDatasIds.at(-2)).toBe('frost-pulse');
});

test('開始処理は選択したカードと先頭のカードを共通ゲームへ渡す', () => {
  let setup = createPresetSetup('library');
  setup = toggleSetupCard(setup, 'frost-pulse');
  setup = moveSetupCard(setup, 'library-invitation', -1);
  const state = createConfiguredGame(setup, 7, 100);
  expect(state.deck.map((card) => card.cardDatasId)).toEqual(setup.cardDatasIds);
  expect(liveCurrentHandCardInstanceIds(state)[0]).toBe('library-invitation');
  expect(state.scoreMultiplier).toBe(2n);
  expect(state.phase).toBe('ready');
});

test.each([
  { cardDatasIds: [] },
  { cardDatasIds: ['class', 'class', 'camera'] },
  { cardDatasIds: ['missing', 'class', 'camera'] },
])('不正な編成%sは共通検証を通らない', ({ cardDatasIds }) => {
  const setup = { presetId: 'library' as const, cardDatasIds };
  expect(() => setupCards(setup)).toThrow(/編成/);
  expect(setupProblem(setup)).not.toBeNull();
});

test('開始と同じ検証で両プリセットの編成を確認する', () => {
  expect(setupProblem(createPresetSetup('library'))).toBeNull();
  expect(setupProblem(createPresetSetup('genesis'))).toBeNull();
});
