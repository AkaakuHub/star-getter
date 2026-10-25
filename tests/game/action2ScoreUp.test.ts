import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { addHearts, collectHearts } from '../../src/domain/game/hearts';
import { game } from './support/game';

function scoreUpEffect(disabledType: number, invocationType?: number) {
  return {
    kind: 'skill-score-up' as const,
    calculation: 1,
    amount: 200_000,
    duration: { kind: 'milliseconds' as const, value: 500 },
    disabledType,
    ...(invocationType === undefined ? {} : { invocationType }),
  };
}

it('ActionType2のミリ秒期限とInvocationTypeの期限抑止を処理する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const timed = applyEffect(initial, scoreUpEffect(0), card);
  expect(timed.skillScoreUps[0]?.percent).toBe(20);
  expect(advanceTo(timed, 0.6).skillScoreUps).toHaveLength(0);

  const persistent = applyEffect(initial, scoreUpEffect(0, 0x388), card);
  expect(advanceTo(persistent, 0.6).skillScoreUps).toHaveLength(1);
});

it('ActionType2のdisabledType1/2は次のきらめき回収で解除する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  for (const disabledType of [1, 2]) {
    const active = applyEffect(initial, scoreUpEffect(disabledType), card);
    const collected = collectHearts(addHearts(active, 1));
    expect(collected.skillScoreUps).toHaveLength(0);
  }
});

it('ActionType2はDeactivator解除を処理する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const active = applyEffect(
    initial,
    { ...scoreUpEffect(0, 0x388), deactivationKey: 'action2-test' },
    card,
  );
  const deactivated = act(active, {
    type: 'deactivate-skill-score-up',
    deactivationKey: 'action2-test',
  });

  expect(deactivated.skillScoreUps).toHaveLength(0);
});

it('ActionType2のEffectAmountが0の場合は期限・回収解除・Deactivatorを登録しない', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const active = applyEffect(initial, { ...scoreUpEffect(1), amount: 0 }, card);
  const afterCollection = collectHearts(addHearts(active, 1));
  const afterTime = advanceTo(afterCollection, 0.6);

  expect(active.skillScoreUps).toHaveLength(1);
  expect(afterTime.skillScoreUps).toHaveLength(1);
  expect(afterTime.skillScoreUps[0]?.removeOnHeartCollect).toBe(false);
  expect(afterTime.skillScoreUps[0]?.deactivationKey).toBeNull();
});
