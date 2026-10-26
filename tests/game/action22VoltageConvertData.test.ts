import { expect, it } from 'vite-plus/test';
import { createVoltageConvertEffect } from '../../src/domain/game/actionTypeEffects/voltageConvert';

it('ActionType22はlong詳細値をC#同様にint32へ変換して効果を作る', () => {
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
