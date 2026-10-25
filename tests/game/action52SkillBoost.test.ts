import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  advanceAction52SkillBoosts,
  deactivateAction52SkillBoosts,
  expireAction52SkillBoostSections,
} from '../../src/domain/game/effects/action52SkillBoost';
import { heartCount } from '../../src/domain/game/hearts';
import { changeResource } from '../../src/domain/game/resources';
import { game } from './support/game';

function cleanGame() {
  return {
    ...game(),
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
  };
}

it('Action52は対象ActionType52の値へ割合を加え、回数期限を消費する', () => {
  const initial = cleanGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0 },
      uses: 1,
    },
    source,
  );
  const conversion = applyEffect(
    boosted,
    {
      kind: 'voltage-convert',
      destination: 'hearts',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      convertDisabledType: 0,
      displayDuration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledValue: 0,
    },
    source,
  );
  const converted = changeResource(conversion, 'excitement', 10n, 'skill', source);
  expect(heartCount(converted)).toBe(15);
  expect(converted.action52Buffs).toHaveLength(0);
  expect(converted.voltageConversions).toHaveLength(1);
});

it('Action52の対象外カードでは回数期限を消費しない', () => {
  const initial = cleanGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'member', member: 1042 },
      duration: { kind: 'stage', value: 0 },
      uses: 1,
    },
    source,
  );
  const conversion = applyEffect(
    active,
    {
      kind: 'voltage-convert',
      destination: 'hearts',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      convertDisabledType: 0,
      displayDuration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledValue: 0,
    },
    source,
  );
  expect(conversion.action52Buffs).toHaveLength(1);
  expect(conversion.voltageConversions[0]?.num).toBe(10000);
});

it('Action52は時間・パート期限、InvocationType抑止、外部解除を処理する', () => {
  const initial = cleanGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const timed = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 10_000,
      target: { kind: 'all' },
      duration: { kind: 'milliseconds', value: 100 },
      uses: null,
    },
    source,
  );
  expect(advanceAction52SkillBoosts(timed, 0.2).action52Buffs).toHaveLength(0);
  const section = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 10_000,
      target: { kind: 'all' },
      duration: { kind: 'sections', value: 1 },
      uses: null,
      invocationType: 0x388,
      deactivationKey: 'skill-boost',
    },
    source,
  );
  expect(expireAction52SkillBoostSections(section).action52Buffs).toHaveLength(1);
  expect(deactivateAction52SkillBoosts(section, 'skill-boost').action52Buffs).toHaveLength(0);
});
