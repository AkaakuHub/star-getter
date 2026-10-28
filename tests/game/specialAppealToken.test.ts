import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { activateSpecialAppealToken } from '@akaakuhub/suku-sute-core/game/effects/specialAppealToken';
import type { AddSpecialAppealTokenEffect } from '@akaakuhub/suku-sute-core/game/specialAppealTokenTypes';
import { canUseSpecial } from '@akaakuhub/suku-sute-core/game/special';
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
    musicGenerationsId: 1021,
    sourceSkillLevel: 3,
    sourceSpecialAppealSkillLevel: 1,
    memberOrder: [1022, 1021],
    tokenCardSets: [
      {
        id: 2,
        tokenSetId: 8,
        resourceId: 202,
        targetParameter: 1022,
        orderId: 2,
        skillSeriesId: 20,
        cardsBySkillLevel: [{ skillLevel: 3, card: base }],
      },
      {
        id: 1,
        tokenSetId: 8,
        resourceId: 201,
        targetParameter: 1021,
        orderId: 1,
        skillSeriesId: 10,
        cardsBySkillLevel: [{ skillLevel: 3, card: base }],
      },
    ],
  };
  const withToken = activateSpecialAppealToken(state, effect);
  expect(withToken.specialAppealTokens.map((token) => token.recordId)).toEqual([2, 1]);
  expect(activateSpecialAppealToken(withToken, effect).specialAppealTokens).toHaveLength(2);
  expect(withToken.specialAppealTokens[0]?.card.cardInstanceId).toBe('202');
});

it('初期クールタイムを音楽GenerationsIdと一致する既存トークンから引き継ぐ', () => {
  const state = game();
  const base = state.deck.find((card) => card.special);
  if (!base?.special) throw new Error('共鳴カードがありません。');
  const existingToken = {
    recordId: 9,
    tokenSetId: 7,
    targetMember: 1021 as const,
    card: { ...base, charactersId: 0 as const },
    coolTime: 0,
    remainingCoolTime: 6,
  };
  const effect: AddSpecialAppealTokenEffect = {
    kind: 'special-appeal-token',
    tokenSetId: 8,
    coolTime: 12,
    targetType: 1,
    levelType: 2,
    musicGenerationsId: 1021,
    sourceSkillLevel: 3,
    sourceSpecialAppealSkillLevel: 1,
    memberOrder: [1022],
    tokenCardSets: [
      {
        id: 1,
        tokenSetId: 8,
        resourceId: 201,
        targetParameter: 1022,
        orderId: 1,
        skillSeriesId: 10,
        cardsBySkillLevel: [{ skillLevel: 3, card: base }],
      },
    ],
  };

  const next = activateSpecialAppealToken(
    { ...state, specialAppealTokens: [existingToken] },
    effect,
  );

  expect(next.specialAppealTokens[1]?.remainingCoolTime).toBe(6);
});

it('トークン共鳴を使うと同じTokenSetIdのクールタイムだけ開始する', () => {
  const state = game();
  const base = state.deck.find((card) => card.special);
  if (!base?.special) throw new Error('共鳴カードがありません。');
  const token = {
    recordId: 1,
    tokenSetId: 8,
    targetMember: 1021 as const,
    card: {
      ...base,
      cardInstanceId: '201',
      cardDatasId: '201',
      charactersId: 0 as const,
      special: { ...base.special, effects: [] },
    },
    coolTime: 12,
    remainingCoolTime: 0,
  };
  const sameGenerationOtherSet = {
    ...token,
    recordId: 2,
    tokenSetId: 9,
    targetMember: 1021 as const,
    coolTime: 6,
    remainingCoolTime: 0,
  };
  const otherGeneration = {
    ...token,
    recordId: 3,
    targetMember: 1022 as const,
    coolTime: 18,
    remainingCoolTime: 0,
  };
  const ready = {
    ...state,
    specialAppealTokens: [token, sameGenerationOtherSet, otherGeneration],
    ap: { ...state.ap, currentAp: 20 },
  };
  expect(canUseSpecial(ready, '201')).toBe(true);
  const used = act(ready, { type: 'special', cardId: '201' });
  expect(used.specialAppealTokens[0]?.remainingCoolTime).toBe(
    Math.fround((12 * state.track.songTime) / 10_000),
  );
  expect(used.specialAppealTokens[1]?.remainingCoolTime).toBe(0);
  expect(used.specialAppealTokens[2]?.remainingCoolTime).toBe(
    Math.fround((18 * state.track.songTime) / 10_000),
  );
  expect(used.specialUsed).not.toContain('201');
  expect(canUseSpecial(used, '201')).toBe(false);
});
