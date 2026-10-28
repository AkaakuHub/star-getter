import { describe, expect, it } from 'vite-plus/test';
import { evaluateCondition } from '@akaakuhub/suku-sute-core/game/conditions/evaluate';
import { conditionContext } from '@akaakuhub/suku-sute-core/game/conditions/gameContext';
import type { GameCondition } from '@akaakuhub/suku-sute-core/game/conditions/model';
import {
  type LiveConditionContext,
  liveConditionSectionNumber,
  liveConditionMoodValue,
} from '@akaakuhub/suku-sute-core/runtime/live/conditionContext';
import {
  voltageThreshold,
  voltageThresholds,
} from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { game } from './support/game';

const context: LiveConditionContext = {
  voltage: { currentVoltage: voltageThreshold(950), timerSeconds: 0 },
  voltageThresholds,
  maximumVoltageLevel: 1000,
  mental: { currentMental: 30, timerSeconds: 0, mentalDown: false },
  maximumMental: 100,
  moodValue: -100,
  currentSection: 2,
  feverSection: 2,
  cardTotal: 95,
  deckCount: 70,
  graveyardCount: 17,
  exclusionCount: 5,
  tokenCardSeriesCount: (ids) =>
    [[1, 2], [2], [3]].filter((series) => ids.some((id) => series.includes(id))).length,
  memberFanLevelTotal: (ids) =>
    ids.reduce(
      (sum, id) =>
        sum +
        (new Map([
          [1021, 10],
          [1031, 20],
        ]).get(id) ?? 0),
      0,
    ),
  beatHeartValue: 50,
};

