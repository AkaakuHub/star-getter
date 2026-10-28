import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { advanceAutomaticGauges } from '@akaakuhub/suku-sute-core/game/automaticGauges';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';
import { apIncreaseIntervalSeconds } from '@akaakuhub/suku-sute-core/game/effects/apSpeed';

it('長い更新間隔でも開花中のAP回復を1回ずつ変換し、上限で回復分を失わない', () => {
  const base = game('library');
  const initial = activateGenesis(
    {
      ...base,
      ap: { ...base.ap, currentAp: 19 },
      mentalProtected: true,
      track: { ...base.track, stage: { ...base.track.stage, voltageIncreaseIntervalSeconds: 100 } },
    },
    1,
  );
  const after = advanceAutomaticGauges(initial, apIncreaseIntervalSeconds(initial) * 4.5);
  expect(after.ap.currentAp).toBe(19);
  expect(after.genesis.currentGauge).toBe(initial.genesis.currentGauge + 32);
});

it('標準条件のAP・元気・熱気は個別の間隔で整数ずつ変化する', () => {
  const baseState = game('library');
  const initial = { ...baseState, ap: { ...baseState.ap, currentAp: 0 } };
  expect(advanceTo(initial, 0.58).voltage.currentVoltage).toBe(0n);
  expect(advanceTo(initial, 0.6).voltage.currentVoltage).toBe(1n);
  const later = advanceTo(initial, 1.2);
  expect(later.ap.currentAp).toBe(0);
  expect(advanceTo(later, 1.2 + 1 / 60).ap.currentAp).toBe(1);
  expect(later.mental.currentMental).toBe(99);
  expect(later.voltage.currentVoltage).toBe(2n);
});

it('開花中も通常APが上限未満なら自然回復を専用値へ変換し、通常APを保持する', () => {
  const baseState2 = advanceTo(game(), 12);
  const initial = withBoardState(
    {
      ...baseState2,
      moodOffset: -100,
      handEffectCardIds: ['horizon'],
      mentalProtected: true,
      ap: { ...baseState2.ap, timerSeconds: 0, currentAp: 0 },
      voltage: { ...baseState2.voltage, timerSeconds: 0 },
    },
    { hand: ['horizon'] },
  );
  const empty = activateGenesis(initial, 1);
  const full = activateGenesis(
    { ...initial, ap: { ...initial.ap, currentAp: initial.ap.maxAp } },
    1,
  );
  const emptyAfter = advanceAutomaticGauges(empty, 1.2);
  const fullAfter = advanceAutomaticGauges(full, 1.2);
  expect(emptyAfter.ap.currentAp).toBe(0);
  expect(fullAfter.ap.currentAp).toBe(initial.ap.maxAp);
  expect(emptyAfter.genesis.currentGauge - empty.genesis.currentGauge).toBe(2);
  expect(fullAfter.genesis.currentGauge - full.genesis.currentGauge).toBe(2);
  const emptyNext = advanceAutomaticGauges(emptyAfter, 1 / 60);
  const fullNext = advanceAutomaticGauges(fullAfter, 1 / 60);
  expect(emptyNext.ap.currentAp).toBe(0);
  expect(emptyNext.genesis.currentGauge - emptyAfter.genesis.currentGauge).toBe(8);
  expect(fullNext.genesis.currentGauge).toBe(fullAfter.genesis.currentGauge);
});

it('開花中の自然元気減少は専用値を減らし、休憩防止の付与後だけ停止する', () => {
  const base = advanceTo(game(), 12);
  const initial = activateGenesis(
    withBoardState(
      {
        ...base,
        moodOffset: -100,
        handEffectCardIds: ['horizon'],
        mental: { ...base.mental, timerSeconds: 0 },
        ap: { ...base.ap, currentAp: base.ap.maxAp, timerSeconds: 0 },
        voltage: { ...base.voltage, timerSeconds: 0 },
      },
      { hand: ['horizon'] },
    ),
    1,
  );
  const protectedState = { ...initial, mentalProtected: true };
  const normal = advanceAutomaticGauges(initial, 1.2),
    protectedAfter = advanceAutomaticGauges(protectedState, 1.2);
  expect(normal.mental.currentMental).toBe(initial.mental.currentMental);
  expect(normal.voltage.currentVoltage).toBe(initial.voltage.currentVoltage);
  expect(normal.genesis.currentGauge).toBe(initial.genesis.currentGauge);
  expect(protectedAfter.genesis.currentGauge).toBe(initial.genesis.currentGauge + 2);
});

