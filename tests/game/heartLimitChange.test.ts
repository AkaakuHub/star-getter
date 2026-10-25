import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  advanceHeartLimitBuffs,
  applyHeartLimit,
  deactivateHeartLimitBuffs,
  expireHeartLimitBuffSections,
} from '../../src/domain/game/effects/heartLimit';
import { game } from './support/game';

it('加算変更は期限後に解除し、既存の基礎上限へ戻る', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000,
      bonusMoodTarget: 0,
      bonusMoodValue: 0,
      duration: { kind: 'milliseconds', value: 1000 },
    },
    card,
  );
  expect(changed.hearts.heartLimit).toBe(102);
  expect(changed.heartLimitBuffs[0]?.value).toBe(2);
  expect(advanceHeartLimitBuffs(changed, 1).hearts.heartLimit).toBe(100);
});

it('乗算変更はC#のSkillグループ倍率式で基礎上限へ適用する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 2,
      num: 15_000,
      bonusMoodTarget: 0,
      bonusMoodValue: 0,
      duration: { kind: 'stage' },
    },
    card,
  );
  expect(changed.heartLimitBuffs[0]?.value).toBe(50);
  expect(changed.hearts.heartLimit).toBe(5000);
  expect(expireHeartLimitBuffSections(changed).hearts.heartLimit).toBe(5000);
});

it('パート期限と外部解除で上限変更を解除し、直接上限変更は基礎値に加える', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('きらめき上限変更の発動元カードがありません。');
  const changed = applyEffect(
    state,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000,
      bonusMoodTarget: 0,
      bonusMoodValue: 0,
      duration: { kind: 'sections', value: 1 },
      deactivationKey: 'limit',
    },
    card,
  );
  expect(expireHeartLimitBuffSections(changed).hearts.heartLimit).toBe(100);
  expect(applyHeartLimit(changed, 10).hearts.heartLimit).toBe(112);
  const stacked = applyEffect(
    changed,
    {
      kind: 'heart-limit-change',
      calculationType: 1,
      num: 20_000,
      bonusMoodTarget: 0,
      bonusMoodValue: 0,
      duration: { kind: 'stage' },
      deactivationKey: 'limit',
    },
    card,
  );
  expect(stacked.hearts.heartLimit).toBe(104);
  expect(deactivateHeartLimitBuffs(stacked, 'limit').hearts.heartLimit).toBe(100);
});
