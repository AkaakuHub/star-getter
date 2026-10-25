import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { activateSpecialAppealToken } from '../../src/domain/game/effects/specialAppealToken';
import type { AddSpecialAppealTokenEffect } from '../../src/domain/game/specialAppealTokenTypes';
import { canUseSpecial } from '../../src/domain/game/special';
import { game } from './support/game';

it('対象メンバーのトークンだけを順序付きで追加し、同じ記録を重複させない', () => {
  const state = game();
  const base = state.deck.find((card) => card.special);
  if (!base?.special) throw new Error('共鳴カードがありません。');
  const effect: AddSpecialAppealTokenEffect = {
    kind: 'special-appeal-token',
    tokenSetId: 8,
    coolTime: 12,
    targetType: 1,
    levelType: 2,
    sourceSkillLevel: 3,
    sourceSpecialAppealSkillLevel: 1,
    memberOrder: [1021],
    tokenCardSets: [
      {
        id: 2,
        tokenSetId: 8,
        resourceId: 202,
        targetParameter: 1022,
        orderId: 1,
        skillSeriesId: 20,
        cardsBySkillLevel: [{ skillLevel: 3, card: base }],
      },
      {
        id: 1,
        tokenSetId: 8,
        resourceId: 201,
        targetParameter: 1021,
        orderId: 2,
        skillSeriesId: 10,
        cardsBySkillLevel: [{ skillLevel: 3, card: base }],
      },
    ],
  };
  const withToken = activateSpecialAppealToken(state, effect);
  expect(withToken.specialAppealTokens.map((token) => token.recordId)).toEqual([1]);
  expect(activateSpecialAppealToken(withToken, effect).specialAppealTokens).toHaveLength(1);
  expect(withToken.specialAppealTokens[0]?.card.id).toBe('201');
});

it('トークン共鳴を使うと同じセットのクールタイムを開始する', () => {
  const state = game();
  const base = state.deck.find((card) => card.special);
  if (!base?.special) throw new Error('共鳴カードがありません。');
  const token = {
    recordId: 1,
    tokenSetId: 8,
    targetMember: 1021 as const,
    card: {
      ...base,
      id: '201',
      member: 0 as const,
      special: { ...base.special, effects: [] },
    },
    coolTime: 12,
    remainingCoolTime: 0,
  };
  const ready = { ...state, energy: 20, specialAppealTokens: [token] };
  expect(canUseSpecial(ready, '201')).toBe(true);
  const used = act(ready, { type: 'special', cardId: '201' });
  expect(used.specialAppealTokens[0]?.remainingCoolTime).toBe(
    Math.fround((12 * state.track.songTime) / 10_000),
  );
  expect(used.specialUsed).not.toContain('201');
  expect(canUseSpecial(used, '201')).toBe(false);
});