it('開花とActionType34の併用中は元気タイマーも進めない', () => {
  const initial = applyEffect(activateGenesis(game(), 1), {
    kind: 'disable-mental-down',
    duration: { kind: 'stage', value: 0n },
  });
  expect(advanceAutomaticGauges(initial, 1.2).mental.timerSeconds).toBe(
    initial.mental.timerSeconds,
  );
});

it('休憩開始と回復完了で元気タイマーを0へ戻す', () => {
  const baseState3 = game('library');
  const initial = {
    ...baseState3,
    mental: { ...baseState3.mental, currentMental: 1, timerSeconds: 0.75 },
  };
  const down = advanceAutomaticGauges(initial, 5);
  expect(down.mental.mentalDown).toBe(true);
  expect(down.mental.timerSeconds).toBe(0);
  const recovered = advanceAutomaticGauges(down, 5);
  expect(recovered.mental.mentalDown).toBe(false);
  expect(recovered.mental.timerSeconds).toBe(0);
});

it('0ミリ秒の停止は無効で、複数の停止期限が切れるまでタイマーも停止する', () => {
  const initial = game('library');
  const immediate = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: 0 },
  });
  expect(immediate.voltageStops).toHaveLength(0);
  expect(advanceTo(immediate, 1 / 60).voltageStops).toHaveLength(0);
  const first = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: 500 },
  });
  const overlapping = applyEffect(first, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: 1000 },
  });
  const half = advanceTo(overlapping, 0.5);
  expect(half.voltageStops).toHaveLength(1);
  expect(half.voltage.timerSeconds).toBe(0);
  const expired = advanceTo(half, 1 + 1 / 60);
  expect(expired.voltageStops).toHaveLength(0);
  expect(expired.voltage.timerSeconds).toBe(0);
  expect(advanceTo(expired, 1.6).voltage.currentVoltage).toBe(1n);
});

it('パート数で指定した熱気停止は指定回数の切替まで継続する', () => {
  const initial = game('library');
  const stops = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'sections', value: 2n },
  });
  const firstSection = initial.track.sections[1];
  const secondSection = initial.track.sections[2];
  if (!firstSection || !secondSection) throw new Error('パートが不足しています。');
  const first = advanceTo(stops, (firstSection.startBeat * 60) / initial.track.bpm);
  expect(first.voltageStops[0]?.remainingSections).toBe(1n);
  expect(first.voltage.currentVoltage).toBe(0n);
  const second = advanceTo(first, (secondSection.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(second.voltageStops).toHaveLength(0);
  expect(second.voltage.currentVoltage).toBe(0n);
});

it('外部解除型は指定期限で自動解除せず、Deactivatorで解除する', () => {
  const initial = game('library');
  const stopped = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'sections', value: 1n },
    invocationType: 0x388,
    deactivationKey: 'voltage-stop',
  });
  const section = initial.track.sections[1];
  if (!section) throw new Error('パートが不足しています。');
  const afterSection = advanceTo(stopped, (section.startBeat * 60) / initial.track.bpm + 1 / 60);
  expect(afterSection.voltageStops).toHaveLength(1);
  expect(
    act(afterSection, { type: 'deactivate-voltage-increase', deactivationKey: 'voltage-stop' })
      .voltageStops,
  ).toHaveLength(0);
});

it('負のミリ秒期限は参照実装同様に次の更新で停止を解除する', () => {
  const initial = game('library');
  const stopped = applyEffect(initial, {
    kind: 'stop-voltage-increase',
    duration: { kind: 'milliseconds', value: -1 },
  });
  expect(stopped.voltageStops).toHaveLength(1);
  expect(advanceTo(stopped, 1 / 60).voltageStops).toHaveLength(0);
});
