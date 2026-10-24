import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { activateBloom, changeBloomResource, finishBloom } from '../../src/domain/game/bloom';
import { applyEffect } from '../../src/domain/game/effects';
import { addHearts } from '../../src/domain/game/hearts';
import { rules } from '../../src/domain/game/model';
import { canUseCard } from '../../src/domain/game/projection';
import { integerSqrt } from '../../src/domain/game/scoring';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  return act(createGame(track, resolveDeck(defaultDeckIds), 7), { type: 'start' });
}

describe('開花とスキルの相乗効果', () => {
  it('増幅を重ね、後続の効果に適用し、次のライブには引き継がない', () => {
    let state = applyEffect(game(), { kind: 'amplify', percent: 50 });
    state = applyEffect(state, { kind: 'amplify', percent: 50 });
    expect(state.amplification).toBe(225n);
    state = applyEffect({ ...state, energy: 0 }, { kind: 'energy', amount: 4 });
    expect(state.energy).toBe(9);
    expect(game().amplification).toBe(100n);
  });

  it('AP・メンタル・ボルテージを専用ゲージへ変換し、元の値を復元する', () => {
    const base = { ...game(), energy: 0, excitement: 40, stamina: 80 };
    const active = activateBloom(base, 100n);
    expect(active.bloom?.progress).toBe(120n);
    expect(canUseCard(active, 0)).toBe(true);
    let changed = changeBloomResource(active, 'energy', 9n);
    expect(changed.bloom?.progress).toBe(123n);
    changed = changeBloomResource(changed, 'stamina', 100n);
    expect(changed.bloom?.progress).toBe(143n);
    changed = changeBloomResource(changed, 'excitement', 2n);
    expect(changed.bloom?.progress).toBe(153n);
    changed = changeBloomResource(changed, 'energy', -4n);
    expect(changed.bloom?.progress).toBe(151n);
    expect(changed.energy).toBe(0);
    expect(changed.stamina).toBe(80);
    expect(changed.excitement).toBe(40);
    const finished = finishBloom(changed);
    expect(finished.bloom).toBe(null);
    expect(finished.energy).toBe(base.energy);
    expect(finished.stamina).toBe(base.stamina);
    expect(finished.excitement).toBe(base.excitement);
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
    let state = applyEffect(activateBloom({ ...game(), excitement: 40 }, 100n), effect);
    state = applyEffect(state, { kind: 'stamina', amount: 1 });
    expect(state.resourceBoosts[0]?.uses).toBe(3);
    for (let count = 0; count < 3; count++)
      state = applyEffect(state, { kind: 'excitement', amount: 10 });
    expect(state.resourceBoosts).toHaveLength(0);
  });

  it('回収特性は手札内で一度だけ発動し、空押しで得点を増やさない', () => {
    const base = game();
    const relay = base.deck.find((card) => card.id === 'spark');
    if (!relay) throw new Error('回収特性のカードがありません。');
    const state = { ...base, hand: [relay.id] };
    const first = act(addHearts(state, 3), { type: 'collect' });
    expect(first.hearts).toHaveLength(6);
    const second = act(first, { type: 'collect' });
    expect(second.hearts).toHaveLength(0);
    expect(second.combo).toBe(2);
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

  it('巨大な整数の平方根と9999無量大数付近の加算を正確に扱う', () => {
    const root = 10n ** 68n + 123456789n;
    expect(integerSqrt(root * root)).toBe(root);
    expect(integerSqrt(root * root - 1n)).toBe(root - 1n);
    const state = { ...game(), score: rules.maxScore - 1n };
    expect(act(addHearts(state, 1), { type: 'collect' }).score).toBe(rules.maxScore);
  });
});
