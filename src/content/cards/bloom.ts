import type { Card, Effect } from '../../domain/game/model';

const mellow = (effects: readonly Effect[]): Effect => ({
  kind: 'conditional',
  condition: 'mellow100',
  effects,
});
const voltageHearts = [50, 250, 500, 1000, 1500, 2500] as const;
const voltagePoints = [200, 1000, 2000, 4000, 6000, 10000] as const;
const scorePercents = [3000, 15000, 30000, 60000, 90000, 150000] as const;
const heartLimits = [500, 2500, 5000, 10000, 15000, 25000] as const;
const voltageGains = [2000, 10000, 20000, 40000, 80000, 200000] as const;
const targetPercents = [20, 100, 200, 400, 800, 2000] as const;
export const bloomCards: readonly Card[] = [
  {
    id: 'horizon',
    name: '空のはじまり',
    performer: 'nova',
    member: 1031,
    unit: 1,
    costume: 'star',
    cost: 20,
    appeal: { smile: 6300, pure: 4400, cool: 3500 },
    beatPoint: 100,
    drawAbility: 'genesis',
    relay: { threshold: 3000, hearts: 3000, beats: true, moodBonus: { target: 2, perPoint: 15 } },
    special: { cost: 20, extra: false, effects: [{ kind: 'bloom', strength: 3.5 }] },
    effects: [
      { kind: 'beat-hearts', amount: 300, moodBonus: { target: 2, perPoint: 1.5 } },
      { kind: 'ap-speed', percent: 30, duration: 'stage' },
      { kind: 'excitement', amount: 3000, moodBonus: { target: 2, perPoint: 15 } },
      { kind: 'stamina', amount: 300, moodBonus: { target: 2, perPoint: 1.5 } },
    ],
  },
  {
    id: 'frost-echo',
    name: '雨音の反響',
    performer: 'lumen',
    member: 1032,
    unit: 2,
    costume: 'snow',
    cost: 14,
    appeal: { smile: 3900, pure: 4000, cool: 6600 },
    beatPoint: 100,
    useAbility: 'icy-sayaka',
    collectionAbility: 'icy-sayaka',
    effects: [
      {
        kind: 'voltage-tier',
        tiers: voltageHearts.map((amount, index) => {
          const points = voltagePoints[index],
            score = scorePercents[index],
            limit = heartLimits[index];
          if (points === undefined || score === undefined || limit === undefined)
            throw new Error('段階の効果がありません。');
          return [
            { kind: 'beat-hearts', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
            {
              kind: 'excitement',
              amount: points,
              moodBonus: { target: 3, perPoint: points * 0.005 },
            },
            mellow([
              {
                kind: 'boost',
                multiplier: 1 + score / 100,
                moodBonus: { target: 3, perPoint: score * 0.005 },
              },
              { kind: 'heart-limit', amount: limit },
            ]),
          ];
        }),
      },
    ],
  },
  {
    id: 'frost-pulse',
    name: '凍空の鼓動',
    performer: 'lumen',
    member: 1022,
    unit: 2,
    costume: 'witch',
    cost: 14,
    appeal: { smile: 4900, pure: 4600, cool: 7000 },
    beatPoint: 100,
    drawRule: { unit: 2 },
    special: {
      cost: 3,
      extra: true,
      effects: [
        { kind: 'reset-special', unit: 2 },
        { kind: 'voltage-limit', amount: 500 },
      ],
    },
    effects: [
      {
        kind: 'voltage-tier',
        tiers: voltageGains.map((amount, index) => {
          const percent = targetPercents[index];
          if (percent === undefined) throw new Error('段階の効果がありません。');
          return [
            { kind: 'excitement', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
            mellow([
              {
                kind: 'amplify',
                percent,
                members: [1022, 1032],
                moodBonus: { target: 3, perPoint: percent * 0.005 },
              },
            ]),
          ];
        }),
      },
    ],
  },
  {
    id: 'perennial',
    name: '続いていく雲',
    performer: 'tetra',
    member: 1033,
    unit: 3,
    costume: 'prism',
    cost: 13,
    appeal: { smile: 4400, pure: 4900, cool: 5100 },
    beatPoint: 100,
    drawAbility: 'perennial',
    passive: {
      skillBoost: { members: [1031, 1032], percent: 300, moodBonus: { target: 3, perPoint: 1.5 } },
    },
    effects: [
      { kind: 'boost', multiplier: 1.45, moodBonus: { target: 3, perPoint: 0.225 } },
      mellow([
        {
          kind: 'resource-boost',
          target: 'excitement',
          percent: 300,
          uses: 5,
          condition: 'always',
          moodBonus: { target: 3, perPoint: 1.5 },
        },
      ]),
    ],
  },
];
