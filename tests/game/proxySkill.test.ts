import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { finishCardActivation } from '../../src/domain/game/cards/cardZones';
import {
  advanceProxySkillPeriods,
  advanceProxySkillSections,
  advanceProxySkillUses,
} from '../../src/domain/game/effects/proxySkill';
import { advanceTo, createGame } from '../../src/domain/game/simulation';
import type { ProxySkillEffect } from '../../src/domain/game/proxySkillTypes';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
}

it('Proxyに吸収された手札数加算を目標数へ反映せず、期限時に原処理の解除量を反映する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const state = applyEffect(
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
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(state, {
    kind: 'hand-limit',
    amount: 1,
    duration: { kind: 'milliseconds', value: 100 },
  });
  expect(absorbed.handLimit).toBe(5);
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(1n);
  expect(advanceTo(absorbed, 0.2).handLimit).toBe(4);
});

it('時間期限のProxy吸収を期限後に解除する', () => {
  const state = game();
  const source = state.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    state,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  expect(active.proxyAbsorptions).toHaveLength(1);
  expect(advanceTo(active, 0.2).proxyAbsorptions).toHaveLength(0);
});

it('Proxyは対象量へ到達して期限を迎えると対象効果を誘発する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'energy', amount: 2 } }],
    },
    source,
  );
  const absorbed = applyEffect(active, { kind: 'hand-limit', amount: 1 }, source);
  const withoutProxy = { ...absorbed, proxyAbsorptions: [] };
  const baseline = advanceTo(withoutProxy, 0.2).energy;
  const induced = advanceTo(absorbed, 0.2).energy;
  const direct = advanceTo(
    applyEffect(withoutProxy, { kind: 'energy', amount: 2 }, source),
    0.2,
  ).energy;
  expect(induced - baseline).toBe(direct - baseline);
});

it('Proxy威力タイプ2は吸収量を加算してから倍率を適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 2,
      inducePowerParam: 5000,
      targets: [{ actionType: 14, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'energy', amount: 3 } }],
    },
    source,
  );
  const absorption = active.proxyAbsorptions[0];
  if (!absorption) throw new Error('Proxy吸収状態がありません。');
  const absorbed = {
    ...active,
    proxyAbsorptions: [
      {
        ...absorption,
        effects: absorption.effects.map((effect) => ({ ...effect, totalAmount: 1n })),
      },
    ],
  };
  const applications: { multiplier: number; addValue: number }[] = [];
  const expired = advanceProxySkillPeriods(
    absorbed,
    0.2,
    (state, _effect, _card, multiplier, addValue) => {
      applications.push({ multiplier, addValue });
      return state;
    },
  );
  expect(applications).toEqual([{ multiplier: 0.5, addValue: 1 }]);
  expect(expired.proxyAbsorptions).toHaveLength(0);
});

it('Proxy威力タイプ3は吸収量と目標量の比を倍率にする', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 2,
      induceCondition: 1,
      inducePowerType: 3,
      inducePowerParam: 0,
      targets: [{ actionType: 14, targetAmount: 2 }],
      effects: [{ actionType: 14, effect: { kind: 'energy', amount: 3 } }],
    },
    source,
  );
  const absorption = active.proxyAbsorptions[0];
  if (!absorption) throw new Error('Proxy吸収状態がありません。');
  const partiallyAbsorbed = {
    ...active,
    proxyAbsorptions: [
      {
        ...absorption,
        effects: absorption.effects.map((effect) => ({ ...effect, totalAmount: 1n })),
      },
    ],
  };
  const applications: { multiplier: number; addValue: number }[] = [];
  advanceProxySkillPeriods(
    partiallyAbsorbed,
    0.2,
    (state, _effect, _card, multiplier, addValue) => {
      applications.push({ multiplier, addValue });
      return state;
    },
  );
  expect(applications).toEqual([{ multiplier: 0.5, addValue: 0 }]);
});

it('Proxy誘発タイミング3はAPKのIsAbsorbEnd判定に従う', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 3,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'energy', amount: 2 } }],
    },
    source,
  );
  const absorbed = applyEffect(active, { kind: 'hand-limit', amount: 1 }, source);
  const ended = advanceProxySkillPeriods(absorbed, 0.2, applyEffect);
  expect(ended.proxyAbsorptions[0]?.isAbsorbEnd).toBe(true);
  const afterSection = advanceProxySkillSections(ended, applyEffect);
  expect(afterSection.proxyAbsorptions[0]?.isAbsorbEnd).toBe(true);
  expect(afterSection.energy).toBe(ended.energy);
});

