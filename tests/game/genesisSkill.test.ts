import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { game } from './support/game';

it('Action51はFullEnd時にNumToValueを開花強度として登録する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    { kind: 'genesis-skill', effectBaseNum: 35_000n, duration: { kind: 'stage', value: 0n } },
    source,
  );
  expect(active.bloom?.strength).toBe(3.5);
});

it('Action51は正のGenesis値へActionType52を適用し、強いGenesisを選ぶ', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0 },
    uses: 1,
  });
  const first = applyEffect(
    action52,
    { kind: 'genesis-skill', effectBaseNum: 20_000n, duration: { kind: 'stage', value: 0n } },
    source,
  );
  expect(first.bloom?.strength).toBe(3);
  expect(first.action52Buffs).toHaveLength(0);
  const stronger = applyEffect(
    first,
    { kind: 'genesis-skill', effectBaseNum: 50_000n, duration: { kind: 'stage', value: 0n } },
    source,
  );
  expect(stronger.bloom?.strength).toBe(5);
});

it('Action51のミリ秒・パート期限ではC#どおりGenesisを有効化せず、正値のActionType52だけを消費する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0 },
    uses: 1,
  });
  const timed = applyEffect(
    action52,
    {
      kind: 'genesis-skill',
      effectBaseNum: 20_000n,
      duration: { kind: 'milliseconds', value: 1000n },
    },
    source,
  );
  expect(timed.bloom).toBeNull();
  expect(timed.action52Buffs).toHaveLength(0);
  const section = applyEffect(initial, {
    kind: 'genesis-skill',
    effectBaseNum: 20_000n,
    duration: { kind: 'sections', value: 1n },
  });
  expect(section.bloom).toBeNull();
});

it('Action51の非FullEnd期限0は何も発動せずActionType52も消費しない', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0 },
    uses: 1,
  });
  const unchanged = applyEffect(
    action52,
    {
      kind: 'genesis-skill',
      effectBaseNum: 20_000n,
      duration: { kind: 'sections', value: 0n },
    },
    source,
  );
  expect(unchanged.bloom).toBeNull();
  expect(unchanged.action52Buffs).toHaveLength(1);
});

it('Action51の期限値をC#のint32へ変換してから有効性を判定する', () => {
  const initial = game('library');
  const unchanged = applyEffect(initial, {
    kind: 'genesis-skill',
    effectBaseNum: 20_000n,
    duration: { kind: 'sections', value: 2_147_483_648n },
  });
  expect(unchanged).toBe(initial);
});
