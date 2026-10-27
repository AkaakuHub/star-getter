import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createStopVoltageIncreaseEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/stopVoltageIncrease';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType26はlong詳細値をミリ秒float32またはパート数bigintとして保持する', () => {
  const milliseconds = createStopVoltageIncreaseEffect({
    skillEffectId: 26n,
    details: [
      { id: 1n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME_TYPE', value: 1n },
      { id: 2n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME', value: (1n << 53n) + 1n },
    ],
  });
  const sections = createStopVoltageIncreaseEffect({
    skillEffectId: 27n,
    details: [
      { id: 3n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME_TYPE', value: 2n },
      { id: 4n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME', value: (1n << 53n) + 1n },
    ],
  });

  expect(milliseconds).toMatchObject({
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: Math.fround(Number((1n << 53n) + 1n)) },
  });
  expect(sections).toMatchObject({
    kind: 'stop-voltage-increase',
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
  });
});

it('ActionType26詳細レコードをcreateGameから自然増加停止へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 26_001n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME_TYPE', value: 2n },
    { id: 26_002n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME', value: 3n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 26 as const,
              skillEffectId: 26_000n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7);
  const card = compiled.deck.find((item) => item.id === source.id);
  const effect = card?.effects.find((item) => item.kind === 'stop-voltage-increase');
  expect(effect).toEqual(createStopVoltageIncreaseEffect({ skillEffectId: 26_000n, details }));
  if (!card || !effect) throw new Error('ActionType26の効果が生成されませんでした。');
  expect(applyEffect(compiled, effect).voltageStops[0]?.remainingSections).toBe(3n);
});

it('ActionType26の期限0は自然増加停止要求を作らない', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲データがありません。');
  const state = createGame(track, routes.bloom.deck, 7);
  const card = state.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = createStopVoltageIncreaseEffect({
    skillEffectId: 26_000n,
    details: [
      { id: 1n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME_TYPE', value: 1n },
      { id: 2n, detailType: 'STOP_VOLTAGE_INCREASE_DISPLAY_TIME', value: 0n },
    ],
  });
  expect(applyEffect(state, effect, card).voltageStops).toHaveLength(0);
});
