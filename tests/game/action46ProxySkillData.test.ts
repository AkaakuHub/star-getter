import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceProxySkillUses } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { createProxySkillEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/proxySkill';
import { game } from './support/game';

it('ActionType46は各詳細値と解決済みの吸収・誘発Effectを接続する', () => {
  const effects = [{ actionType: 2, effect: { kind: 'voltage-set' as const, amount: 10 } }];
  expect(
    createProxySkillEffect({
      skillEffectId: 46n,
      effects,
      details: [
        {
          id: 8n,
          detailType: 'PROXY_SKILL_ABSORB_EFFECT_PARAMS_ID',
          value: 0n,
          paramValues: [2n],
        },
        {
          id: 9n,
          detailType: 'PROXY_SKILL_ABSORB_AMOUNT_PARAMS_ID',
          value: 0n,
          paramValues: [2_147_483_648n],
        },
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
    periodParam: 10n,
    induceTiming: 1,
    induceCondition: 2,
    inducePowerType: 3,
    inducePowerParam: 16_777_217n,
    targets: [{ actionType: 2, targetAmount: -2_147_483_648 }],
    effects,
  });
});

it('ActionType46は必須の吸収配列がない場合に不正として扱う', () => {
  expect(() =>
    createProxySkillEffect({
      skillEffectId: 46n,
      effects: [],
      details: [
        { id: 1n, detailType: 'PROXY_SKILL_ABSORB_EFFECT_PARAMS_ID', value: 0n },
        {
          id: 2n,
          detailType: 'PROXY_SKILL_ABSORB_AMOUNT_PARAMS_ID',
          value: 0n,
          paramValues: [],
        },
      ],
    }),
  ).toThrow('Proxyスキルの吸収対象が正しくありません。');
});

it('ActionType46の期限値と誘発パラメーターをlongとして保持する', () => {
  const longValue = (1n << 54n) + (1n << 30n) + 1n;
  const effect = createProxySkillEffect({
    skillEffectId: 46n,
    effects: [],
    details: [
      {
        id: 4n,
        detailType: 'PROXY_SKILL_ABSORB_EFFECT_PARAMS_ID',
        value: 0n,
        paramValues: [],
      },
      {
        id: 5n,
        detailType: 'PROXY_SKILL_ABSORB_AMOUNT_PARAMS_ID',
        value: 0n,
        paramValues: [],
      },
      { id: 1n, detailType: 'PROXY_SKILL_ABSORB_PERIOD_TYPE', value: 5n },
      { id: 2n, detailType: 'PROXY_SKILL_ABSORB_PERIOD_PARAM', value: longValue },
      { id: 3n, detailType: 'PROXY_SKILL_INDUCE_POWER_PARAM', value: longValue },
    ],
  });
  expect(effect).toMatchObject({ periodParam: longValue, inducePowerParam: longValue });
});

it('ActionType46のスキル回数期限はlongの精度を保ったまま減る', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const periodParam = (1n << 53n) + 9n;
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 5,
      periodParam,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const advanced = advanceProxySkillUses(active, 'other-card', 1, applyEffect);
  expect(advanced.proxySkills[0]?.remainingPeriod).toBe(periodParam - 1n);
});
