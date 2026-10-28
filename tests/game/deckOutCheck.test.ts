import { expect, it } from 'vite-plus/test';
import { completeDeckOutChecks } from '@akaakuhub/suku-sute-core/game/effects/deckOutCheck';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

it('蓄積した回数だけAfterDeckReload効果を適用してからカウンターを0にする', () => {
  const base = game();
  const initial = {
    ...base,
    deckBoard: { ...base.deckBoard, deckOutCount: 3 },
    track: { ...base.track, afterDeckReloadEffects: [{ kind: 'ap' as const, amount: 2 }] },
  };
  const first = completeDeckOutChecks(initial, applyEffect);
  const second = completeDeckOutChecks(first, applyEffect);
  expect(first.deckBoard.deckOutCount).toBe(0);
  expect(first.afterDeckReloadEvents).toBe(3);
  expect(first.ap.currentAp).toBe(initial.ap.currentAp + 6);
  expect(second).toEqual(first);
});

it('デッキアウトがなければAfterDeckReload通知を送らない', () => {
  const initial = game();
  expect(completeDeckOutChecks(initial)).toEqual(initial);
});

it('再読み込み時の分岐効果によるCheckDeckOutは現在の通知後に処理する', () => {
  const base = game();
  const initial = {
    ...base,
    deckBoard: { ...base.deckBoard, deckOutCount: 2 },
    track: {
      ...base.track,
      afterDeckReloadEffects: [
        {
          kind: 'branch' as const,
          condition: { kind: 'always' as const },
          whenTrue: [{ kind: 'ap' as const, amount: 1 }],
          whenFalse: [],
        },
      ],
    },
  };
  const result = completeDeckOutChecks(initial, applyEffect);
  expect(result.afterDeckReloadEvents).toBe(2);
  expect(result.ap.currentAp).toBe(initial.ap.currentAp + 2);
  expect(result.deckBoard.deckOutCount).toBe(0);
  expect(result.deckActions.queue).toEqual([]);
  expect(result.deckActions.currentAction).toBeNull();
});
