import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { createHandCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7), { type: 'start' });
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
  expect(applied.tokenCardDeck.handTargetCounts.current).toBe(4);
  expect(applied.handLimitEffects[0]?.remainingSections).toBe((1n << 53n) + 1n);
});

it('ActionType20の詳細レコードはcreateGameで通常Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 20 as const,
              skillEffectId: 20_001n,
              destination: 'effects' as const,
              details: [
                { id: 20_001_1n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: 1n },
                {
                  id: 20_001_2n,
                  detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE',
                  value: 3n,
                },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  const effect = compiled?.effects.find((item) => item.kind === 'hand-limit');
  if (!effect) throw new Error('ActionType20が生成されていません。');
  expect(effect).toMatchObject({ kind: 'hand-limit', amount: 1, displayTimeType: 3 });
  const expected = applyEffect(
    state,
    createHandCardCountEffect({
      skillEffectId: 20_001n,
      details: [
        { id: 20_001_1n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: 1n },
        { id: 20_001_2n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE', value: 3n },
      ],
    }),
    compiled,
  );
  expect(applyEffect(state, effect, compiled)).toEqual(expected);
});

it('ActionType20の詳細レコードはHandPermanentで起動し、手札離脱時に解除する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 20 as const,
              skillEffectId: 20_002n,
              destination: 'handPermanentEffects' as const,
              details: [
                { id: 20_002_1n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: 1n },
                {
                  id: 20_002_2n,
                  detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE',
                  value: 1n,
                },
                { id: 20_002_3n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME', value: 1n },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  if (!compiled) throw new Error('カードがありません。');
  const active = activateHandPermanentEffects(state, compiled);
  const baseState = createGame(track, routes.genesis.deck, 7);
  const baseCard = baseState.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  if (!baseCard) throw new Error('比較対象のカードがありません。');
  const expected = activateHandPermanentEffects(baseState, {
    ...baseCard,
    handPermanentEffects: [
      createHandCardCountEffect({
        skillEffectId: 20_002n,
        details: [
          { id: 20_002_1n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: 1n },
          { id: 20_002_2n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE', value: 1n },
          { id: 20_002_3n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME', value: 1n },
        ],
      }),
    ],
  });
  expect(active.tokenCardDeck.handTargetCounts.current).toBe(
    expected.tokenCardDeck.handTargetCounts.current,
  );
  expect(active.handLimitEffects[0]?.remainingSeconds).toBeNull();
  expect(active.handLimitEffects[0]?.deactivationKey).toBe(
    `hand-permanent:${source.cardInstanceId}`,
  );
  expect(
    disposeHandEffects(active, [source.cardInstanceId]).tokenCardDeck.handTargetCounts.current,
  ).toBe(state.tokenCardDeck.handTargetCounts.current);
});

it('ActionType21の詳細レコードはcreateGameでAP回復速度Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 21 as const,
              skillEffectId: 21_001n,
              destination: 'effects' as const,
              details: [
                { id: 21_001_1n, detailType: 'CHANGE_AP_INCREASE_SPEED_NUM', value: 100n },
                {
                  id: 21_001_2n,
                  detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
                  value: 3n,
                },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  const effect = compiled?.effects.find((item) => item.kind === 'ap-speed-change');
  expect(effect).toMatchObject({ kind: 'ap-speed-change', calculationType: 1, num: 100n });
});

it('ActionType22の詳細レコードはcreateGameで熱気変換Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 22 as const,
              skillEffectId: 22_001n,
              destination: 'effects' as const,
              details: [
                { id: 22_001_1n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_TYPE', value: 1n },
                { id: 22_001_2n, detailType: 'CONVERT_VOLTAGE_UP_NUM', value: 100n },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  const effect = compiled?.effects.find((item) => item.kind === 'voltage-convert');
  expect(effect).toMatchObject({ kind: 'voltage-convert', destination: 'hearts', num: 100 });
});

it('ActionType23の詳細レコードはcreateGameで精神力連動ハートEffectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 23 as const,
              skillEffectId: 23_001n,
              destination: 'effects' as const,
              details: [
                { id: 23_001_1n, detailType: 'MENTAL_HEART_INDUCE_NUM', value: 100n },
                { id: 23_001_2n, detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'mental-heart-induce')).toMatchObject({
    kind: 'mental-heart-induce',
    num: 100n,
    duration: { kind: 'stage', value: 0n },
  });
});

it('ActionType25の詳細レコードはcreateGameできらめき上限Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 25 as const,
              skillEffectId: 25_001n,
              destination: 'effects' as const,
              details: [
                { id: 25_001_1n, detailType: 'CHANGE_HEART_LIMIT_NUM', value: 1n },
                { id: 25_001_2n, detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'heart-limit-change')).toMatchObject({
    kind: 'heart-limit-change',
    calculationType: 1,
    num: 1n,
    duration: { kind: 'stage' },
  });
});

it('ActionType29の詳細レコードはcreateGameでデッキAP変更Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 29 as const,
              skillEffectId: 29_001n,
              destination: 'effects' as const,
              details: [
                { id: 29_001_1n, detailType: 'CHANGE_DECK_AP_NUM', value: -1n },
                { id: 29_001_2n, detailType: 'CHANGE_DECK_AP_TARGET_RANGE', value: 1n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'deck-skill-cost-change')).toMatchObject({
    kind: 'deck-skill-cost-change',
    num: -1,
    targetRange: 1,
    target: 'all',
  });
});

it('ActionType30/31の詳細レコードはcreateGameで各追加バフへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 30 as const,
              skillEffectId: 30_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 31 as const,
              skillEffectId: 31_001n,
              destination: 'effects' as const,
              details: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.some((item) => item.kind === 'love-up-additional-buff')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'voltage-up-additional-buff')).toBe(true);
});
