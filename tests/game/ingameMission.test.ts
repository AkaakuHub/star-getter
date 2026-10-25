import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import {
  advanceIngameMission,
  registerMissionAction,
  registerMissionHeartCollect,
  registerMissionMember,
} from '../../src/domain/game/ingameMissions';
import { game } from './support/game';

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
  const started = applyEffect(state, { kind: 'ingame-mission', groupId: 7 });
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
  const started = applyEffect(state, { kind: 'ingame-mission', groupId: 8 });
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
      { kind: 'ingame-mission' as const, groupId: 9 },
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
