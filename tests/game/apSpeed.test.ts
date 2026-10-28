import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { apIncreaseIntervalSeconds } from '@akaakuhub/suku-sute-core/game/effects/apSpeed';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';

const speedEffect = {
  kind: 'ap-speed-change',
  calculationType: 2,
  num: 7000n,
  bonusMoodTarget: 0,
  bonusMoodValue: 0n,
  displayTimeType: 3n,
  displayTime: 0n,
} as const;

it('Action21の乗算は参照実装のnum換算でAP回復時間へ適用し、deactivatorで元に戻す', () => {
  const baseState = game();
  const initial = {
    ...baseState,
    track: {
      ...baseState.track,
      stage: { ...baseState.track.stage, apIncreaseIntervalSeconds: 1.2 },
    },
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
    ap: { ...baseState.ap, timerSeconds: 0.3 },
  };
  const before = apIncreaseIntervalSeconds(initial);
  const applied = applyEffect(initial, speedEffect, initial.deck[0]);
  expect(apIncreaseIntervalSeconds(applied)).toBeCloseTo(0.84, 5);
  expect(applied.ap.timerSeconds).toBeCloseTo(initial.ap.timerSeconds * 0.7, 5);

  const ended = act(applied, { type: 'deactivate-ap-speed', deactivationKey: 'unused' });
  expect(ended.apIncreaseSpeedEffects).toHaveLength(1);
  const keyed = applyEffect(
    initial,
    { ...speedEffect, deactivationKey: 'action21' },
    initial.deck[0],
  );
  const deactivated = act(keyed, { type: 'deactivate-ap-speed', deactivationKey: 'action21' });
  expect(apIncreaseIntervalSeconds(deactivated)).toBeCloseTo(before, 5);
  expect(deactivated.ap.timerSeconds).toBeCloseTo(initial.ap.timerSeconds, 5);
});

it('Action21の加算・SkillBoost・Proxy吸収を計算順どおり適用する', () => {
  const base = game();
  const initial = {
    ...base,
    track: { ...base.track, stage: { ...base.track.stage, apIncreaseIntervalSeconds: 1.2 } },
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
  };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const additive = applyEffect(
    initial,
    {
      ...speedEffect,
      calculationType: 1,
      num: -25n,
    },
    source,
  );
  expect(apIncreaseIntervalSeconds(additive)).toBeCloseTo(1.175, 5);

  const boosted = applyEffect(
    {
      ...initial,
      targetBoosts: [{ members: [source.charactersId], percent: 100, duration: 'stage' }],
    },
    speedEffect,
    source,
  );
  expect(apIncreaseIntervalSeconds(boosted)).toBeCloseTo(0.48, 5);

  const absorption = {
    id: 1,
    cardInstanceId: source.cardInstanceId,
    hasAbsorbLimit: false,
    isAbsoluteAdd: false,
    periodType: 3 as const,
    isAbsorbEnd: false,
    induceTiming: 1 as const,
    induceCondition: 1 as const,
    inducePowerType: 1 as const,
    inducePowerParam: 0n,
    induceEffects: [],
    effects: [{ actionType: 21, targetAmount: 50n, totalAmount: 0n }],
  };
  const protectedState = { ...initial, proxySkills: [absorption] };
  const absorbed = applyEffect(protectedState, speedEffect, source);
  expect(absorbed.apIncreaseSpeedEffects).toHaveLength(0);
  expect(absorbed.proxySkills[0]?.effects[0]?.totalAmount).toBe(31n);
});

it('Action21の吸収到達で即時誘発し、AP速度を変更しない', () => {
  const initial = { ...game(), handEffectCardIds: [], targetBoosts: [] };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 3,
      periodParam: 0n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 21, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
    },
    source,
  );
  const next = applyEffect(active, speedEffect, source);
  expect(next.proxySkills).toEqual([]);
  expect(next.apIncreaseSpeedEffects).toEqual(initial.apIncreaseSpeedEffects);
  expect(next.ap.currentAp).toBe(initial.ap.currentAp + 2);
});

it('ActionType21のcalcType1は正のrateでActionType52を消費するが値には適用しない', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const initial = {
    ...base,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
  };
  const boosted = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'member', member: source.charactersId },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const changed = applyEffect(boosted, { ...speedEffect, calculationType: 1, num: 2500n }, source);
  expect(changed.action52Buffs).toHaveLength(0);
  expect(changed.apIncreaseSpeedEffects.at(-1)?.calculation).toEqual({
    kind: 'add',
    milliseconds: 2500,
  });
});

it('ActionType21のcalcType1は効果値0でも正のrateでActionType52を消費する', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const initial = {
    ...base,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
  };
  const boosted = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'member', member: source.charactersId },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const changed = applyEffect(boosted, { ...speedEffect, calculationType: 1, num: 0n }, source);
  expect(changed.action52Buffs).toHaveLength(0);
  expect(changed.apIncreaseSpeedEffects).toHaveLength(0);
});

it('Action21 calcType2はSkillBoostの正のInfinity時に元のrateを保持する', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const initial = {
    ...base,
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
    action52Buffs: [
      {
        id: 999,
        percent: Number.MAX_VALUE,
        target: { kind: 'all' as const },
        remainingSeconds: null,
        remainingSections: null,
        remainingUses: null,
        skillTokenSeriesIds: null,
        deactivationKey: null,
      },
    ],
  };
  const changed = applyEffect(initial, speedEffect, source);
  expect(changed.apIncreaseSpeedEffects.at(-1)?.calculation).toEqual({
    kind: 'multiply',
    factor: Math.fround(7000 / 10_000),
  });
});

it('Action21のパート期限とミリ秒期限を解除する', () => {
  const initial = game();
  const sectionEffect = applyEffect(initial, {
    ...speedEffect,
    num: 11000n,
    displayTimeType: 2n,
    displayTime: 1n,
  });
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const sectionTime = (nextSection.startBeat * 60) / initial.track.bpm;
  const expiredSection = advanceTo(sectionEffect, sectionTime);
  expect(expiredSection.apIncreaseSpeedEffects).toHaveLength(0);
  expect(apIncreaseIntervalSeconds(expiredSection)).toBeCloseTo(
    apIncreaseIntervalSeconds(initial),
    5,
  );

  const persistent = applyEffect(initial, {
    ...speedEffect,
    num: 11000n,
    displayTimeType: 2n,
    displayTime: 1n,
    invocationType: 0x388,
    deactivationKey: 'persistent',
  });
  const afterSection = advanceTo(persistent, sectionTime);
  expect(afterSection.apIncreaseSpeedEffects).toHaveLength(1);
  const deactivated = act(afterSection, {
    type: 'deactivate-ap-speed',
    deactivationKey: 'persistent',
  });
  expect(deactivated.apIncreaseSpeedEffects).toHaveLength(0);

  const timed = applyEffect(initial, {
    ...speedEffect,
    num: 11000n,
    displayTimeType: 1n,
    displayTime: 250n,
  });
  expect(timed.apIncreaseSpeedEffects).toHaveLength(1);
  expect(advanceTo(timed, 0.3).apIncreaseSpeedEffects).toHaveLength(0);
});
