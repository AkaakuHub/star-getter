import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { activateBloom, changeBloomResource, finishBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
import { addHearts, heartCount } from '../../src/domain/game/hearts';
import { rules } from '../../src/domain/game/model';
import { canUseCard } from '../../src/domain/game/projection';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, resolveDeck(defaultDeckIds), 7), { type: 'start' });
}

describe('開花とアクションの相乗効果', () => {
  it('専用メーター自体が2³¹−1に達し、超えると符号付き32bitのオーバーフローで0へ戻る', () => {
    const active = activateBloom(advanceTo(game(), 6), 1);
    if (!active.bloom) throw new Error('開花が発動していません。');
    const nearMaximum = {
      ...active,
      bloom: { ...active.bloom, progress: rules.maxBloomGauge - 1n },
    };
    const maximum = changeBloomResource(nearMaximum, 'energy', 1n);
    expect(maximum.bloom?.progress).toBe(2_147_483_647n);
    expect(changeBloomResource(maximum, 'energy', 1n).bloom?.progress).toBe(0n);
    expect(maximum.energy).toBe(active.energy);
    expect(maximum.stamina).toBe(active.stamina);
    expect(maximum.excitement).toBe(active.excitement);
    const maintained = advanceTo(maximum, 8);
    expect(maintained.bloom?.progress).toBe(rules.maxBloomGauge);
    expect(maintained.energy).toBe(maximum.energy);
    expect(maintained.stamina).toBe(maximum.stamina);
    expect(maintained.excitement).toBe(maximum.excitement);
  });
  it('増幅と元気の回復を開花前に準備したときだけ、発動時の強度と条件付き増幅が上がる', () => {
    const base = { ...advanceTo(game(), 6), excitement: 200001 };
    const prepare = (state: typeof base) =>
      applyEffect(
        applyEffect(state, {
          kind: 'amplify',
          percent: 50,
          moodBonus: { target: 2, perPoint: 0.25 },
        }),
        { kind: 'stamina', amount: 24 },
      );
    const prepared = applyEffect(prepare(base), { kind: 'bloom', strength: 3.5 });
    const reversed = prepare(applyEffect(base, { kind: 'bloom', strength: 3.5 }));
    expect(prepared.amplification).toBe(162.5);
    expect(prepared.bloom?.strength).toBe(5.6875);
    expect(reversed.bloom?.strength).toBe(3.5);
    const ability = {
      kind: 'resource-boost',
      target: 'stamina',
      percent: 300,
      uses: 3,
      condition: 'mental100',
    } as const;
    expect(applyEffect(prepared, ability).resourceBoosts).toHaveLength(1);
    expect(applyEffect(reversed, ability).resourceBoosts).toHaveLength(0);
    const recover = { kind: 'energy', amount: 13 } as const;
    const preparedGain =
      (applyEffect(prepared, recover).bloom?.progress ?? 0n) - (prepared.bloom?.progress ?? 0n);
    const reversedGain =
      (applyEffect(reversed, recover).bloom?.progress ?? 0n) - (reversed.bloom?.progress ?? 0n);
    expect(preparedGain).toBeGreaterThan(reversedGain);
  });
  for (const mood of [-99, 0, 100]) {
    it(`空模様${mood}%ではエナジーが足りていても開花を使用・発動できない`, () => {
      const base = game();
      const state = {
        ...base,
        track: {
          ...base.track,
          sections: base.track.sections.map((section) => ({ ...section, moodValue: mood })),
        },
      };
      const index = state.hand.indexOf('spark');
      expect(index).toBeGreaterThanOrEqual(0);
      expect(canUseCard(state, index)).toBe(false);
      expect(act(state, { type: 'card', index })).toBe(state);
      expect(activateBloom(state, 1)).toBe(state);
    });
  }

  it('楽曲の空模様−100%区間で開花を使用でき、区間変更後も発動を維持する', () => {
    let state = game();
    const index = state.hand.indexOf('spark');
    expect(canUseCard(advanceTo(state, 5.99), index)).toBe(false);
    state = advanceTo(state, 6);
    expect(canUseCard(state, index)).toBe(true);
    state = act(state, { type: 'card', index });
    expect(state.bloom).not.toBe(null);
    expect(state.stats.cardsUsed).toBe(1);
    const later = advanceTo(state, 12);
    expect(later.bloom).not.toBe(null);
    expect(later.bloom?.progress).toBe(state.bloom?.progress);
  });

  it('増幅を重ね、後続の効果に適用し、次のライブには引き継がない', () => {
    let state = applyEffect(game(), { kind: 'amplify', percent: 50 });
    state = applyEffect(state, { kind: 'amplify', percent: 50 });
    expect(state.amplification).toBe(200);
    state = applyEffect({ ...state, energy: 0 }, { kind: 'energy', amount: 4 });
    expect(state.energy).toBe(8);
    expect(game().amplification).toBe(100);
  });

  it('エナジー・元気・熱気を専用ゲージへ変換し、元の値を復元する', () => {
    const base = { ...advanceTo(game(), 6), energy: 0, excitement: 40, stamina: 80 };
    const active = activateBloom(base, 1);
    expect(active.bloom?.progress).toBe(30n);
    expect(canUseCard(active, 0)).toBe(true);
    let changed = changeBloomResource(active, 'energy', 9n);
    expect(changed.bloom?.progress).toBe(33n);
    changed = changeBloomResource(changed, 'stamina', 100n);
    expect(changed.bloom?.progress).toBe(53n);
    changed = changeBloomResource(changed, 'excitement', 2n);
    expect(changed.bloom?.progress).toBe(63n);
    changed = changeBloomResource(changed, 'energy', -4n);
    expect(changed.bloom?.progress).toBe(61n);
    expect(changed.energy).toBe(0);
    expect(changed.stamina).toBe(80);
    expect(changed.excitement).toBe(40);
    const finished = finishBloom(changed);
    expect(finished.bloom).toBe(null);
    expect(finished.energy).toBe(base.energy);
    expect(finished.stamina).toBe(base.stamina);
    expect(finished.excitement).toBe(base.excitement);
  });

  it('エナジー回復の効果増幅はFloat32計算後に端数を切り上げる', () => {
    const state = applyEffect(
      { ...game(), energy: 0, amplification: 150 },
      { kind: 'energy', amount: 3 },
    );
    expect(state.energy).toBe(5);
  });

  it('条件付き増幅は成立時だけ付与され、対象の効果3回で消費する', () => {
    const effect = {
      kind: 'resource-boost',
      target: 'excitement',
      percent: 300,
      uses: 3,
      condition: 'voltage20',
    } as const;
    expect(applyEffect(game(), effect).resourceBoosts).toHaveLength(0);
    let state = applyEffect(
      activateBloom({ ...advanceTo(game(), 6), excitement: 200001 }, 1),
      effect,
    );
    state = applyEffect(state, { kind: 'stamina', amount: 1 });
    expect(state.resourceBoosts[0]?.uses).toBe(3);
    for (let count = 0; count < 3; count++)
      state = applyEffect(state, { kind: 'excitement', amount: 10 });
    expect(state.resourceBoosts).toHaveLength(0);
  });

  it('回収特性は3000個に達したときだけ発動し、同じ手札では一度だけ発動する', () => {
    const base = game();
    const relay = base.deck.find((card) => card.id === 'spark');
    if (!relay) throw new Error('回収特性のカードがありません。');
    const state = { ...base, hand: [relay.id], hearts: { ...base.hearts, heartLimit: 10000 } };
    const small = act(addHearts(state, 2999), { type: 'collect' });
    expect(heartCount(small)).toBe(0);
    const first = act(addHearts(state, 3000), { type: 'collect' });
    expect(heartCount(first)).toBeGreaterThanOrEqual(3000);
    const second = act(first, { type: 'collect' });
    expect(heartCount(second)).toBe(0);
    expect(act(second, { type: 'collect' })).toBe(second);
  });

  it('停止中は連続回収の猶予を保持し、2秒を超えて回収しないと途切れる', () => {
    const base = game();
    const collected = act(addHearts({ ...base, relayUsed: [...base.hand] }, 3), {
      type: 'collect',
    });
    expect(collected.combo).toBe(1);
    const paused = act(collected, { type: 'pause' });
    expect(advanceTo(paused, 10).combo).toBe(1);
    expect(advanceTo(collected, 2).combo).toBe(1);
    expect(advanceTo(collected, 2.1).combo).toBe(0);
  });

  it('大きな合計得点を整数として加算する', () => {
    const state = { ...game(), score: rules.maxScore - 1n };
    expect(act(addHearts(state, 1), { type: 'collect' }).score).toBe(rules.maxScore);
  });
});
