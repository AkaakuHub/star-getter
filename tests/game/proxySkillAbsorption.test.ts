import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { absorbSkillEffect } from '../../src/domain/game/effects/proxySkill';
import { createGame } from '../../src/domain/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
}

it('ProxyはActionType2のスコア増加を吸収して登録を止める', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 2, targetAmount: 5 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(active, { kind: 'boost', multiplier: 1.05 }, source);
  expect(absorbed.boosts).toHaveLength(0);
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(20n);
});

it('ProxyはActionType14のエナジー回復をゲージへ反映しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 14, targetAmount: 3 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(active, { kind: 'energy', amount: 3 }, source);
  expect(absorbed.energy).toBe(active.energy);
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(12n);
});

it('Proxyの負の目標値もC#と同じTotalAmount以上の判定を使う', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 48, targetAmount: -3 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(
    active,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: -30_000n,
      duration: { kind: 'stage', value: 0n },
    },
    source,
  );

  expect(absorbed.moodSkillBuffs).toHaveLength(0);
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(0n);
});

it('Proxyの絶対加算では負のActionType48変化を正数として吸収する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 2,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 48, targetAmount: 3 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(
    active,
    {
      kind: 'mood-change-skill',
      calculationType: 1,
      num: -30_000n,
      duration: { kind: 'stage', value: 0n },
    },
    source,
  );
  expect(absorbed.moodSkillBuffs).toHaveLength(0);
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(3n);
});

it('Proxyの吸収合計をC#のint64として折り返す', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 0,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 14, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const absorption = active.proxyAbsorptions[0];
  if (!absorption) throw new Error('Proxyが登録されていません。');
  const nearLimit = {
    ...active,
    proxyAbsorptions: [
      {
        ...absorption,
        effects: [{ ...absorption.effects[0]!, totalAmount: 9_223_372_036_854_775_800n }],
      },
    ],
  };
  const wrapped = absorbSkillEffect(nearLimit, 14, 10n);
  expect(wrapped.state.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(
    -9_223_372_036_854_775_806n,
  );
});
