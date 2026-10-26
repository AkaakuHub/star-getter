import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { addHearts, collectHearts, heartCount } from '../../src/domain/game/hearts';
import { changeResource } from '../../src/domain/game/resources';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

const conversion = {
  kind: 'voltage-convert',
  destination: 'hearts',
  num: 10000,
  outputDuration: { kind: 'milliseconds', value: 0 },
  convertDisabledType: 0,
  displayDuration: { kind: 'stage', value: 0 },
  disabledType: 0,
  disabledValue: 0n,
} as const;

function unboostedGame() {
  return {
    ...game(),
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
    storyAmplification: 0,
  };
}

it('Action22は正の熱気増加を変換し、最後に登録した変換先だけ使う', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const first = applyEffect(initial, conversion, source);
  const latest = applyEffect(
    first,
    {
      ...conversion,
      destination: 'love',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      displayDuration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const result = changeResource(latest, 'excitement', 10n, 'skill', source);
  expect(result.excitement).toBe(initial.excitement);
  expect(result.temporaryScoreBoosts).toEqual([
    { percent: 10, remainingSeconds: null, remainingSections: null, expireOnHeartCollect: true },
  ]);
  expect(heartCount(result)).toBe(0);
  expect(changeResource({ ...latest, excitement: 10 }, 'excitement', -10n).excitement).toBe(0);
});

it('Action22は熟練度ボーナスの熱気も変換する', () => {
  const base = unboostedGame();
  const initial = {
    ...base,
    track: {
      ...base.track,
      masteryVoltageBonus: { demand: 1, gain: 10 },
    },
  };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(initial, conversion, source);
  const converted = changeResource(active, 'excitement', 1n, 'natural', source);
  expect(heartCount(converted)).toBe(10);
  expect(converted.excitement).toBe(initial.excitement + 1);
});

it('Action22の詳細値をC#のint32へ変換する', () => {
  const source = game().deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const converted = applyEffect(game(), { ...conversion, num: 2_147_483_648 }, source);
  expect(converted.voltageConversions[0]?.num).toBe(-2_147_483_648);
});

it('ActionType22はActionType52適用前に変換数を整数化する', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(initial, { ...conversion, num: 1.9 }, source);
  expect(active.voltageConversions[0]?.num).toBe(1);
});

it('Action22のHeart変換はnum×熱気を10000で換算し、変換回数で解除する', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { ...conversion, num: 25000, disabledType: 1, disabledValue: 1n },
    source,
  );
  const converted = changeResource(active, 'excitement', 10n, 'skill', source);
  expect(heartCount(converted)).toBe(25);
  expect(converted.voltageConversions).toHaveLength(0);
  expect(converted.excitement).toBe(initial.excitement);
});

it('ActionType22は解除回数のlong値をint32へ切り詰めない', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { ...conversion, disabledType: 1, disabledValue: (1n << 32n) + 2n },
    source,
  );
  const once = changeResource(active, 'excitement', 1n, 'skill', source);
  const twice = changeResource(once, 'excitement', 1n, 'skill', source);
  expect(once.voltageConversions).toHaveLength(1);
  expect(twice.voltageConversions).toHaveLength(1);
});

it('ActionType22は解除回数0もlong比較に残し、int32周回後に解除する', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { ...conversion, disabledType: 1, disabledValue: 0n },
    source,
  );
  const nearWrap = {
    ...active,
    voltageConversions: active.voltageConversions.map((item) => ({
      ...item,
      conversions: -1,
    })),
  };
  expect(
    changeResource(nearWrap, 'excitement', 1n, 'skill', source).voltageConversions,
  ).toHaveLength(0);
});

it('ActionType22はnumと熱気をint32乗算してからfloat32へ変換する', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      ...conversion,
      destination: 'love',
      num: 100_000,
      outputDuration: { kind: 'stage', value: 0 },
      displayDuration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const converted = changeResource(active, 'excitement', 100_000n, 'skill', source);
  expect(converted.temporaryScoreBoosts[0]?.percent).toBe(141_006);
});

it('Action22のMental回復とBarrier変換を適用し、活動期限とdeactivatorを処理する', () => {
  const initial = { ...unboostedGame(), stamina: 50 };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const recover = applyEffect(
    initial,
    { ...conversion, destination: 'stamina', num: 10000 },
    source,
  );
  const recovered = changeResource(recover, 'excitement', 5n, 'skill', source);
  expect(recovered.stamina).toBe(55);

  const barrier = applyEffect(
    { ...initial, stamina: 50 },
    {
      ...conversion,
      destination: 'mental-barrier',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      deactivationKey: 'barrier-convert',
    },
    source,
  );
  const protectedState = changeResource(barrier, 'excitement', 5n, 'skill', source);
  expect(protectedState.mentalBarriers[0]?.endurance).toBe(5);
  expect(
    act(protectedState, {
      type: 'deactivate-voltage-convert',
      deactivationKey: 'barrier-convert',
    }).voltageConversions,
  ).toHaveLength(0);
});

it('Action22のBarrier変換はActionType7追加補正前に小数値を切り上げない', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const conversionState = applyEffect(
    initial,
    {
      ...conversion,
      destination: 'mental-barrier',
      num: 9001,
      outputDuration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const buffed = applyEffect(
    conversionState,
    {
      kind: 'mental-barrier-additional-buff',
      calculation: 1,
      num: 100_000n,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledCount: 0n,
    },
    source,
  );
  const converted = changeResource(buffed, 'excitement', 1n, 'skill', source);
  expect(converted.mentalBarriers[0]?.endurance).toBe(0);
});

it('Action22のパート・ミリ秒期限とLoveUpの次回ハート回収解除を処理する', () => {
  const initial = unboostedGame();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const sectionTime = (nextSection.startBeat * 60) / initial.track.bpm;
  const sectional = applyEffect(
    initial,
    { ...conversion, displayDuration: { kind: 'sections', value: 1 } },
    source,
  );
  expect(advanceTo(sectional, sectionTime).voltageConversions).toHaveLength(0);

  const timed = applyEffect(
    initial,
    { ...conversion, displayDuration: { kind: 'milliseconds', value: 100 } },
    source,
  );
  expect(advanceTo(timed, 0.2).voltageConversions).toHaveLength(0);

  const love = applyEffect(
    initial,
    {
      ...conversion,
      destination: 'love',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      displayDuration: { kind: 'stage', value: 0 },
    },
    source,
  );
  const active = changeResource(love, 'excitement', 10n, 'skill', source);
  const scored = collectHearts(addHearts(active, 1));
  expect(scored.temporaryScoreBoosts).toHaveLength(0);
});
