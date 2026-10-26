import { expect, it } from 'vite-plus/test';
import { createComboInduceEffect } from '../../src/domain/game/actionTypeEffects/comboInduce';

it('ActionType24はメンバー指定と期限をlongのint32化でEffectへ変換する', () => {
  const effect = createComboInduceEffect({
    skillEffectId: 24n,
    details: [
      { id: 1n, detailType: 'COMBO_INDUCE_MEMBER_PARAMS', value: (1n << 32n) + 1021n },
      { id: 2n, detailType: 'COMBO_INDUCE_MEMBER_PARAMS', value: 1041n },
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
