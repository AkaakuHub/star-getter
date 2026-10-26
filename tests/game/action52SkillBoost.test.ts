import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  applyAction52SkillBoost,
  activateAction52SkillBoost,
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
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
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

it('Action52はC#のMultiply2計算と同じ精度で最後にfloatへ丸める', () => {
  const initial = cleanGame();
  const active = activateAction52SkillBoost(initial, {
    kind: 'skill-boost',
    num: 123_450,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: null,
  });
  const result = applyAction52SkillBoost(active, undefined, 1.25);
  expect(result.value).toBe(Math.fround((Math.fround(12.345) * 1.25) / 100 + 1.25));
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
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
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

it('Action14のAP回復にもActionType52を適用して使用回数を消費する', () => {
  const initial = cleanGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const recovered = applyEffect(active, { kind: 'energy', amount: 10 }, source);
  expect(recovered.energy).toBe(15);
  expect(recovered.action52Buffs).toHaveLength(0);
});

it('ActionType16のハート追加バフをActionType52より先に適用する', () => {
  const initial = cleanGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const heartBoost = applyEffect(
    initial,
    {
      kind: 'heart-boost',
      percent: 33,
      uses: 1,
      target: { kind: 'member', member: source.member },
      duration: { kind: 'stage' },
    },
    source,
  );
  const skillBoost = applyEffect(
    heartBoost,
    {
      kind: 'skill-boost',
      num: 400_000,
      target: { kind: 'member', member: source.member },
      duration: { kind: 'stage', value: 0n },
      uses: null,
    },
    source,
  );
  const created = applyEffect(
    skillBoost,
    {
      kind: 'skill-hearts',
      calculation: 'fixed',
      amount: 30_000,
      displayTime: { kind: 'full-end', value: 0 },
    },
    source,
  );

  expect(heartCount(created)).toBe(4);
  expect(created.heartBoosts).toHaveLength(0);
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
      duration: { kind: 'milliseconds', value: 100n },
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
      duration: { kind: 'sections', value: 1n },
      uses: null,
      invocationType: 0x388,
      deactivationKey: 'skill-boost',
    },
    source,
  );
  expect(expireAction52SkillBoostSections(section).action52Buffs).toHaveLength(1);
  expect(deactivateAction52SkillBoosts(section, 'skill-boost').action52Buffs).toHaveLength(0);
});
