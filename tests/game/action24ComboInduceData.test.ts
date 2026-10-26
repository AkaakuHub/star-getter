import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createComboInduceEffect } from '../../src/domain/game/actionTypeEffects/comboInduce';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType24はメンバー指定と期限をlongのint32化でEffectへ変換する', () => {
  const effect = createComboInduceEffect({
    skillEffectId: 24n,
    details: [
      {
        id: 1n,
        detailType: 'COMBO_INDUCE_MEMBER_PARAMS',
        value: 0n,
        paramValues: [1021n, 1041n],
      },
      { id: 3n, detailType: 'COMBO_INDUCE_AP_POWER', value: (1n << 32n) + 10_000n },
      { id: 4n, detailType: 'COMBO_INDUCE_DISPLAY_TIME_TYPE', value: 2n },
      { id: 5n, detailType: 'COMBO_INDUCE_DISPLAY_TIME', value: (1n << 32n) + 3n },
      { id: 6n, detailType: 'COMBO_INDUCE_REPEAT_ACTION', value: 2n },
    ],
    effects: [{ kind: 'mood', amount: 1 }],
  });

  expect(effect).toMatchObject({
    kind: 'combo-induce',
    members: [1021, 1041],
    apPower: (1n << 32n) + 10_000n,
    repeatAction: 2,
    duration: { kind: 'sections', value: 3 },
  });
});

it('ActionType24は対象メンバー配列をlongのまま検証し、int32折返しで別メンバーにしない', () => {
  expect(() =>
    createComboInduceEffect({
      skillEffectId: 24n,
      details: [
        {
          id: 1n,
          detailType: 'COMBO_INDUCE_MEMBER_PARAMS',
          value: 0n,
          paramValues: [(1n << 32n) + 1021n],
        },
      ],
      effects: [],
    }),
  ).toThrow('コンボ誘発の対象メンバーが正しくありません。');
});

it('ActionType24の詳細レコードと子効果をcreateGameで接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    {
      id: 24_001_0n,
      detailType: 'COMBO_INDUCE_MEMBER_PARAMS',
      value: 0n,
      paramValues: [1021n],
    },
    { id: 24_001_1n, detailType: 'COMBO_INDUCE_AP_POWER', value: 10_000n },
    { id: 24_001_2n, detailType: 'COMBO_INDUCE_DISPLAY_TIME_TYPE', value: 3n },
    { id: 24_001_3n, detailType: 'COMBO_INDUCE_REPEAT_ACTION', value: 1n },
  ] as const;
  const childEffects = [{ kind: 'energy' as const, amount: 2 }];
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 24 as const,
              skillEffectId: 24_001n,
              destination: 'effects' as const,
              details,
              childEffects,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'combo-induce');
  expect(effect).toEqual(
    createComboInduceEffect({ skillEffectId: 24_001n, details, effects: childEffects }),
  );
});
