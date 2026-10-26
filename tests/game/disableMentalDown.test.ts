import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { applyEffect } from '../../src/domain/game/effects';
import { expireDisableMentalDownEffectSections } from '../../src/domain/game/effects/disableMentalDown';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

it('ActionType34は元気0での休憩移行と回復を防ぎ、時間切れで解除する', () => {
  const initial = game('library');
  const timed = applyEffect(initial, {
    kind: 'disable-mental-down',
    duration: { kind: 'milliseconds', value: 500n },
  });
  const atZero = { ...timed, stamina: 0, mentalTimerSeconds: 0 };
  const held = advanceAutomaticGauges(atZero, 0.1);
  expect(held.stamina).toBe(0);
  expect(held.resting).toBe(false);
  const expired = advanceTo(timed, 0.6);
  expect(expired.disableMentalDownEffects).toHaveLength(0);
  expect(advanceAutomaticGauges({ ...expired, stamina: 0 }, 0.1).resting).toBe(true);
});

it('ActionType34は1回の自然減少で元気が0になっても休憩へ移行しない', () => {
  const initial = game('library');
  const protectedState = applyEffect(
    { ...initial, stamina: 1, mentalTimerSeconds: 0 },
    {
      kind: 'disable-mental-down',
      duration: { kind: 'stage', value: 0n },
    },
  );
  const after = advanceAutomaticGauges(protectedState, 1.2);
  expect(after.stamina).toBe(0);
  expect(after.resting).toBe(false);
});

it('ActionType34をDeactivatorで解除する', () => {
  const initial = applyEffect(game(), {
    kind: 'disable-mental-down',
    duration: { kind: 'stage', value: 0n },
    deactivationKey: 'rest-protection',
  });
  const ended = act(initial, {
    type: 'deactivate-mental-down',
    deactivationKey: 'rest-protection',
  });
  expect(ended.disableMentalDownEffects).toHaveLength(0);
});

it('ActionType34はC# longの期限を正確に減算する', () => {
  const initial = game();
  const sectionCount = 9_007_199_254_740_993n;
  const protectedState = applyEffect(initial, {
    kind: 'disable-mental-down',
    duration: { kind: 'sections', value: sectionCount },
  });
  const afterSection = expireDisableMentalDownEffectSections(protectedState);
  expect(afterSection.disableMentalDownEffects[0]?.remainingSections).toBe(sectionCount - 1n);
});
