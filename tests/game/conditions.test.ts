import { describe, expect, it } from 'vite-plus/test';
import { evaluateCondition } from '../../src/domain/game/conditions/evaluate';
import { conditionContext } from '../../src/domain/game/conditions/gameContext';
import type { ConditionContext, GameCondition } from '../../src/domain/game/conditions/model';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

const context: ConditionContext = {
  heatLevel: 950,
  mentalFraction: 0.3,
  moodValue: -100,
  staminaPercent: 30,
  weather: -100,
  partIndex: 2,
  partNumber: 99,
  cardCounts: { all: 95, draw: 70, discard: 17, excluded: 5 },
  tokenSeries: [[1, 2], [2], [3]],
  supportLevels: { 1021: 10, 1031: 20 },
  naturalStars: 50,
  bloomActive: false,
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
      condition: { kind: 'stamina', minimumPercent: 30 },
      less: { kind: 'stamina', minimumPercent: 31 },
    },
    { condition: { kind: 'weather', minimum: -100 }, less: { kind: 'weather', minimum: -99 } },
    { condition: { kind: 'part-from', number: 3 }, less: { kind: 'part-from', number: 4 } },
    { condition: { kind: 'part', number: 99 }, less: { kind: 'part', number: 3 } },
    ...(['all', 'draw', 'discard', 'excluded'] as const).map((zone) => ({
      condition: { kind: 'cards' as const, zone, minimum: context.cardCounts[zone] },
      less: { kind: 'cards' as const, zone, minimum: context.cardCounts[zone] + 1 },
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
  it('無条件分岐は常に成立する', () => {
    expect(evaluateCondition({ kind: 'always' }, context)).toBe(true);
  });
  it('複数系列に一致する追加カードも1枚として数える', () => {
    expect(evaluateCondition({ kind: 'token-series', series: [1, 2], minimum: 3 }, context)).toBe(
      false,
    );
  });
  it('通常時は成立した側だけ、開花中の熱気・元気分岐は成立側と不成立側を順に実行する', () => {
    const initial = game();
    const effect = {
      kind: 'branch' as const,
      condition: { kind: 'heat' as const, minimum: 1000 },
      whenTrue: [{ kind: 'energy-limit' as const, amount: 1 }],
      whenFalse: [{ kind: 'energy-limit' as const, amount: 2 }],
    };
    expect(applyEffect(initial, effect).maxEnergy).toBe(initial.maxEnergy + 2);
    const bloom = applyEffect(initial, { kind: 'bloom', strength: 1 });
    expect(applyEffect(bloom, effect).maxEnergy).toBe(initial.maxEnergy + 3);
  });
  it('開花中は元気割合と熱気段階の条件でもtrue枝・false枝を実行する', () => {
    const initial = game();
    const bloom = applyEffect(initial, { kind: 'bloom', strength: 1 });
    const result = applyEffect(bloom, {
      kind: 'branch',
      condition: { kind: 'mental-at-most', fraction: 0.5 },
      whenTrue: [{ kind: 'energy-limit', amount: 1 }],
      whenFalse: [{ kind: 'energy-limit', amount: 2 }],
    });
    expect(result.maxEnergy).toBe(bloom.maxEnergy + 3);
  });
  it('開花中も空模様分岐は両側を発動しない', () => {
    const bloom = applyEffect(game(), { kind: 'bloom', strength: 1 });
    const context = conditionContext(bloom);
    const result = applyEffect(bloom, {
      kind: 'branch',
      condition: { kind: 'weather', minimum: context.weather },
      whenTrue: [{ kind: 'energy-limit', amount: 1 }],
      whenFalse: [{ kind: 'energy-limit', amount: 2 }],
    });
    expect(result.maxEnergy).toBe(bloom.maxEnergy + 1);
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
      expect(conditionContext(state).partNumber).toBe(
        index === climax ? 99 : index - (climax < index ? 1 : 0) + 1,
      );
    }
  });
});
