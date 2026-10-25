import { describe, expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { activateBloom, changeBloomResource, finishBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
import { rules } from '../../src/domain/game/model';
import { advanceTo } from '../../src/domain/game/simulation';
import { canUseSpecial } from '../../src/domain/game/special';
import { game } from './support/game';

function active() {
  return activateBloom(
    { ...advanceTo(game(), 12), moodOffset: -100, energy: 0, excitement: 40, stamina: 80 },
    1,
  );
}

describe('開花の専用ゲージ', () => {
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

  for (const mood of [-99, 0, 100]) {
    it(`空模様${mood}%では20エナジーあっても開花を発動できない`, () => {
      const initial = game();
      const state = {
        ...initial,
        energy: 20,
        maxEnergy: 20,
        track: {
          ...initial.track,
          sections: initial.track.sections.map((section) => ({ ...section, moodValue: mood })),
        },
      };
      expect(canUseSpecial(state, 'horizon')).toBe(false);
      expect(act(state, { type: 'special', cardId: 'horizon' })).toBe(state);
      expect(activateBloom(state, 1)).toBe(state);
    });
  }

  it('通常カードの使用では発動せず、空模様−100%の共鳴で20エナジーを払って発動する', () => {
    let state = advanceTo(game(), 12);
    state = { ...state, moodOffset: -100, energy: 20, maxEnergy: 20, hand: ['horizon'] };
    expect(canUseSpecial(state, 'horizon')).toBe(true);
    const changed = act(state, { type: 'special', cardId: 'horizon' });
    expect(changed.bloom?.strength).toBe(3.5);
    expect(changed.energy).toBe(0);
    expect(changed.stats.specialsUsed).toBe(1);
    expect(changed.stats.cardsUsed).toBe(0);
  });

  it('AP・元気・熱気をそれぞれの倍率で切り上げて変換し、通常値を更新しない', () => {
    const state = active();
    expect(state.bloom?.progress).toBe(30n);
    let changed = changeBloomResource(state, 'energy', 9n);
    expect(changed.bloom?.progress).toBe(52n);
    changed = changeBloomResource(changed, 'stamina', 100n);
    expect(changed.bloom?.progress).toBe(72n);
    changed = changeBloomResource(changed, 'excitement', 2n);
    expect(changed.bloom?.progress).toBe(74n);
    changed = changeBloomResource(changed, 'energy', -4n);
    expect(changed.bloom?.progress).toBe(59n);
    expect([changed.energy, changed.stamina, changed.excitement]).toEqual([0, 80, 40]);
    expect(finishBloom(changed).bloom).toBeNull();
    expect(finishBloom(changed).stamina).toBe(80);
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
