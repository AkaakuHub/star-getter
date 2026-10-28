import { expect, it } from 'vite-plus/test';
import {
  createLiveSkillEffectActivationState,
  canActivateLiveSkillEffect,
  isLiveSkillEffectEnabled,
} from '@akaakuhub/suku-sute-core/runtime/skills/skillEffectActivation';

it('全手札使用は本体の先頭1件だけを有効にし、分岐先を有効にしない', () => {
  const first = { id: 'first', actionType: 42 };
  const second = { id: 'second', actionType: 42 };
  const branch = { id: 'branch', actionType: 12 };
  const embedded = { id: 'embedded', actionType: 42 };
  const state = createLiveSkillEffectActivationState([branch, first, second]);
  expect(state.useAllHandSkillEffectId).toBe(first.id);
  expect(isLiveSkillEffectEnabled(state, first)).toBe(true);
  expect(isLiveSkillEffectEnabled(state, second)).toBe(false);
  expect(isLiveSkillEffectEnabled(state, embedded)).toBe(false);
  expect(
    canActivateLiveSkillEffect(first, state, { isSkill: true, activeAllHandSkill: false }),
  ).toBe(true);
  expect(
    canActivateLiveSkillEffect(first, state, { isSkill: false, activeAllHandSkill: false }),
  ).toBe(false);
  expect(
    canActivateLiveSkillEffect(first, state, { isSkill: true, activeAllHandSkill: true }),
  ).toBe(false);
  expect(
    canActivateLiveSkillEffect(branch, state, { isSkill: false, activeAllHandSkill: true }),
  ).toBe(true);
});
