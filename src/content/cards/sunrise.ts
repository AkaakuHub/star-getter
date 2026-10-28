import type { Card, Effect } from '@akaakuhub/suku-sute-core/game/model';

const rainy = (effects: readonly Effect[]): Effect => ({
  kind: 'conditional',
  condition: 'mellow100',
  effects,
});
const drained = (effects: readonly Effect[]): Effect => ({
  kind: 'conditional',
  condition: 'mental0',
  effects: [rainy(effects)],
});

export const sunriseCard: Card = {
  cardInstanceId: 'sunrise',
  cardDatasId: 'sunrise',
  name: '晴れ間の輪',
  performer: 'lumen',
  charactersId: 1032,
  unitIds: [2],
  tokenCardSeriesIds: [],
  skillMainEffect: null,
  styleType: null,
  costume: 'sunny',
  consumeAp: 5,
  appeal: { smile: 3300, pure: 5500, cool: 5700 },
  beatPoint: 100,
  effects: [
    { kind: 'heart-boost', percent: 100, uses: 1, moodBonus: { target: 3, perPoint: 0.5 } },
    { kind: 'shuffle', recoverDiscard: false, destination: 'discard' },
    drained([
      {
        kind: 'resource-boost',
        target: 'voltage',
        members: [1042],
        percent: 300,
        moodBonus: { target: 3, perPoint: 1.5 },
        uses: 3,
        condition: 'always',
      },
    ]),
    drained([
      {
        kind: 'resource-boost',
        target: 'attract',
        members: [1042],
        percent: 900,
        moodBonus: { target: 3, perPoint: 4.5 },
        uses: 3,
        condition: 'always',
      },
    ]),
    drained([{ kind: 'beat-hearts', amount: 30, moodBonus: { target: 3, perPoint: 0.15 } }]),
  ],
  collectionEffects: {
    threshold: 3000,
    limit: 1,
    effects: [
      rainy([
        { kind: 'protect-mental', duration: 'section' },
        { kind: 'beat-count', amount: 1 },
      ]),
    ],
  },
};
