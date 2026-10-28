import { baselineMemberFanLevels } from '../memberDefaults';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';

export const libraryCards: readonly Card[] = [
  {
    id: 'library-pages',
    name: '潮の便り',
    performer: 'nova',
    charactersId: 1031,
    unitIds: [1],
    costume: 'blossom',
    consumeAp: 8,
    appeal: { smile: 4950, pure: 6050, cool: 3400 },
    beatPoint: 100,
    beforeUseAbility: 'story-boost',
    special: {
      consumeAp: 3,
      extra: false,
      effects: [
        {
          kind: 'conditional',
          condition: 'first-section',
          effects: [
            { kind: 'ap-speed', percent: 80, duration: 'section' },
            handCardCountEffect(3, 2, 1n),
            { kind: 'tokens', token: 'story', count: 30 },
          ],
        },
      ],
    },
    effects: [
      { kind: 'tokens', token: 'story', count: 2 },
      { kind: 'tokens', token: 'clock', count: 6 },
      { kind: 'tokens', token: 'bookmark', count: 2 },
    ],
  },
  {
    id: 'library-invitation',
    name: '港の待ち合わせ',
    performer: 'tetra',
    charactersId: 1041,
    unitIds: [1],
    costume: 'ribbon',
    consumeAp: 8,
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
    charactersId: 1021,
    unitIds: [1],
    costume: 'moon',
    consumeAp: 0,
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
      limit: 1,
      effects: [{ kind: 'ap', amount: baselineMemberFanLevels[1021] * 0.1 }],
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
      consumeAp: 3,
      extra: true,
      effects: [
        { kind: 'reset-special', scope: 'all', target: { kind: 'unit', unit: 1 } },
        { kind: 'ap-limit', amount: 10 },
      ],
    },
  },
];
