import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
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
  expect(active.genesis.effects[0]?.effectValue).toBe(3.5);
});

it('Action51は正のGenesis値へActionType52を適用し、強いGenesisを選ぶ', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const first = applyEffect(
    action52,
    { kind: 'genesis-skill', effectBaseNum: 20_000n, duration: { kind: 'stage', value: 0n } },
    source,
  );
  expect(first.genesis.effects[0]?.effectValue).toBe(3);
  expect(first.action52Buffs).toHaveLength(0);
  const stronger = applyEffect(
    first,
    { kind: 'genesis-skill', effectBaseNum: 50_000n, duration: { kind: 'stage', value: 0n } },
    source,
  );
  expect(stronger.genesis.effects[0]?.effectValue).toBe(5);
});

it('Action51のミリ秒・パート期限では参照実装どおりGenesisを有効化せず、正値のActionType52だけを消費する', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
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
  expect(timed.genesis.effects).toHaveLength(0);
  expect(timed.action52Buffs).toHaveLength(0);
  const section = applyEffect(initial, {
    kind: 'genesis-skill',
    effectBaseNum: 20_000n,
    duration: { kind: 'sections', value: 1n },
  });
  expect(section.genesis.effects).toHaveLength(0);
});

it('Action51の非FullEnd期限0は何も発動せずActionType52も消費しない', () => {
  const initial = game('library');
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
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
  expect(unchanged.genesis.effects).toHaveLength(0);
  expect(unchanged.action52Buffs).toHaveLength(1);
});

it('Action51の期限値を参照実装のint32へ変換してから有効性を判定する', () => {
  const initial = game('library');
  const unchanged = applyEffect(initial, {
    kind: 'genesis-skill',
    effectBaseNum: 20_000n,
    duration: { kind: 'sections', value: 2_147_483_648n },
  });
  expect(unchanged).toBe(initial);
});
