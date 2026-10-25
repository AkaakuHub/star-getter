import type { Card, Effect } from '../../domain/game/model';

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
  id: 'sunrise',
  name: '晴れ間の輪',
  performer: 'lumen',
  member: 1032,
  unit: 2,
  costume: 'sunny',
  cost: 5,
  appeal: { smile: 3300, pure: 5500, cool: 5700 },
  beatPoint: 100,
  effects: [
    { kind: 'heart-boost', percent: 100, uses: 1, moodBonus: { target: 3, perPoint: 0.5 } },
    { kind: 'shuffle' },
    drained([
      {
        kind: 'resource-boost',
        target: 'excitement',
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
    effects: [
      rainy([
        { kind: 'protect-mental', duration: 'section' },
        { kind: 'beat-count', amount: 1 },
      ]),
    ],
  },
};
