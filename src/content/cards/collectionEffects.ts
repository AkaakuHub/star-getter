import type { Card } from '@akaakuhub/suku-sute-core/game/model';

export const rainCollectionEffects: NonNullable<Card['collectionEffects']> = {
  threshold: 500_000,
  limit: 1,
  effects: [
    {
      kind: 'branch',
      condition: { kind: 'heat', minimum: 950 },
      whenTrue: [
        {
          kind: 'branch',
          condition: { kind: 'mental-at-most', fraction: 0 },
          whenTrue: [
            { kind: 'shuffle', recoverDiscard: false, destination: 'discard' },
            { kind: 'search-unit', unit: 2, count: 4 },
            { kind: 'voltage', amount: -1_400_000 },
            {
              kind: 'branch',
              condition: { kind: 'heat', minimum: 1000 },
              whenTrue: [{ kind: 'voltage', amount: -14_000_000 }],
              whenFalse: [],
            },
          ],
          whenFalse: [],
        },
      ],
      whenFalse: [],
    },
  ],
};
