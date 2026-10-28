import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { changeResource, expireGaugeInfinities } from '@akaakuhub/suku-sute-core/game/resources';
import { voltageThreshold } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { activateGenesis, finishGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { game } from './support/game';

describe('無限ゲージ', () => {
  it('期限中はAPを消費できず、AP無限の解除後も現在値を維持する', () => {
    const initial = { ...game(), currentAp: 2 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'ap',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.currentAp).toBe(active.maxAp);
    const during = advanceTo(active, 0.25);
    expect(during.currentAp).toBe(during.maxAp);
    const ended = advanceTo(during, 0.5 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.currentAp).toBe(ended.maxAp);
  });

  it('重複する熱気無限のうち最後の期限でレベル10へ戻す', () => {
    const initial = game();
    const first = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const second = applyEffect(first, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 1000 },
    });
    const overlap = advanceTo(second, 0.5 + 1 / 60);
    expect(overlap.gaugeInfinities).toHaveLength(1);
    expect(overlap.currentVoltage).toBe(second.currentVoltage);
    const ended = advanceTo(overlap, 1 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.currentVoltage).toBe(voltageThreshold(10));
  });

  it('Action39は無限開始時の熱気差をMasteryへ渡し、報酬を変換する', () => {
    const initial = game();
    const conversion = {
      id: 1,
      destination: 'love' as const,
      num: 10_000,
      outputDuration: { kind: 'milliseconds' as const, value: 1000 },
      disabledOnConvertCount: null,
      conversions: 0,
      expireOnHeartCollect: false,
      remainingSeconds: null,
      remainingSections: null,
      deactivationKey: null,
    };
    const state = {
      ...initial,
      track: { ...initial.track, masteryVoltageBonus: { demand: 1, gain: 3 } },
      voltageConversions: [conversion],
    };
    const active = applyEffect(state, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'stage', value: 0 },
    });
    expect(active.masteryVoltageProgress).toBe(0);
    expect(active.voltageConversions[0]?.conversions).toBe(1);
    expect(active.temporaryScoreBoosts.at(-1)?.percent).toBe(3);
  });

  it('元気無限の開始と最終解除で元気タイマーを0へ戻す', () => {
    const initial = {
      ...game(),
      mental: { ...game().mental, currentMental: 42, timerSeconds: 0.4 },
    };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.mental.currentMental).toBe(100);
    expect(active.mental.timerSeconds).toBe(0);
    const ended = advanceTo({ ...active, mental: { ...active.mental, timerSeconds: 0.4 } }, 0.5);
    expect(ended.mental.currentMental).toBe(100);
    expect(ended.mental.timerSeconds).toBe(0);
  });

  it('元気上限の拡張値を元気無限開始時の誘発ハート計算へ渡す', () => {
    const initial = {
      ...game(),
      maximumMental: 150,
      hearts: { ...game().hearts, heartLimit: 500 },
    };
    const inducing = applyEffect(initial, {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000n },
      disabledType: 0,
      disabledValue: 0n,
    });
    const active = applyEffect(inducing, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const generated =
      active.hearts.stageHearts.length +
      active.hearts.hiddenHeartBatches.reduce((sum, batch) => sum + batch.count, 0);
    expect(generated).toBe(150);
  });

  it('Action23の詳細値を参照実装のint32へ変換する', () => {
    const active = applyEffect(game(), {
      kind: 'mental-heart-induce',
      num: 2_147_483_648n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000n },
      disabledType: 0,
      disabledValue: 0n,
    });
    expect(active.mentalHeartInducers[0]?.precomputedNum).toBe(-2_147_483_648);
  });

  it('期限抑止された効果はDeactivatorまで残り、解除時に最後のゲージ値へ戻す', () => {
    const initial = { ...game(), currentVoltage: 100 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
      invocationType: 0x388,
      deactivationKey: 'voltage-infinity',
    });
    expect(advanceTo(active, 1).gaugeInfinities).toHaveLength(1);
    const ended = act(active, {
      type: 'deactivate-infinity-gauge',
      deactivationKey: 'voltage-infinity',
    });
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.currentVoltage).toBe(voltageThreshold(10));
  });

  it('ActionType39の電圧解除で永続電圧分岐を切り替える', () => {
    const base = { ...game(), currentVoltage: voltageThreshold(20) };
    const source = base.deck[0];
    if (!source) throw new Error('発動元カードがありません。');
    const branch = applyEffect(
      base,
      {
        kind: 'branch',
        persistent: true,
        condition: { kind: 'voltage-level-at-most', level: 10 },
        whenTrue: [
          {
            kind: 'skill-boost',
            num: 200_000,
            target: { kind: 'all' },
            uses: null,
            duration: { kind: 'stage', value: 0n },
          },
        ],
        whenFalse: [
          {
            kind: 'skill-boost',
            num: 100_000,
            target: { kind: 'all' },
            uses: null,
            duration: { kind: 'stage', value: 0n },
          },
        ],
      },
      source,
    );
    const active = applyEffect(branch, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'stage', value: 0 },
      invocationType: 0x388,
      deactivationKey: 'voltage-infinity',
    });
    expect(active.action52Buffs.map((buff) => buff.percent)).toEqual([10]);
    const ended = act(active, {
      type: 'deactivate-infinity-gauge',
      deactivationKey: 'voltage-infinity',
    });
    expect(ended.currentVoltage).toBe(voltageThreshold(10));
    expect(ended.action52Buffs.map((buff) => buff.percent)).toEqual([20]);
    const timed = applyEffect(branch, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(advanceTo(timed, 0.5 + 1 / 60).action52Buffs.map((buff) => buff.percent)).toEqual([20]);
  });

  it('Genesis中に開始した無限ゲージの時間期限を保持し、終了後に無限状態へ移す', () => {
    const initial = activateGenesis(game('genesis'), 1);
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'ap',
      duration: { kind: 'milliseconds', value: 1000 },
    });
    expect(active.gaugeInfinities[0]?.suspended).toBe(true);
    expect(active.genesis.currentGauge).toBe(initial.genesis.currentGauge + 500);
    const finished = finishGenesis(active);
    expect(finished.gaugeInfinities[0]?.suspended).toBe(false);
    expect(finished.currentAp).toBe(finished.maxAp);
    expect(changeResource(finished, 'ap', -1n).currentAp).toBe(finished.currentAp);
  });

  it('開花中は500のGenesisゲージを加算し、期限付き無限状態を保留する', () => {
    const initial = activateGenesis(game('genesis'), 1);
    const next = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(next.genesis.currentGauge).toBe(initial.genesis.currentGauge + 500);
    expect(next.gaugeInfinities[0]?.suspended).toBe(true);
  });

  it('開花中の熱気無限解除は熱気を維持してGenesis進捗へ目標差を加算する', () => {
    const initial = { ...activateGenesis(game('genesis'), 1), currentVoltage: 100 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'stage', value: 0 },
      invocationType: 0x388,
      deactivationKey: 'voltage-infinity',
    });
    const genesis = active.genesis;
    if (!genesis) throw new Error('開花が発動していません。');
    const ended = act(active, {
      type: 'deactivate-infinity-gauge',
      deactivationKey: 'voltage-infinity',
    });
    expect(ended.currentVoltage).toBe(active.currentVoltage);
    expect(ended.genesis.currentGauge).toBe(genesis.currentGauge + 23);
  });

  it('開花中に元気無限を解除しても元気回復誘発を起こさない', () => {
    const base = {
      ...game('genesis'),
      mental: { ...game('genesis').mental, currentMental: 42, timerSeconds: 0.4 },
    };
    const inducing = applyEffect(base, {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000n },
      disabledType: 0,
      disabledValue: 0n,
    });
    const initial = activateGenesis(inducing, 1);
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'stage', value: 0 },
      invocationType: 0x388,
      deactivationKey: 'mental-infinity',
    });
    const ended = act(active, {
      type: 'deactivate-infinity-gauge',
      deactivationKey: 'mental-infinity',
    });
    expect(ended.mental.currentMental).toBe(42);
    expect(ended.mental.timerSeconds).toBe(0);
    expect(ended.hearts).toEqual(active.hearts);
    expect(finishGenesis(ended).mental.currentMental).toBe(42);
  });

  it('開花中の元気無限期限切れでも元気回復誘発を起こさない', () => {
    const base = {
      ...game('genesis'),
      mental: { ...game('genesis').mental, currentMental: 42, timerSeconds: 0.4 },
    };
    const inducing = applyEffect(base, {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000n },
      disabledType: 0,
      disabledValue: 0n,
    });
    const initial = activateGenesis(inducing, 1);
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const ended = expireGaugeInfinities(active, 'milliseconds', 0.5);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.mental.currentMental).toBe(42);
    expect(ended.mental.timerSeconds).toBe(0);
    expect(ended.hearts).toEqual(active.hearts);
  });

  it('Genesis中に開始した熱気と元気の無限状態を終了時に反映する', () => {
    const base = game('genesis');
    const initial = {
      ...base,
      maximumMental: 150,
      hearts: { ...base.hearts, heartLimit: 500 },
    };
    const inducing = applyEffect(initial, {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000n },
      disabledType: 0,
      disabledValue: 0n,
    });
    const genesisActive = activateGenesis(inducing, 1);
    const voltage = applyEffect(genesisActive, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const mental = applyEffect(voltage, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const finished = finishGenesis(mental);
    const generated =
      finished.hearts.stageHearts.length +
      finished.hearts.hiddenHeartBatches.reduce((sum, batch) => sum + batch.count, 0);
    expect(finished.currentVoltage).toBe(voltageThreshold(finished.maximumVoltageLevel));
    expect(finished.mental.currentMental).toBe(150);
    expect(generated).toBe(150);
  });
});
