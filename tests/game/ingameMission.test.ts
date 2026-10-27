import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  advanceIngameMission,
  registerMissionAction,
  registerMissionHeartCollect,
  registerMissionMember,
  startIngameMission,
} from '@akaakuhub/suku-sute-core/game/ingameMissions';
import { game } from './support/game';
import { tokenCardEffect } from './support/tokenCardEffect';

const records = [
  {
    missionType: 1 as const,
    probability: 100,
    rare: true,
    param1: 2,
    param2: 0,
    addParam: 0,
    baseScore: 1000,
    addScore: 200,
    text: 'きらめきを$TargetValue$個獲得',
  },
  {
    missionType: 3 as const,
    probability: 100,
    rare: false,
    param1: 1,
    param2: 1032,
    addParam: 0,
    baseScore: 500,
    addScore: 100,
    text: 'メンバーのカードを$TargetValue$回使用',
  },
];

it('グループからミッションを選び、達成数・報酬・次のミッションを進める', () => {
  const initial = game('bloom');
  const state = {
    ...initial,
    randomSeed: 7,
    track: {
      ...initial.track,
      ingameMissionGroups: [{ id: 7, records }],
    },
  };
  const started = applyEffect(state, { kind: 'ingame-mission', groupId: 7n });
  expect(started.ingameMission?.target).toBe(2);
  const cleared = registerMissionHeartCollect(started, 2);
  expect(cleared.ingameMission?.clearCount).toBe(3);
  expect(cleared.ingameMission?.cooldownSeconds).toBe(1);
  expect(cleared.score).toBeGreaterThan(started.score);
  const next = advanceIngameMission(cleared, 1.1);
  expect(next.ingameMission?.currentIndex).not.toBe(cleared.ingameMission?.currentIndex);
  expect(next.ingameMission?.target).toBe(1);
});

it('ActionType2以外のスキル効果ではActionType2ミッションを進めない', () => {
  const initial = game('bloom');
  const state = {
    ...initial,
    randomSeed: 7,
    track: {
      ...initial.track,
      ingameMissionGroups: [
        {
          id: 8,
          records: [
            {
              missionType: 2 as const,
              probability: 1,
              rare: false,
              param1: 1,
              param2: 13,
              addParam: 0,
              baseScore: 0,
              addScore: 0,
              text: '再抽選を$TargetValue$回実行',
            },
          ],
        },
      ],
    },
  };
  const started = applyEffect(state, { kind: 'ingame-mission', groupId: 8n });
  expect(registerMissionAction(started, 10, 5).ingameMission?.count).toBe(0);
  expect(registerMissionAction(started, 13, 1).ingameMission?.cooldownSeconds).toBe(1);
  expect(registerMissionMember(started, 1032).ingameMission?.count).toBe(0);
});

it('カードのActionType13効果をActionType44のミッションへ通知する', () => {
  const initial = game('bloom');
  const id = initial.hand[0];
  if (!id) throw new Error('手札がありません。');
  const card = initial.deck.find((item) => item.id === id);
  if (!card) throw new Error('カードがありません。');
  const record = {
    missionType: 2 as const,
    probability: 1,
    rare: false,
    param1: 1,
    param2: 13,
    addParam: 0,
    baseScore: 0,
    addScore: 0,
    text: '再抽選を$TargetValue$回実行',
  };
  const updatedCard = {
    ...card,
    effects: [
      { kind: 'ingame-mission' as const, groupId: 9n },
      { kind: 'shuffle' as const, recoverDiscard: false, destination: 'draw' as const },
    ],
  };
  const deck = initial.deck.map((item) => (item.id === id ? updatedCard : item));
  const state = {
    ...initial,
    randomSeed: 7,
    energy: initial.maxEnergy,
    deck,
    cardPool: initial.cardPool.map((item) => (item.id === id ? updatedCard : item)),
    track: {
      ...initial.track,
      ingameMissionGroups: [{ id: 9, records: [record] }],
    },
  };
  const used = act(state, { type: 'card', index: 0 });
  expect(used.ingameMission?.cooldownSeconds).toBe(1);
});

