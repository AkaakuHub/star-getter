import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { createHandCardCountEffect } from '../../src/domain/game/actionTypeEffects/handCardCount';
import { applyEffect } from '../../src/domain/game/effects';
import { createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 7), { type: 'start' });
}

it('ActionType20のlong詳細値をint32化し、パート期限をlongで保持する', () => {
  const effect = createHandCardCountEffect({
    skillEffectId: 90545010017n,
    details: [
      { id: 905450100170n, detailType: 'CHANGE_HAND_CARD_COUNT_CALC_TYPE', value: 1n },
      {
        id: 905450100171n,
        detailType: 'CHANGE_HAND_CARD_COUNT_NUM',
        value: (1n << 32n) - 1n,
      },
      { id: 905450100172n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE', value: 2n },
      {
        id: 905450100173n,
        detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME',
        value: (1n << 53n) + 1n,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'hand-limit',
    calculationType: 1,
    amount: -1,
    displayTimeType: 2,
    displayTime: (1n << 53n) + 1n,
    skillEffectId: 90545010017n,
  });
  const applied = applyEffect(game(), effect);
  expect(applied.handLimit).toBe(4);
  expect(applied.handLimitEffects[0]?.remainingSections).toBe((1n << 53n) + 1n);
});
