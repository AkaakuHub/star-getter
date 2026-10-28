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
    cardInstanceId: 'signal-maker',
    cardDatasId: 'signal-maker',
    name: '旗を掲げて',
    performer: 'tetra',
    charactersId: 1021,
    unitIds: [1],
    tokenCardSeriesIds: [],
    skillMainEffect: null,
    styleType: null,
    costume: 'sailor',
    consumeAp: 2,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    effects: [
      whenDeckParity('even', [{ kind: 'amplify', percent: 1000 }]),
      { kind: 'tokens', token: 'pennant', count: 1 },
      { kind: 'search-token', token: 'pennant', count: 1 },
    ],
  },
  {
    cardInstanceId: 'even-rhythm',
    cardDatasId: 'even-rhythm',
    name: '波の二拍子',
    performer: 'nova',
    charactersId: 1031,
    unitIds: [1],
    tokenCardSeriesIds: [],
    skillMainEffect: null,
    styleType: null,
    costume: 'moon',
    consumeAp: 3,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    effects: [
      whenDeckParity('even', [
        { kind: 'heart-limit', amount: 100000 },
        { kind: 'boost', multiplier: 31 },
      ]),
    ],
  },
  {
    cardInstanceId: 'odd-rhythm',
    cardDatasId: 'odd-rhythm',
    name: '波の三拍子',
    performer: 'lumen',
    charactersId: 1042,
    unitIds: [2],
    tokenCardSeriesIds: [],
    skillMainEffect: null,
    styleType: null,
    costume: 'prism',
    consumeAp: 3,
    appeal: { smile: 5000, pure: 5000, cool: 5000 },
    beatPoint: 100,
    collectionEffects: {
      threshold: 500000,
      effects: [whenDeckParity('odd', [{ kind: 'hearts', amount: 500000 }])],
    },
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