it('一斉生成後のActionType28実生成枚数をミッションへ通知する', () => {
  const initial = game('library');
  const sourceId = initial.hand[0];
  const source = initial.deck.find((card) => card.id === sourceId);
  if (!source) throw new Error('ActionType28の検証カードがありません。');
  const record = {
    missionType: 2 as const,
    probability: 1,
    rare: false,
    param1: 10,
    param2: 28,
    addParam: 0,
    baseScore: 0,
    addScore: 0,
    text: 'カード追加を$TargetValue$枚実行',
  };
  const card = {
    ...source,
    effects: [tokenCardEffect(481, 2n)],
  };
  const deck = initial.deck.map((item) => (item.id === source.id ? card : item));
  const state = {
    ...initial,
    randomSeed: 7,
    energy: initial.maxEnergy,
    deck,
    cardPool: initial.cardPool.map((item) => (item.id === source.id ? card : item)),
    track: {
      ...initial.track,
      ingameMissionGroups: [{ id: 28, records: [record] }],
    },
  };
  const started = applyEffect(state, { kind: 'ingame-mission', groupId: 28n });
  const used = act(started, { type: 'card', index: 0 });

  expect(used.deck.length - started.deck.length).toBeGreaterThan(0);
  expect(used.ingameMission?.count).toBe(2);
});

it('ActionType20のミッションへ手札上限の実変化量を通知する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const record = {
    missionType: 2 as const,
    probability: 100,
    rare: false,
    param1: 3,
    param2: 20,
    addParam: 0,
    baseScore: 0,
    addScore: 0,
    text: '手札上限を$TargetValue$枚増加',
  };
  const state = {
    ...initial,
    track: { ...initial.track, ingameMissionGroups: [{ id: 20, records: [record] }] },
  };
  const started = startIngameMission(state, 20n);
  const effect = handCardCountEffect(3, 3, 0n);
  const changed = applyEffect(started, effect, card);

  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
});

it('ActionType25ミッションは上限の実変化量を加算する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const state = {
    ...initial,
    track: {
      ...initial.track,
      ingameMissionGroups: [
        {
          id: 25,
          records: [
            {
              missionType: 2 as const,
              probability: 100,
              rare: false,
              param1: 100,
              param2: 25,
              addParam: 0,
              baseScore: 0,
              addScore: 0,
              text: 'きらめき上限を$TargetValue$増加',
            },
          ],
        },
      ],
    },
  };
  const active = startIngameMission(state, 25n);
  const effect = {
    kind: 'heart-limit-change',
    calculationType: 1,
    num: 20_000n,
    bonusMoodTarget: 0,
    bonusMoodValue: 0n,
    duration: { kind: 'stage' },
  } as const;
  const changed = applyEffect(active, effect, card);

  expect(changed.ingameMission?.count).toBe(2);
});

it('ActionType1ミッションは上限適用後に実際に追加されたきらめき数を加算する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const state = {
    ...initial,
    hearts: { ...initial.hearts, heartLimit: 3 },
    track: {
      ...initial.track,
      ingameMissionGroups: [
        {
          id: 1,
          records: [
            {
              missionType: 2 as const,
              probability: 100,
              rare: false,
              param1: 100,
              param2: 1,
              addParam: 0,
              baseScore: 0,
              addScore: 0,
              text: 'きらめきを$TargetValue$個生成',
            },
          ],
        },
      ],
    },
  };
  const active = startIngameMission(state, 1n);
  const effect = {
    kind: 'skill-hearts' as const,
    skillEffectId: 1n,
    calculation: 'fixed' as const,
    amount: 100_000,
    displayTime: { kind: 'full-end' as const, value: 0 },
  };
  const changed = applyEffect(active, effect, card);

  expect(changed.ingameMission?.count).toBe(3);
});
