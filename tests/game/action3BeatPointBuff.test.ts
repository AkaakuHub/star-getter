import { expect, it } from 'vite-plus/test';
import { beatHeartCount } from '../../src/domain/game/beat';
import { game } from './support/game';
import { applyEffect } from '../../src/domain/game/effects';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '../../src/domain/game/cards/handEffects';
import { expireBeatPointBuffSections } from '../../src/domain/game/effects/beatPointBuff';
import { act } from '../../src/domain/game/actions';

it('Action3の加算Buffを基礎BeatPointへ適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const boosted = applyEffect(
    initial,
    {
      kind: 'beat-point-buff',
      amount: 50_000,
      duration: { kind: 'stage' },
      deactivationKey: 'external',
    },
    source,
  );
  const value = boosted.beatPointBuffs[0]?.value;
  if (value === undefined) throw new Error('Action3のBuffがありません。');
  expect(beatHeartCount(boosted) - beatHeartCount(initial)).toBe(value);
  expect(
    act(boosted, { type: 'deactivate-beat-point-buff', deactivationKey: 'external' })
      .beatPointBuffs,
  ).toHaveLength(0);
});

it('Action3の手札永続Buffは手札離脱時に解除され、パート期限も進む', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const effect = {
    kind: 'beat-point-buff',
    amount: 10_000,
    duration: { kind: 'sections', value: 2 },
  } as const;
  const permanentCard = { ...source, handPermanentEffects: [effect] };
  const withPermanentCard = {
    ...initial,
    deck: initial.deck.map((card) => (card.id === source.id ? permanentCard : card)),
    cardPool: initial.cardPool.map((card) => (card.id === source.id ? permanentCard : card)),
  };
  const active = activateHandPermanentEffects(withPermanentCard, permanentCard);
  expect(active.beatPointBuffs[0]?.deactivationKey).toBe(`hand-permanent:${source.id}`);
  expect(expireBeatPointBuffSections(active).beatPointBuffs[0]?.remainingSections).toBe(1);
  expect(disposeHandEffects(active, [source.id]).beatPointBuffs).toHaveLength(0);
});
