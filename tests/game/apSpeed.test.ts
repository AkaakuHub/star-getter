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
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
    ap: { ...baseState.ap, timerSeconds: 0.3 },
  };
  const before = apIncreaseIntervalSeconds(initial);
  const applied = applyEffect(initial, speedEffect, initial.deck[0]);
  expect(apIncreaseIntervalSeconds(applied)).toBeCloseTo(0.9, 5);
  expect(applied.ap.timerSeconds).toBeCloseTo(initial.ap.timerSeconds * 0.75, 5);

  const ended = act(applied, { type: 'deactivate-ap-speed', deactivationKey: 'unused' });
  expect(ended.apTimeEffects).toHaveLength(1);
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
  const initial = {
    ...game(),
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
  expect(apIncreaseIntervalSeconds(additive)).toBeCloseTo(0.2, 5);

  const boosted = applyEffect(
    {
      ...initial,
      targetBoosts: [{ members: [source.charactersId], percent: 100, duration: 'stage' }],
    },
    speedEffect,
    source,
  );
  expect(apIncreaseIntervalSeconds(boosted)).toBeCloseTo(0.5, 5);

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
  expect(absorbed.apTimeEffects).toHaveLength(0);
  expect(absorbed.proxySkills[0]?.effects[0]?.totalAmount).toBe(30n);
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
  expect(changed.apTimeEffects.at(-1)?.value).toBe(2500);
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
  expect(changed.apTimeEffects).toHaveLength(0);
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
  expect(changed.apTimeEffects.at(-1)?.value).toBe(Math.fround(7000 / 10_000));
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
  expect(expiredSection.apTimeEffects).toHaveLength(0);
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
  expect(afterSection.apTimeEffects).toHaveLength(1);
  const deactivated = act(afterSection, {
    type: 'deactivate-ap-speed',
    deactivationKey: 'persistent',
  });
  expect(deactivated.apTimeEffects).toHaveLength(0);

  const timed = applyEffect(initial, {
    ...speedEffect,
    num: 11000n,
    displayTimeType: 1n,
    displayTime: 250n,
  });
  expect(timed.apTimeEffects).toHaveLength(1);
  expect(advanceTo(timed, 0.3).apTimeEffects).toHaveLength(0);
});
