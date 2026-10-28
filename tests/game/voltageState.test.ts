import { expect, test } from 'vite-plus/test';
import { changeResource } from '@akaakuhub/suku-sute-core/game/resources';
import { advanceAutomaticGauges } from '@akaakuhub/suku-sute-core/game/automaticGauges';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { voltageLevel } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { game } from './support/game';

test('Voltageポイントはレベル上限を超えても64ビット整数のまま保持する', () => {
  const state = game();
  const after = changeResource(
    {
      ...state,
      voltage: { ...state.voltage, currentVoltage: 9_007_199_254_740_993n },
    },
    'voltage',
    1n,
  );
  expect(after.voltage.currentVoltage).toBe(9_007_199_254_740_994n);
  expect(voltageLevel(after.voltage.currentVoltage, after.maximumVoltageLevel)).toBe(1000);
});

test('回復間隔0のVoltage更新は共通設定でGenesisへ変換し、通常ポイントを保持する', () => {
  const state = game();
  const active = activateGenesis(
    {
      ...state,
      maximumVoltageLevel: 2,
      ap: { ...state.ap, currentAp: state.ap.maxAp },
      voltage: { currentVoltage: 10n, timerSeconds: 0 },
      track: {
        ...state.track,
        stage: {
          ...state.track.stage,
          voltageIncreaseIntervalSeconds: 0,
          mentalDecreaseIntervalSeconds: 100,
        },
      },
    },
    1,
  );
  const after = advanceAutomaticGauges(active, 0.5);
  expect(after.voltage).toEqual({ currentVoltage: 10n, timerSeconds: 0.5 });
  expect(after.genesis.currentGauge).toBe(active.genesis.currentGauge + 5);
});
