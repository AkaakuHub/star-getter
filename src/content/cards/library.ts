import { baselineMemberFanLevels } from '../memberDefaults';
import type { Card } from '../../domain/game/model';

export const libraryCards: readonly Card[] = [
  {
    id: 'library-pages',
    name: '潮の便り',
    performer: 'nova',
    member: 1031,
    unit: 1,
    costume: 'blossom',
    cost: 8,
    appeal: { smile: 4950, pure: 6050, cool: 3400 },
    beatPoint: 100,
    beforeUseAbility: 'story-boost',
    special: {
      cost: 3,
      extra: false,
      effects: [
        {
          kind: 'conditional',
          condition: 'first-section',
          effects: [
            { kind: 'ap-speed', percent: 80, duration: 'section' },
            { kind: 'hand-limit', amount: 3 },
            { kind: 'tokens', token: 'story', count: 30 },
          ],
        },
      ],
    },
    effects: [
      { kind: 'tokens', token: 'story', count: 8 },
      { kind: 'tokens', token: 'clock', count: 1 },
      { kind: 'tokens', token: 'bookmark', count: 1 },
    ],
  },
  {
    id: 'library-invitation',
    name: '港の待ち合わせ',
    performer: 'tetra',
    member: 1041,
    unit: 1,
    costume: 'ribbon',
    cost: 8,
    appeal: { smile: 5000, pure: 6100, cool: 3300 },
    beatPoint: 100,
    drawAbility: 'library',
    beforeUseEffects: [{ kind: 'search-token', token: 'ensemble', count: 2 }],
    effects: [{ kind: 'tokens', token: 'ensemble', count: 3 }],
  },
  {
    id: 'library-ensemble',
    name: '船出の合図',
    performer: 'tetra',
    member: 1021,
    unit: 1,
    costume: 'moon',
    cost: 0,
    appeal: { smile: 6950, pure: 5700, cool: 3550 },
    beatPoint: 100,
    allHandCost: {
      reductions: [0, 20, 40, 60, 80, 100].map((minimumCards) => ({ minimumCards, amount: 10 })),
    },
    drawRules: [
      { condition: { kind: 'unit', value: 1 }, negated: true, weight: 0 },
      { condition: { kind: 'unit', value: 1 }, negated: false, weight: -1 },
    ],
    collectionEffects: {
      threshold: 300_000,
      effects: [{ kind: 'energy', amount: baselineMemberFanLevels[1021] * 0.1 }],
    },
    effects: [
      { kind: 'use-hand' },
      {
        kind: 'conditional',
        condition: 'deck80',
        effects: [
          { kind: 'tokens', token: 'story', count: 3 },
          { kind: 'tokens', token: 'clock', count: 3 },
          { kind: 'tokens', token: 'bookmark', count: 3 },
        ],
      },
    ],
    special: {
      cost: 3,
      extra: true,
      effects: [
        { kind: 'reset-special', unit: 1 },
        { kind: 'energy-limit', amount: 10 },
      ],
    },
  },
];
