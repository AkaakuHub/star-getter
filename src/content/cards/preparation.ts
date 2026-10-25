import type { Card, Effect } from '../../domain/game/model';

const hearts = [8, 12, 15, 30, 60, 90, 120, 150, 225, 300, 375] as const;
const boosts = [2, 3, 4, 8, 16, 24, 32, 40, 60, 80, 100] as const;

export const preparationCards: readonly Card[] = [
  {
    id: 'rain-preparation',
    name: '雨の準備',
    performer: 'lumen',
    member: 1042,
    unit: 2,
    costume: 'march',
    cost: 14,
    appeal: { smile: 3850, pure: 4250, cool: 6400 },
    beatPoint: 100,
    collectionAbility: 'icy-kosuzu',
    effects: [
      { kind: 'mood', amount: -50 },
      {
        kind: 'mental-shield',
        durabilityType: 2,
        durability: 1_400_000,
        duration: { kind: 'stage' },
        applyCount: 0,
      },
      { kind: 'ap-speed', percent: 14, duration: 'section' },
      { kind: 'hand-limit', amount: 1, duration: { kind: 'sections', value: 1 } },
    ],
    drawEffects: [
      {
        kind: 'voltage-tier',
        step: 100,
        tiers: hearts.map<readonly Effect[]>((amount) => [
          { kind: 'beat-hearts', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
        ]),
      },
      {
        kind: 'voltage-tier',
        step: 100,
        tiers: boosts.map<readonly Effect[]>((percent) => [
          {
            kind: 'amplify',
            members: [1032],
            percent,
            moodBonus: { target: 2, perPoint: percent * 0.005 },
          },
        ]),
      },
    ],
    handUse: {
      trigger: 2,
      effects: [
        { kind: 'shuffle', recoverDiscard: false, destination: 'discard' },
        { kind: 'cost-reduction', amount: 9, target: { kind: 'unit', unit: 2 } },
        { kind: 'cost-reduction', amount: 9, target: { kind: 'token', token: 'shadow' } },
      ],
    },
  },
];
