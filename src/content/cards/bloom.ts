import { baselineMemberFanLevels } from '../memberDefaults';
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
    special: {
      cost: 20,
      extra: false,
      effects: [
        { kind: 'bloom', strength: 3.5 },
        {
          kind: 'skill-cooldown',
          seconds: Math.fround(Math.fround(Math.fround(6666 / 10000) * Math.fround(11605)) / 10000),
        },
      ],
    },
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
    handUse: { trigger: 2, effects: [{ kind: 'shuffle' }, { kind: 'energy', amount: 9 }] },
    effects: [
      {
        kind: 'voltage-tier',
        step: 200,
        tiers: voltageHearts.map<readonly Effect[]>((amount) => [
          { kind: 'beat-hearts', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
        ]),
      },
      {
        kind: 'voltage-tier',
        step: 200,
        tiers: voltagePoints.map<readonly Effect[]>((amount) => [
          { kind: 'excitement', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
        ]),
      },
      mellow([
        {
          kind: 'voltage-tier',
          step: 200,
          tiers: scorePercents.map<readonly Effect[]>((percent) => [
            {
              kind: 'boost',
              multiplier: 1 + percent / 100,
              moodBonus: { target: 3, perPoint: percent * 0.005 },
            },
          ]),
        },
      ]),
      mellow([
        {
          kind: 'voltage-tier',
          step: 200,
          tiers: heartLimits.map<readonly Effect[]>((amount) => [{ kind: 'heart-limit', amount }]),
        },
      ]),
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
    drawRule: { unit: 2, priority: 'always' },
    collectionEffects: {
      threshold: 300_000,
      effects: [
        {
          kind: 'resource-boost',
          target: 'excitement',
          percent: baselineMemberFanLevels[1022],
          moodBonus: { target: 3, perPoint: baselineMemberFanLevels[1022] * 0.005 },
          uses: null,
          condition: 'always',
        },
      ],
    },
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
        step: 200,
        tiers: voltageGains.map<readonly Effect[]>((amount) => [
          { kind: 'excitement', amount, moodBonus: { target: 3, perPoint: amount * 0.005 } },
        ]),
      },
      mellow([
        {
          kind: 'voltage-tier',
          step: 200,
          tiers: targetPercents.map<readonly Effect[]>((percent) => [
            {
              kind: 'amplify',
              percent,
              members: [1022, 1032],
              moodBonus: { target: 3, perPoint: percent * 0.005 },
            },
          ]),
        },
      ]),
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
