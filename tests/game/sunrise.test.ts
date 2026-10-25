import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import { addHearts, collectHearts } from '../../src/domain/game/hearts';
import { advanceTo } from '../../src/domain/game/simulation';
import { advanceHeartBoosts } from '../../src/domain/game/live/heartBoosts';
import { game, withHand } from './support/game';

it('開花中の元気条件は成立し、雨100のときだけ対象限定の追加効果を付与する', () => {
  const initial = game();
  const state = withHand(
    {
      ...initial,
      moodOffset: -100,
      stamina: 80,
      amplification: 100,
      targetBoosts: [],
      bloom: { progress: 1n, strength: 3.5, rollback: { energy: 0, stamina: 80, excitement: 0 } },
    },
    ['sunrise'],
  );
  const sun = state.deck.find((card) => card.id === 'sunrise');
  if (!sun) throw new Error('晴れ間の輪がありません。');
  const effects = sun.effects.filter((effect) => effect.kind === 'conditional');
  const next = effects.reduce((current, effect) => applyEffect(current, effect, sun), state);
  expect(next.resourceBoosts).toEqual([
    { target: 'excitement', percent: 450, uses: 3, members: [1042] },
    { target: 'attract', percent: 1350, uses: 3, members: [1042] },
  ]);
  const other = next.deck.find((card) => card.id === 'frost-pulse');
  const kozu = next.deck.find((card) => card.id === 'rain-preparation');
  if (!other || !kozu) throw new Error('対象カードがありません。');
  expect(
    applyEffect(next, { kind: 'excitement', amount: 100 }, other).resourceBoosts[0]?.uses,
  ).toBe(3);
  expect(applyEffect(next, { kind: 'excitement', amount: 100 }, kozu).resourceBoosts[0]?.uses).toBe(
    2,
  );
  const sunny = effects.reduce((current, effect) => applyEffect(current, effect, sun), {
    ...state,
    moodOffset: 0,
  });
  expect(sunny.resourceBoosts).toHaveLength(0);
});

it('雨100で3000回収すると一度だけ区間保護と自然発生1個を付与する', () => {
  const initial = game();
  let state = withHand(
    { ...initial, moodOffset: -100, hearts: { ...initial.hearts, heartLimit: 10000 } },
    ['sunrise'],
  );
  state = collectHearts(addHearts(state, 3000));
  expect(state.sectionMentalProtected).toBe(true);
  expect(state.sectionBeatHeartBonus).toBe(1);
  state = collectHearts(addHearts(state, 3000));
  expect(state.sectionBeatHeartBonus).toBe(1);
});

it('きらめき獲得の次1回だけHeartUpを消費する', () => {
  let state = withHand(
    {
      ...game(),
      amplification: 100,
      targetBoosts: [],
      hearts: { ...game().hearts, stageHearts: [], hiddenHeartBatches: [] },
    },
    [],
  );
  state = applyEffect(state, { kind: 'heart-boost', percent: 100, uses: 1 });
  state = applyEffect(state, { kind: 'hearts', amount: 10 });
  expect(state.heartBoosts).toHaveLength(0);
  expect(state.hearts.stageHearts.length).toBe(20);
});

it('きらめき増幅は対象カードだけに適用し、別対象の獲得では回数を消費しない', () => {
  const initial = game();
  const source = initial.deck[0];
  const other = initial.deck.find((card) => card.member !== source?.member);
  if (!source || !other) throw new Error('照合用カードがありません。');
  const clean = {
    ...initial,
    handEffectCardIds: [],
    hearts: { ...initial.hearts, stageHearts: [], hiddenHeartBatches: [] },
  };
  const active = applyEffect(clean, {
    kind: 'heart-boost',
    percent: 100,
    uses: 1,
    target: { kind: 'member', member: source.member },
  });
  const unrelated = applyEffect(active, { kind: 'hearts', amount: 10 }, other);
  expect(unrelated.hearts.stageHearts).toHaveLength(10);
  expect(unrelated.heartBoosts[0]?.uses).toBe(1);
  const matched = applyEffect(unrelated, { kind: 'hearts', amount: 10 }, source);
  expect(matched.hearts.stageHearts).toHaveLength(30);
  expect(matched.heartBoosts).toHaveLength(0);
});

it('きらめき増幅値をC#の整数キャストと同じく0方向へ切り捨てる', () => {
  const state = applyEffect(game(), { kind: 'heart-boost', percent: 12.9, uses: 2 });
  expect(state.heartBoosts[0]?.percent).toBe(12);
});

it('回数制限なしのきらめき増幅は使用後も残り、InvocationType中は解除まで継続する', () => {
  const initial = game();
  const active = applyEffect(initial, {
    kind: 'heart-boost',
    percent: 50,
    uses: null,
    duration: { kind: 'milliseconds', value: 100 },
    invocationType: 0x388,
    deactivationKey: 'heart-boost-test',
  });
  const timed = advanceHeartBoosts(active, 1);
  const used = applyEffect(timed, { kind: 'hearts', amount: 10 });
  expect(used.heartBoosts).toHaveLength(1);
  expect(
    act(used, { type: 'deactivate-heart-boost', deactivationKey: 'heart-boost-test' }).heartBoosts,
  ).toHaveLength(0);
});

it('きらめき増幅をミリ秒期限とパート期限で解除する', () => {
  const initial = game();
  const defaultTimed = applyEffect(initial, { kind: 'heart-boost', percent: 50, uses: 2 });
  expect(advanceTo(defaultTimed, 0.1).heartBoosts).toHaveLength(0);
  const timed = applyEffect(initial, {
    kind: 'heart-boost',
    percent: 50,
    uses: 2,
    duration: { kind: 'milliseconds', value: 100 },
  });
  expect(advanceTo(timed, 0.2).heartBoosts).toHaveLength(0);
  const sectionTimed = applyEffect(initial, {
    kind: 'heart-boost',
    percent: 50,
    uses: 2,
    duration: { kind: 'sections', value: 1 },
  });
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const nextSectionTime = (nextSection.startBeat * 60) / initial.track.bpm + 0.1;
  expect(advanceTo(sectionTimed, nextSectionTime).heartBoosts).toHaveLength(0);
});
