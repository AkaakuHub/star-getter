import type { Card, Effect } from '@akaakuhub/suku-sute-core/game/model';

export function whenDeckParity(parity: 'even' | 'odd', effects: readonly Effect[]): Effect {
  return {
    kind: 'branch',
    condition: { kind: 'card-count-parity', zone: 'all', parity },
    whenTrue: effects,
    whenFalse: [],
  };
}

export const parityCards: readonly Card[] = [
  {
    id: 'signal-maker',
    name: '旗を掲げて',
    performer: 'tetra',
    member: 1021,
    unit: 1,
    costume: 'sailor',
    cost: 2,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    effects: [
      whenDeckParity('even', [{ kind: 'amplify', percent: 1000 }]),
      { kind: 'tokens', token: 'pennant', count: 1 },
      { kind: 'search-token', token: 'pennant', count: 1 },
    ],
  },
  {
    id: 'even-rhythm',
    name: '波の二拍子',
    performer: 'nova',
    member: 1031,
    unit: 1,
    costume: 'moon',
    cost: 3,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    effects: [
      whenDeckParity('even', [
        { kind: 'heart-limit', amount: 10000 },
        { kind: 'boost', multiplier: 1000 },
      ]),
    ],
  },
  {
    id: 'odd-rhythm',
    name: '波の三拍子',
    performer: 'lumen',
    member: 1042,
    unit: 2,
    costume: 'prism',
    cost: 3,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    effects: [
      whenDeckParity('odd', [
        { kind: 'beat-count', amount: 2000 },
        { kind: 'beat-hearts', amount: 100 },
        { kind: 'mental', amount: 50 },
        { kind: 'ap', amount: 10 },
      ]),
    ],
  },
];
