import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { cardCooldownTicks } from '../../src/domain/game/projection';
import { skillCooldownSeconds } from '../../src/domain/game/effects/skillCooldown';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

const duration = { kind: 'stage', value: 0 } as const;

it('ActionType40はC#の式で基準時間とデッキ枚数補正を計算し、枚数変更後に更新する', () => {
  const initial = game();
  const effect = {
    kind: 'skill-cooldown',
    num: 20_000,
    deckUnderAdd: 5_000,
    deckOverAdd: 2_500,
    deckUnderLimit: 2,
    deckOverLimit: 1,
    deckCardMax: initial.deck.length + 2,
    duration,
  } as const;
  const state = { ...initial, track: { ...initial.track, songTime: 10_000 } };
  const active = applyEffect(state, effect);
  expect(cardCooldownTicks(active)).toBe(240);
  const expanded = { ...active, deck: [...active.deck, ...active.deck.slice(0, 3)] };
  expect(cardCooldownTicks(expanded)).toBe(150);
});

it('ActionType40は複数効果の最小値を使い、期限後に残った効果へ戻す', () => {
  const initial = { ...game(), track: { ...game().track, songTime: 10_000 } };
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const long = applyEffect(
    initial,
    {
      kind: 'skill-cooldown',
      num: 20_000,
      deckUnderAdd: 0,
      deckOverAdd: 0,
      deckUnderLimit: 0,
      deckOverLimit: 0,
      deckCardMax: null,
      duration,
    },
    source,
  );
  const short = applyEffect(
    long,
    {
      kind: 'skill-cooldown',
      num: 5_000,
      deckUnderAdd: 0,
      deckOverAdd: 0,
      deckUnderLimit: 0,
      deckOverLimit: 0,
      deckCardMax: null,
      duration: { kind: 'milliseconds', value: 500 },
    },
    source,
  );
  expect(cardCooldownTicks(short)).toBe(30);
  expect(cardCooldownTicks(advanceTo(short, 0.6))).toBe(120);
});

it('InvocationType 0x388では枚数再計算と期限を抑止し、Deactivatorだけ解除する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const state = { ...initial, track: { ...initial.track, songTime: 10_000 } };
  const active = applyEffect(
    state,
    {
      kind: 'skill-cooldown',
      num: 20_000,
      deckUnderAdd: 5_000,
      deckOverAdd: 2_500,
      deckUnderLimit: 2,
      deckOverLimit: 1,
      deckCardMax: initial.deck.length + 2,
      duration: { kind: 'milliseconds', value: 500 },
      invocationType: 0x388,
      deactivationKey: 'cooldown',
    },
    source,
  );
  expect(cardCooldownTicks({ ...active, deck: [...active.deck, ...active.deck.slice(0, 3)] })).toBe(
    240,
  );
  expect(advanceTo(active, 0.6).skillCooldownEffects).toHaveLength(1);
  expect(
    act(active, { type: 'deactivate-skill-cooldown', deactivationKey: 'cooldown' })
      .skillCooldownEffects,
  ).toHaveLength(0);
});

it('ActionType40はlongをfloat32・int32へ変換してから時間と枚数補正を計算する', () => {
  const initial = game();
  const state = {
    ...initial,
    track: { ...initial.track, songTime: 1 },
  };
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const floatBoundary = applyEffect(
    state,
    {
      kind: 'skill-cooldown',
      num: 16_777_217,
      deckUnderAdd: 0,
      deckOverAdd: 0,
      deckUnderLimit: 0,
      deckOverLimit: 0,
      deckCardMax: null,
      duration,
    },
    source,
  );
  const active = floatBoundary.skillCooldownEffects[0];
  if (!active) throw new Error('クールタイム効果がありません。');
  const numValue = Math.fround(Math.fround(16_777_216) / Math.fround(10_000));
  const expected = Math.fround(Math.fround(numValue * Math.fround(1)) / Math.fround(10_000));
  expect(skillCooldownSeconds(floatBoundary, active)).toBe(expected);

  const wrappedLimit = applyEffect(
    { ...state, track: { ...state.track, songTime: 10_000 } },
    {
      kind: 'skill-cooldown',
      num: 10_000,
      deckUnderAdd: 10_000,
      deckOverAdd: 0,
      deckUnderLimit: 4_294_967_296,
      deckOverLimit: 0,
      deckCardMax: state.deck.length + 1,
      duration,
    },
    source,
  );
  const wrapped = wrappedLimit.skillCooldownEffects[0];
  if (!wrapped) throw new Error('クールタイム効果がありません。');
  expect(skillCooldownSeconds(wrappedLimit, wrapped)).toBe(1);
});