it('Action57は指定条件に該当するProxyだけIsAbsorbEndにする', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const limited = applyEffect(
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
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const unlimited = applyEffect(
    limited,
    {
      kind: 'proxy-skill',
      absorbLimit: 0,
      periodType: 1,
      periodParam: 3000,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const first = unlimited.proxyAbsorptions[0];
  if (!first) throw new Error('Proxy吸収状態がありません。');
  const reached = {
    ...unlimited,
    proxyAbsorptions: unlimited.proxyAbsorptions.map((absorption, index) =>
      index === 0
        ? {
            ...absorption,
            effects: absorption.effects.map((effect) => ({ ...effect, totalAmount: 1n })),
          }
        : absorption,
    ),
  };
  const forced = applyEffect(reached, { kind: 'proxy-skill-forced-activation', targetType: 4 });
  expect(forced.proxyAbsorptions.map((absorption) => absorption.isAbsorbEnd)).toEqual([
    true,
    false,
  ]);
  expect(advanceTo(forced, 1).proxyAbsorptions).toHaveLength(2);
});

it('ProxyはAction19の移動先より優先され、一斉引き直しで山札へ戻らない', () => {
  const initial = game();
  const source = initial.deck[0];
  const child = initial.deck[1];
  if (!source || !child) throw new Error('発動カードが足りません。');
  const proxyEffect: ProxySkillEffect = {
    kind: 'proxy-skill',
    absorbLimit: 1,
    periodType: 1 as const,
    periodParam: 3000,
    induceTiming: 1,
    induceCondition: 1,
    inducePowerType: 1,
    inducePowerParam: 0,
    targets: [{ actionType: 20, targetAmount: 1 }],
    effects: [],
  };
  let state = applyEffect(initial, { kind: 'card-move', destination: 'exclusion' }, source);
  state = applyEffect(state, proxyEffect, source);
  state = applyEffect(state, { kind: 'card-move', destination: 'exclusion' }, child);
  state = applyEffect(state, proxyEffect, child);
  const activated = {
    ...state,
    hand: state.hand.filter((id) => id !== source.id && id !== child.id),
    drawPile: state.drawPile.filter((id) => id !== child.id),
    activation: {
      sourceId: source.id,
      usedCards: [source.id, child.id],
      allHand: true,
      recoverDiscard: false,
      returnToDraw: [child.id],
      excluded: [],
      handCountChanges: {},
    },
  };
  const finished = finishCardActivation(activated);
  expect(finished.proxyCards).toEqual([source.id, child.id]);
  expect(finished.drawPile).not.toContain(child.id);
  expect(finished.discard).not.toContain(source.id);
  expect(finished.discard).not.toContain(child.id);
});

it('スキル使用回数と消費APを使うProxy期限を個別に進める', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const periodEffect = {
    kind: 'proxy-skill' as const,
    absorbLimit: 1,
    periodParam: 3,
    induceTiming: 1 as const,
    induceCondition: 1 as const,
    inducePowerType: 1 as const,
    inducePowerParam: 0,
    targets: [{ actionType: 20, targetAmount: 1 }],
    effects: [],
  };
  const uses = applyEffect(initial, { ...periodEffect, periodType: 4 as const }, source);
  const costs = applyEffect(uses, { ...periodEffect, periodType: 5 as const }, source);
  const afterUse = advanceProxySkillUses(costs, 'other-card', 2, applyEffect);
  expect(afterUse.proxyAbsorptions.map((item) => item.remainingPeriod)).toEqual([2, 1]);
  const afterSecondUse = advanceProxySkillUses(afterUse, 'other-card', 2, applyEffect);
  expect(afterSecondUse.proxyAbsorptions.map((item) => item.remainingPeriod)).toEqual([1]);
  expect(
    advanceProxySkillUses(afterSecondUse, 'other-card', 2, applyEffect).proxyAbsorptions,
  ).toHaveLength(0);
});
