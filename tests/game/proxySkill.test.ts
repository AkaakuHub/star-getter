import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import {
  advanceProxySkillPeriods,
  advanceProxySkillSections,
  advanceProxySkillUses,
} from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7, 100, routes.genesis.tokens), {
    type: 'start',
  });
}

it.each([
  { actionType: 14, effect: { kind: 'ap' as const, amount: 1 } },
  { actionType: 20, effect: handCardCountEffect(1, 1, 0n) },
])(
  'Action$actionTypeの吸収到達でその場で誘発し、元の効果を適用しない',
  ({ actionType, effect }) => {
    const initial = game();
    const source = initial.deck[0];
    if (!source) throw new Error('Proxy発動元カードがありません。');
    const active = applyEffect(
      initial,
      {
        kind: 'proxy-skill',
        absorbLimit: 1,
        periodType: 3,
        periodParam: 0n,
        induceTiming: 1,
        induceCondition: 1,
        inducePowerType: 1,
        inducePowerParam: 0n,
        targets: [{ actionType, targetAmount: 1 }],
        effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
      },
      source,
    );
    const next = applyEffect(active, effect, source);
    expect(next.proxySkills).toEqual([]);
    expect(next.ap.currentAp).toBe(initial.ap.currentAp + 8);
    expect(next.tokenCardDeck.handTargetCounts.current).toBe(
      initial.tokenCardDeck.handTargetCounts.current,
    );
  },
);

it('Proxyに吸収された手札数加算は目標数を変えず、期限時にも解除量を通知しない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const state = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const absorbed = applyEffect(state, handCardCountEffect(1, 1, 100n));
  expect(absorbed.tokenCardDeck.handTargetCounts.current).toBe(5);
  expect(absorbed.proxySkills).toEqual([]);
  expect(advanceTo(absorbed, 0.2).tokenCardDeck.handTargetCounts.current).toBe(5);
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
      periodParam: 100n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  expect(active.proxySkills).toHaveLength(1);
  expect(advanceTo(active, 0.2).proxySkills).toHaveLength(0);
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
      periodParam: 100n,
      induceTiming: 2,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
    },
    source,
  );
  const absorbed = applyEffect(active, handCardCountEffect(1, 3, 0n), source);
  const withoutProxy = { ...absorbed, proxySkills: [] };
  const baseline = advanceTo(withoutProxy, 0.2).ap.currentAp;
  const induced = advanceTo(absorbed, 0.2).ap.currentAp;
  const direct = advanceTo(applyEffect(withoutProxy, { kind: 'ap', amount: 2 }, source), 0.2).ap
    .currentAp;
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
      periodParam: 100n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 2,
      inducePowerParam: 5000n,
      targets: [{ actionType: 14, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 3 } }],
    },
    source,
  );
  const absorption = active.proxySkills[0];
  if (!absorption) throw new Error('Proxy吸収状態がありません。');
  const absorbed = {
    ...active,
    proxySkills: [
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
      applications.push({ multiplier: multiplier ?? 1, addValue: addValue ?? 0 });
      return state;
    },
  );
  expect(applications).toEqual([{ multiplier: 0.5, addValue: 1 }]);
  expect(expired.proxySkills).toHaveLength(0);
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
      periodParam: 100n,
      induceTiming: 2,
      induceCondition: 1,
      inducePowerType: 3,
      inducePowerParam: 0n,
      targets: [{ actionType: 14, targetAmount: 2 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 3 } }],
    },
    source,
  );
  const absorption = active.proxySkills[0];
  if (!absorption) throw new Error('Proxy吸収状態がありません。');
  const partiallyAbsorbed = {
    ...active,
    proxySkills: [
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
      applications.push({ multiplier: multiplier ?? 1, addValue: addValue ?? 0 });
      return state;
    },
  );
  expect(applications).toEqual([{ multiplier: 0.5, addValue: 0 }]);
});

it('Proxy誘発タイミング3はruntimeのIsAbsorbEnd判定に従う', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100n,
      induceTiming: 3,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
    },
    source,
  );
  const absorbed = applyEffect(active, handCardCountEffect(1, 3, 0n), source);
  const ended = advanceProxySkillPeriods(absorbed, 0.2, applyEffect);
  expect(ended.proxySkills[0]?.isAbsorbEnd).toBe(true);
  const afterSection = advanceProxySkillSections(ended, applyEffect);
  expect(afterSection.proxySkills[0]?.isAbsorbEnd).toBe(true);
  expect(afterSection.ap.currentAp).toBe(ended.ap.currentAp);
});

it('Action57は指定条件のProxyを即時誘発して解除する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const limited = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [{ actionType: 14, effect: { kind: 'ap', amount: 2 } }],
    },
    source,
  );
  const unlimited = applyEffect(
    limited,
    {
      kind: 'proxy-skill',
      absorbLimit: 0,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const first = unlimited.proxySkills[0];
  if (!first) throw new Error('Proxy吸収状態がありません。');
  const reached = {
    ...unlimited,
    proxySkills: unlimited.proxySkills.map((absorption, index) =>
      index === 0
        ? {
            ...absorption,
            effects: absorption.effects.map((effect) => ({ ...effect, totalAmount: 1n })),
          }
        : absorption,
    ),
  };
  const forced = applyEffect(reached, { kind: 'proxy-skill-forced-activation', targetType: 4n });
  expect(forced.proxySkills.map((absorption) => absorption.id)).toEqual([first.id + 1]);
  expect(forced.ap.currentAp).toBe(reached.ap.currentAp + 8);
  const forcedUnlimited = applyEffect(reached, {
    kind: 'proxy-skill-forced-activation',
    targetType: 9_007_203_549_708_291n,
  });
  expect(forcedUnlimited.proxySkills.map((absorption) => absorption.id)).toEqual([first.id]);
  expect(advanceTo(forced, 1).proxySkills).toHaveLength(1);
});

it('スキル使用回数と消費APを使うProxy期限を個別に進める', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const periodEffect = {
    kind: 'proxy-skill' as const,
    absorbLimit: 1,
    periodParam: 3n,
    induceTiming: 1 as const,
    induceCondition: 1 as const,
    inducePowerType: 1 as const,
    inducePowerParam: 0n,
    targets: [{ actionType: 20, targetAmount: 1 }],
    effects: [],
  };
  const uses = applyEffect(initial, { ...periodEffect, periodType: 4 as const }, source);
  const costs = applyEffect(uses, { ...periodEffect, periodType: 5 as const }, source);
  const afterUse = advanceProxySkillUses(costs, 'other-card', 2, applyEffect);
  expect(afterUse.proxySkills).toMatchObject([{ remainingPeriod: 2n }, { remainingPeriod: 1n }]);
  const afterSecondUse = advanceProxySkillUses(afterUse, 'other-card', 2, applyEffect);
  expect(afterSecondUse.proxySkills).toMatchObject([{ remainingPeriod: 1n }]);
  expect(
    advanceProxySkillUses(afterSecondUse, 'other-card', 2, applyEffect).proxySkills,
  ).toHaveLength(0);
});
