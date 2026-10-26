import { describe, expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { activateBloom, changeBloomResource, finishBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
import { calculateStarGatherGenesisGaugeDelta } from '../../src/domain/game/live/genesisGauge';
import { heartCount } from '../../src/domain/game/hearts';
import { rules } from '../../src/domain/game/model';
import { advanceTo } from '../../src/domain/game/simulation';
import { canUseSpecial } from '../../src/domain/game/special';
import { game, withHand } from './support/game';

function active() {
  return activateBloom(
    { ...advanceTo(game(), 12), moodOffset: -100, energy: 0, excitement: 40, stamina: 80 },
    1,
  );
}

describe('開花の専用ゲージ', () => {
  it('AP・元気・熱気の換算量をC#と同じく0方向へ切り捨てる', () => {
    expect(
      calculateStarGatherGenesisGaugeDelta({
        actionType: 14,
        gaugeType: 3,
        effectValue: 1,
        currentGenesisEffectValue: 1,
      }),
    ).toBe(7);
    expect(
      calculateStarGatherGenesisGaugeDelta({
        actionType: 14,
        gaugeType: 3,
        effectValue: -1,
        currentGenesisEffectValue: 1,
      }),
    ).toBe(-7);
  });

  it('2³¹−1に達し、超えると符号付き32bitのオーバーフローで0へ戻る', () => {
    const state = active();
    if (!state.bloom) throw new Error('開花が発動していません。');
    const maximum = changeBloomResource(
      { ...state, bloom: { ...state.bloom, progress: rules.maxBloomGauge - 1n } },
      'excitement',
      1n,
    );
    expect(maximum.bloom?.progress).toBe(2_147_483_647n);
    expect(changeBloomResource(maximum, 'excitement', 1n).bloom?.progress).toBe(0n);
  });

  for (const mood of [-100, -99, 0, 100]) {
    it(`空模様${mood}%でも20エナジーで開花を発動する`, () => {
      const initial = game();
      const state = {
        ...initial,
        energy: 20,
        maxEnergy: 20,
        track: {
          ...initial.track,
          moodKeys: [{ songTimeSeconds: 0, keyValue: mood }],
        },
      };
      expect(canUseSpecial(state, 'horizon')).toBe(true);
      expect(act(state, { type: 'special', cardId: 'horizon' }).bloom).not.toBeNull();
      expect(activateBloom(state, 1).bloom).not.toBeNull();
    });
  }

  it('通常カードの使用では発動せず、共鳴で20エナジーを払って発動する', () => {
    let state = advanceTo(game(), 12);
    state = withHand({ ...state, moodOffset: -100, energy: 20, maxEnergy: 20 }, ['horizon']);
    expect(act(state, { type: 'card', index: 0 }).bloom).toBeNull();
    expect(canUseSpecial(state, 'horizon')).toBe(true);
    const changed = act(state, { type: 'special', cardId: 'horizon' });
    expect(changed.bloom?.strength).toBe(3.5);
    expect(changed.energy).toBe(0);
    expect(changed.stats.specialsUsed).toBe(1);
    expect(changed.stats.cardsUsed).toBe(0);
  });

  it('AP・元気・熱気をそれぞれの倍率で切り捨てて変換し、通常値を更新しない', () => {
    const state = active();
    expect(state.bloom?.progress).toBe(30n);
    let changed = changeBloomResource(state, 'energy', 9n);
    expect(changed.bloom?.progress).toBe(51n);
    changed = changeBloomResource(changed, 'stamina', 100n);
    expect(changed.bloom?.progress).toBe(71n);
    changed = changeBloomResource(changed, 'excitement', 2n);
    expect(changed.bloom?.progress).toBe(72n);
    changed = changeBloomResource(changed, 'energy', -4n);
    expect(changed.bloom?.progress).toBe(58n);
    expect([changed.energy, changed.stamina, changed.excitement]).toEqual([0, 80, 40]);
    expect(finishBloom(changed).bloom).toBeNull();
    expect(finishBloom(changed).stamina).toBe(80);
  });

  it('開花終了時にC#のMental値変更通知をActionType23へ伝える', () => {
    const initial = game();
    const source = initial.deck[0];
    if (!source) throw new Error('ActionType23の発動元カードがありません。');
    const mentalHeartInducing = applyEffect(
      activateBloom({ ...initial, stamina: 80 }, 1),
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
    expect(heartCount(finishBloom(mentalHeartInducing))).toBe(before + 80);
  });

  it('発動前の増幅だけが強度を増やし、発動後の増幅はすでに決まった強度を変えない', () => {
    const initial = { ...advanceTo(game(), 12), moodOffset: -100, hand: ['horizon'] };
    const prepared = applyEffect(applyEffect(initial, { kind: 'amplify', percent: 50 }), {
      kind: 'bloom',
      strength: 3.5,
    });
    const reversed = applyEffect(applyEffect(initial, { kind: 'bloom', strength: 3.5 }), {
      kind: 'amplify',
      percent: 50,
    });
    expect(prepared.bloom?.strength).toBe(5.25);
    expect(reversed.bloom?.strength).toBe(3.5);
  });

  it('熱気の固定値変更もFloat32の値と専用ゲージ変換を通り、通常値を上書きしない', () => {
    const normal = applyEffect(game(), { kind: 'voltage-set', amount: 655_000_001 });
    expect(normal.excitement).toBe(655_000_000);
    const state = active();
    const changed = applyEffect(state, { kind: 'voltage-set', amount: 655_000_001 });
    expect(changed.excitement).toBe(state.excitement);
    expect(changed.bloom?.progress).toBeGreaterThan(state.bloom?.progress ?? 0n);
  });
});
