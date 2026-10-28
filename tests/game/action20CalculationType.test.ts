import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createHandCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { expireHandLimitSections } from '@akaakuhub/suku-sute-core/game/effects/handLimit';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType20の未対応計算種別は初回加算せず、期限時の解除通知だけ行う', () => {
  const track = tracks[0];
  if (!track) throw new Error('テスト用データがありません。');
  const initial = createGame(track, routes.genesis.deck, 7);
  const effect = createHandCardCountEffect({
    skillEffectId: 20_010n,
    details: [
      { id: 20_010_1n, detailType: 'CHANGE_HAND_CARD_COUNT_CALC_TYPE', value: 2n },
      { id: 20_010_2n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: 1n },
      { id: 20_010_3n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE', value: 2n },
      { id: 20_010_4n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME', value: 1n },
    ],
  });
  const neutralState = { ...initial, amplification: 100 };
  const active = applyEffect(neutralState, effect);
  expect(active.handLimit).toBe(neutralState.handLimit);
  expect(active.handLimitEffects).toMatchObject([
    { amount: 0, expirationAmount: -1, remainingSections: 1n },
  ]);
  expect(expireHandLimitSections(active).state.handLimit).toBe(neutralState.handLimit - 1);
});
