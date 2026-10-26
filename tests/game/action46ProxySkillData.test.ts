import { expect, it } from 'vite-plus/test';
import { createProxySkillEffect } from '../../src/domain/game/actionTypeEffects/proxySkill';

it('ActionType46は各詳細値と解決済みの吸収・誘発Effectを接続する', () => {
  const effects = [{ actionType: 2, effect: { kind: 'voltage-set' as const, amount: 10 } }];
  expect(
    createProxySkillEffect({
      skillEffectId: 46n,
      absorbActionTypes: [2n],
      absorbAmounts: [2_147_483_648n],
      effects,
      details: [
        { id: 1n, detailType: 'PROXY_SKILL_ABSORB_LIMIT', value: 3n },
        { id: 2n, detailType: 'PROXY_SKILL_ABSORB_PERIOD_TYPE', value: 5n },
        { id: 3n, detailType: 'PROXY_SKILL_ABSORB_PERIOD_PARAM', value: 10n },
        { id: 4n, detailType: 'PROXY_SKILL_INDUCE_TIMING', value: 1n },
        { id: 5n, detailType: 'PROXY_SKILL_INDUCE_CONDITION', value: 2n },
        { id: 6n, detailType: 'PROXY_SKILL_INDUCE_POWER_TYPE', value: 3n },
        { id: 7n, detailType: 'PROXY_SKILL_INDUCE_POWER_PARAM', value: 16_777_217n },
      ],
    }),
  ).toEqual({
    kind: 'proxy-skill',
    absorbLimit: 3,
    periodType: 5,
    periodParam: 10,
    induceTiming: 1,
    induceCondition: 2,
    inducePowerType: 3,
    inducePowerParam: Math.fround(16_777_217),
    targets: [{ actionType: 2, targetAmount: -2_147_483_648 }],
    effects,
  });
});

it('ActionType46は必須の吸収配列がない場合に不正として扱う', () => {
  expect(() =>
    createProxySkillEffect({
      skillEffectId: 46n,
      absorbActionTypes: null,
      absorbAmounts: [],
      effects: [],
      details: [],
    }),
  ).toThrow('Proxyスキルの吸収対象が正しくありません。');
});
