import type { Card } from '../../domain/game/model';

const appeal = { smile: 1, pure: 1, cool: 1 };

export const routeTokens: readonly Card[] = [
  {
    id: 'ensemble',
    name: '共演の招待',
    performer: 'tetra',
    costume: 'ribbon',
    cost: 0,
    appeal,
    token: 'ensemble',
    drawPreference: 'story',
    effects: [
      { kind: 'tokens', token: 'clock', count: 3 },
      { kind: 'tokens', token: 'bookmark', count: 3 },
      { kind: 'use-hand' },
    ],
  },
  {
    id: 'story',
    name: '花のページ',
    performer: 'nova',
    costume: 'blossom',
    cost: 5,
    appeal,
    token: 'story',
    drawPreference: 'bookmark',
    effects: [
      { kind: 'hearts', amount: 30 },
      { kind: 'heart-limit', amount: 36 },
      { kind: 'boost', multiplier: 4, seconds: 30 },
      { kind: 'excitement', amount: 100 },
    ],
  },
  {
    id: 'clock',
    name: '時を刻む合図',
    performer: 'lumen',
    costume: 'prism',
    cost: 5,
    appeal,
    token: 'clock',
    drawPreference: 'bookmark',
    effects: [
      { kind: 'hand-limit', amount: 3 },
      { kind: 'energy', amount: 5 },
      { kind: 'tokens', token: 'bookmark', count: 1 },
    ],
  },
  {
    id: 'bookmark',
    name: '次の一幕',
    performer: 'tetra',
    costume: 'sunny',
    cost: 5,
    appeal,
    token: 'bookmark',
    drawPreference: 'clock',
    effects: [
      { kind: 'energy', amount: 5 },
      { kind: 'tokens', token: 'story', count: 1 },
      { kind: 'shuffle' },
    ],
  },
];
