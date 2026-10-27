import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createVoltageConvertEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/voltageConvert';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType22はlong詳細値を参照実装同様にint32へ変換して効果を作る', () => {
  const effect = createVoltageConvertEffect({
    skillEffectId: 10n,
    details: [
      { id: 1n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_TYPE', value: 2n },
      { id: 2n, detailType: 'CONVERT_VOLTAGE_UP_NUM', value: (1n << 32n) + 25000n },
      { id: 3n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_DISPLAY_TIME_TYPE', value: 2n },
      { id: 4n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_DISPLAY_TIME', value: (1n << 32n) + 3n },
      { id: 5n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_DISABLED_TYPE', value: 1n },
      { id: 6n, detailType: 'CONVERT_VOLTAGE_UP_DISPLAY_TIME_TYPE', value: 3n },
      { id: 7n, detailType: 'CONVERT_VOLTAGE_UP_DISPLAY_TIME', value: 0n },
      { id: 8n, detailType: 'CONVERT_VOLTAGE_UP_DISABLED_TYPE', value: 1n },
      { id: 9n, detailType: 'CONVERT_VOLTAGE_UP_DISABLED', value: (1n << 32n) + 2n },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'voltage-convert',
    destination: 'love',
    num: 25000,
    outputDuration: { kind: 'sections', value: 3 },
    convertDisabledType: 1,
    displayDuration: { kind: 'stage', value: 0 },
    disabledType: 1,
    disabledValue: (1n << 32n) + 2n,
  });
});

it('ActionType22の詳細レコードをcreateGameで電圧変換効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 22_001_1n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_TYPE', value: 2n },
    { id: 22_001_2n, detailType: 'CONVERT_VOLTAGE_UP_NUM', value: 25_000n },
    { id: 22_001_3n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_DISPLAY_TIME_TYPE', value: 1n },
    { id: 22_001_4n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_DISPLAY_TIME', value: 1000n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 22 as const,
              skillEffectId: 22_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'voltage-convert');
  expect(effect).toEqual(createVoltageConvertEffect({ skillEffectId: 22_001n, details }));
});

it('ActionType22のHandPermanent詳細レコードは自動期限を止め、離脱時に解除する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 22_002_1n, detailType: 'CONVERT_VOLTAGE_UP_CONVERT_TYPE', value: 1n },
    { id: 22_002_2n, detailType: 'CONVERT_VOLTAGE_UP_NUM', value: 10_000n },
    { id: 22_002_3n, detailType: 'CONVERT_VOLTAGE_UP_DISPLAY_TIME_TYPE', value: 1n },
    { id: 22_002_4n, detailType: 'CONVERT_VOLTAGE_UP_DISPLAY_TIME', value: 100n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 22 as const,
              skillEffectId: 22_002n,
              destination: 'handPermanentEffects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.id === source.id);
  if (!compiled) throw new Error('ActionType22の発動元カードがありません。');
  const activated = activateHandPermanentEffects(state, compiled);
  expect(activated.voltageConversions).toHaveLength(1);
  expect(activated.voltageConversions[0]?.remainingSeconds).toBeNull();
  expect(disposeHandEffects(activated, [compiled.id]).voltageConversions).toHaveLength(0);
});
