import { expect, it } from 'vite-plus/test';
import { beatHeartCount } from '@akaakuhub/suku-sute-core/game/beat';
import { game } from './support/game';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { expireBeatPointBuffSections } from '@akaakuhub/suku-sute-core/game/effects/beatPointBuff';
import { act } from '@akaakuhub/suku-sute-core/game/actions';

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

it('Action3には汎用のスキル増幅を適用せずActionType52だけを使う', () => {
  const initial = { ...game(), amplification: 200 };
  const source = initial.deck[0];
  if (!source) throw new Error('テスト用カードがありません。');
  const activated = applyEffect(
    initial,
    { kind: 'beat-point-buff', amount: 100_000, duration: { kind: 'stage' } },
    source,
  );

  expect(activated.beatPointBuffs[0]?.value).toBe(10);
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
