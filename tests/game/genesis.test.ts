import { describe, expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  activateGenesis,
  changeGenesisResource,
  finishGenesis,
} from '@akaakuhub/suku-sute-core/game/genesis';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { calculateLiveGenesisGaugeDelta } from '@akaakuhub/suku-sute-core/runtime/skills/genesisSkill';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { canUseSpecial } from '@akaakuhub/suku-sute-core/game/special';
import { game, withHand } from './support/game';

function active() {
  const baseState = advanceTo(game(), 12);
  return activateGenesis(
    {
      ...baseState,
      moodOffset: -100,
      currentVoltage: 40,
      mental: { ...baseState.mental, currentMental: 80 },
      ap: { ...baseState.ap, currentAp: 0 },
    },
    1,
  );
}

describe('開花の専用ゲージ', () => {
  it('AP・元気・熱気の換算量はruntime同様に大きさを切り上げてから符号を適用する', () => {
    expect(
      calculateLiveGenesisGaugeDelta({
        actionType: 14,
        gaugeType: 3,
        effectValue: 1,
        currentGenesisEffectValue: 1,
      }),
    ).toBe(8);
    expect(
      calculateLiveGenesisGaugeDelta({
        actionType: 14,
        gaugeType: 3,
        effectValue: -1,
        currentGenesisEffectValue: 1,
      }),
    ).toBe(-8);
  });

  it('2³¹−1を超えるとAPKの符号付き32bit加算で負数へ折り返す', () => {
    const state = active();
    if (state.genesis.effects.length === 0) throw new Error('開花が発動していません。');
    const maximum = changeGenesisResource(
      { ...state, genesis: { ...state.genesis, currentGauge: rules.maxGenesisGauge - 1 } },
      'voltage',
      1n,
    );
    expect(maximum.genesis.currentGauge).toBe(2_147_483_647);
    expect(changeGenesisResource(maximum, 'voltage', 1n).genesis.currentGauge).toBe(-2_147_483_648);
  });

  for (const mood of [-100, -99, 0, 100]) {
    it(`空模様${mood}%でも20エナジーで開花を発動する`, () => {
      const initial = game();
      const state = {
        ...initial,
        track: {
          ...initial.track,
          moodKeys: [{ songTimeSeconds: 0, keyValue: mood }],
        },
        ap: { ...initial.ap, currentAp: 20, maxAp: 20 },
      };
      expect(canUseSpecial(state, 'horizon')).toBe(true);
      expect(
        act(state, { type: 'special', cardId: 'horizon' }).genesis.effects.length,
      ).toBeGreaterThan(0);
      expect(activateGenesis(state, 1).genesis.effects.length).toBeGreaterThan(0);
    });
  }

  it('通常カードの使用では発動せず、共鳴で20エナジーを払って発動する', () => {
    let state = advanceTo(game(), 12);
    state = withHand(
      { ...state, moodOffset: -100, ap: { ...state.ap, currentAp: 20, maxAp: 20 } },
      ['horizon'],
    );
    expect(act(state, { type: 'card', index: 0 }).genesis.effects).toHaveLength(0);
    expect(canUseSpecial(state, 'horizon')).toBe(true);
    const changed = act(state, { type: 'special', cardId: 'horizon' });
    expect(changed.genesis.effects[0]?.effectValue).toBe(3.5);
    expect(changed.ap.currentAp).toBe(0);
    expect(changed.stats.specialsUsed).toBe(1);
    expect(changed.stats.cardsUsed).toBe(0);
  });

  it('AP・元気・熱気をそれぞれFloat32で換算して切り上げ、通常値を更新しない', () => {
    const state = active();
    expect(state.genesis.currentGauge).toBe(30);
    let changed = changeGenesisResource(state, 'ap', 9n);
    expect(changed.genesis.currentGauge).toBe(52);
    changed = changeGenesisResource(changed, 'mental', 100n);
    expect(changed.genesis.currentGauge).toBe(72);
    changed = changeGenesisResource(changed, 'voltage', 2n);
    expect(changed.genesis.currentGauge).toBe(74);
    changed = changeGenesisResource(changed, 'ap', -4n);
    expect(changed.genesis.currentGauge).toBe(59);
    expect([changed.ap.currentAp, changed.mental.currentMental, changed.currentVoltage]).toEqual([
      0, 80, 40,
    ]);
    expect(finishGenesis(changed).genesis.effects).toHaveLength(0);
    expect(finishGenesis(changed).mental.currentMental).toBe(80);
  });

  it('開花終了時に参照実装のMental値変更通知をActionType23へ伝える', () => {
    const initial = game();
    const source = initial.deck[0];
    if (!source) throw new Error('ActionType23の発動元カードがありません。');
    const mentalHeartInducing = applyEffect(
      activateGenesis({ ...initial, mental: { ...initial.mental, currentMental: 80 } }, 1),
      {
        kind: 'mental-heart-induce',
        num: 10_000n,
        heartDuration: { kind: 'stage', value: 0 },
        duration: { kind: 'stage', value: 0n },
        disabledType: 0,
        disabledValue: 0n,
      },
      source,
    );
    const before = heartCount(mentalHeartInducing);
    expect(heartCount(finishGenesis(mentalHeartInducing))).toBe(before + 80);
  });

  it('発動前の増幅だけが強度を増やし、発動後の増幅はすでに決まった強度を変えない', () => {
    const initial = { ...advanceTo(game(), 12), moodOffset: -100, hand: ['horizon'] };
    const prepared = applyEffect(applyEffect(initial, { kind: 'amplify', percent: 50 }), {
      kind: 'genesis',
      effectValue: 3.5,
    });
    const reversed = applyEffect(applyEffect(initial, { kind: 'genesis', effectValue: 3.5 }), {
      kind: 'amplify',
      percent: 50,
    });
    expect(prepared.genesis.effects[0]?.effectValue).toBe(5.25);
    expect(reversed.genesis.effects[0]?.effectValue).toBe(3.5);
  });

  it('熱気の固定値変更もFloat32の値と専用ゲージ変換を通り、通常値を上書きしない', () => {
    const normal = applyEffect(game(), { kind: 'voltage-set', amount: 655_000_001 });
    expect(normal.currentVoltage).toBe(655_000_000);
    const state = active();
    const changed = applyEffect(state, { kind: 'voltage-set', amount: 655_000_001 });
    expect(changed.currentVoltage).toBe(state.currentVoltage);
    expect(changed.genesis.currentGauge).toBeGreaterThan(state.genesis.currentGauge);
  });
});