describe('カード共通の条件判定', () => {
  const cases: readonly Readonly<{ condition: GameCondition; less: GameCondition }>[] = [
    {
      condition: { kind: 'mental-at-most', fraction: 0.3 },
      less: { kind: 'mental-at-most', fraction: 0.29 },
    },
    {
      condition: { kind: 'mood-at-most', value: -100 },
      less: { kind: 'mood-at-most', value: -101 },
    },
    {
      condition: { kind: 'mood-at-least', value: -100 },
      less: { kind: 'mood-at-least', value: -99 },
    },
    {
      condition: { kind: 'mood-equal', value: -100.8 },
      less: { kind: 'mood-equal', value: -99 },
    },
    {
      condition: { kind: 'voltage-level-at-most', level: 950 },
      less: { kind: 'voltage-level-at-most', level: 949 },
    },
    { condition: { kind: 'part-at-most', number: 3 }, less: { kind: 'part-at-most', number: 2 } },
    {
      condition: { kind: 'relative-part', number: 99 },
      less: { kind: 'relative-part', number: 3 },
    },
    { condition: { kind: 'heat', minimum: 950 }, less: { kind: 'heat', minimum: 951 } },
    {
      condition: { kind: 'mental', minimumPercent: 30 },
      less: { kind: 'mental', minimumPercent: 31 },
    },
    { condition: { kind: 'weather', minimum: -100 }, less: { kind: 'weather', minimum: -99 } },
    { condition: { kind: 'part-from', number: 3 }, less: { kind: 'part-from', number: 4 } },
    { condition: { kind: 'part', number: 99 }, less: { kind: 'part', number: 3 } },
    ...(['all', 'draw', 'discard', 'excluded'] as const).map((zone) => ({
      condition: {
        kind: 'cards' as const,
        zone,
        minimum: {
          all: context.cardTotal,
          draw: context.deckCount,
          discard: context.graveyardCount,
          excluded: context.exclusionCount,
        }[zone],
      },
      less: {
        kind: 'cards' as const,
        zone,
        minimum:
          {
            all: context.cardTotal,
            draw: context.deckCount,
            discard: context.graveyardCount,
            excluded: context.exclusionCount,
          }[zone] + 1,
      },
    })),
    {
      condition: { kind: 'token-series', series: [1, 2], minimum: 2 },
      less: { kind: 'token-series', series: [1, 2], minimum: 3 },
    },
    {
      condition: { kind: 'support-level', members: [1021, 1031], minimum: 30 },
      less: { kind: 'support-level', members: [1021, 1031], minimum: 31 },
    },
    {
      condition: { kind: 'natural-stars', minimum: 50 },
      less: { kind: 'natural-stars', minimum: 51 },
    },
    {
      condition: { kind: 'weather-type', weather: 'rain' },
      less: { kind: 'weather-type', weather: 'sun' },
    },
  ];
  for (const { condition, less } of cases)
    it(`${condition.kind}${'zone' in condition ? ':' + condition.zone : ''}の境界を判定する`, () => {
      expect(evaluateCondition(condition, context)).toBe(true);
      expect(evaluateCondition(less, context)).toBe(false);
    });
  it('条件判定には共通のMentalとVoltageの状態をコピーせず渡す', () => {
    const initial = game();
    const input = conditionContext(initial);
    expect(input.mental).toBe(initial.mental);
    expect(input.voltage).toBe(initial.voltage);
  });
  it('小数を含むメンタルは整数化してからFloat32の割合で比較する', () => {
    const initial = game();
    const state = {
      ...initial,
      mental: { ...initial.mental, currentMental: 1.9 },
      maximumMental: 3,
    };
    const input = conditionContext(state);
    expect(evaluateCondition({ kind: 'mental-at-most', fraction: 0.5 }, input)).toBe(true);
    expect(evaluateCondition({ kind: 'mental', minimumPercent: 50 }, input)).toBe(false);
  });
  it('開花中も偶数奇数の条件は実際の編成枚数で片側だけを実行する', () => {
    const initial = applyEffect(game(), { kind: 'genesis', effectValue: 1 });
    const result = applyEffect(initial, {
      kind: 'branch',
      condition: {
        kind: 'card-count-parity',
        zone: 'all',
        parity: initial.deck.length % 2 === 0 ? 'even' : 'odd',
      },
      whenTrue: [{ kind: 'ap-limit', amount: 1 }],
      whenFalse: [{ kind: 'ap-limit', amount: 2 }],
    });
    expect(result.ap.maxAp).toBe(initial.ap.maxAp + 1);
  });
  it('無条件分岐は常に成立する', () => {
    expect(evaluateCondition({ kind: 'always' }, context)).toBe(true);
  });
  it('複数系列に一致する追加カードも1枚として数える', () => {
    expect(evaluateCondition({ kind: 'token-series', series: [1, 2], minimum: 3 }, context)).toBe(
      false,
    );
  });
  it('Voltage/Mental分岐はtrue側だけを実行し、他の条件は成立側だけを実行する', () => {
    const initial = game();
    const effect = {
      kind: 'branch' as const,
      condition: { kind: 'heat' as const, minimum: 100_000 },
      whenTrue: [{ kind: 'ap-limit' as const, amount: 1 }],
      whenFalse: [{ kind: 'ap-limit' as const, amount: 2 }],
    };
    expect(applyEffect(initial, effect).ap.maxAp).toBe(initial.ap.maxAp + 1);
    const genesis = applyEffect(initial, { kind: 'genesis', effectValue: 1 });
    expect(applyEffect(genesis, effect).ap.maxAp).toBe(initial.ap.maxAp + 1);
  });
  it('開花中は元気割合と熱気段階の条件でもtrue枝・false枝を実行する', () => {
    const initial = game();
    const genesis = applyEffect(initial, { kind: 'genesis', effectValue: 1 });
    const result = applyEffect(genesis, {
      kind: 'branch',
      condition: { kind: 'mental-at-most', fraction: 0.5 },
      whenTrue: [{ kind: 'ap-limit', amount: 1 }],
      whenFalse: [{ kind: 'ap-limit', amount: 2 }],
    });
    expect(result.ap.maxAp).toBe(genesis.ap.maxAp + 3);
  });
  it('開花中も空模様分岐は両側を発動しない', () => {
    const genesis = applyEffect(game(), { kind: 'genesis', effectValue: 1 });
    const context = conditionContext(genesis);
    const result = applyEffect(genesis, {
      kind: 'branch',
      condition: { kind: 'weather', minimum: liveConditionMoodValue(context) },
      whenTrue: [{ kind: 'ap-limit', amount: 1 }],
      whenFalse: [{ kind: 'ap-limit', amount: 2 }],
    });
    expect(result.ap.maxAp).toBe(genesis.ap.maxAp + 1);
  });
  it('永続分岐は条件変化時に前の子効果を解除して切り替える', () => {
    const original = game();
    const originalSource = original.deck[0];
    if (!originalSource) throw new Error('発動元カードがありません。');
    const source = {
      ...originalSource,
      handPermanentEffects: [
        {
          kind: 'branch',
          condition: { kind: 'mood-at-least', value: 1 },
          whenTrue: [
            {
              kind: 'skill-boost',
              num: 200_000,
              target: { kind: 'all' },
              duration: { kind: 'stage', value: 0n },
              uses: null,
            },
          ],
          whenFalse: [
            {
              kind: 'skill-boost',
              num: 100_000,
              target: { kind: 'all' },
              duration: { kind: 'stage', value: 0n },
              uses: null,
            },
          ],
        },
      ],
    } as const;
    const initial = {
      ...original,
      deck: original.deck.map((card) => (card.id === source.id ? source : card)),
      cardPool: original.cardPool.map((card) => (card.id === source.id ? source : card)),
    };
    const branch = activateHandPermanentEffects(initial, source);
    expect(branch.action52Buffs.map((buff) => buff.percent)).toEqual([10]);
    const switched = applyEffect(branch, { kind: 'mood', amount: 10 }, source);
    expect(switched.action52Buffs.map((buff) => buff.percent)).toEqual([20]);
    const ended = disposeHandEffects(switched, [source.id]);
    expect(ended.branchInducers).toHaveLength(0);
    expect(ended.action52Buffs).toHaveLength(0);
  });
  it('山場を99とし、山場後は山場を除いて通常パートの番号を付ける', () => {
    const initial = game();
    const climax = initial.track.sections.findIndex((part) => part.climax);
    expect(climax).toBeGreaterThanOrEqual(0);
    for (let index = 0; index < initial.track.sections.length; index++) {
      const part = initial.track.sections[index];
      if (!part) throw new Error('パートがありません。');
      const state = {
        ...initial,
        tick: Math.ceil(((part.startBeat * 60) / initial.track.bpm) * 60),
      };
      expect(liveConditionSectionNumber(conditionContext(state))).toBe(
        index === climax ? 99 : index - (climax < index ? 1 : 0) + 1,
      );
    }
  });
});
