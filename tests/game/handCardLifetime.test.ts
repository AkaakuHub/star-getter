import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { activateHandPermanentEffects } from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { game, withHand } from './support/game';

it.each([false, true])(
  '使用元の常在増幅は補充で引くカードへ残さない（全手札使用:%s）',
  (allHand) => {
    const base = game('library');
    const appeal = base.deck[0]?.appeal;
    if (!appeal) throw new Error('確認用カードがありません。');
    const source: Card = {
      id: 'source',
      name: '使用元',
      performer: 'nova',
      charactersId: 1021,
      unitIds: [1],
      costume: null,
      appeal,
      beatPoint: 0,
      consumeAp: 1,
      effects: allHand ? [{ kind: 'use-hand' }] : [],
      handPermanentEffects: [
        {
          kind: 'skill-boost',
          num: 500_000,
          target: { kind: 'all' },
          duration: { kind: 'stage', value: 0n },
          uses: null,
        },
      ],
    };
    const drawn: Card = {
      ...source,
      id: 'drawn',
      name: '補充',
      handPermanentEffects: [],
      effects: [],
      ability893Effects: [{ kind: 'ap', amount: 10 }],
    };
    const deck = [source, drawn];
    const hand = withHand(
      withBoardState(
        {
          ...base,
          deck,
          cardPool: deck,
          handCardStats: {},
          activeHandPermanentCardIds: [],
          action52Buffs: [],
          ap: { ...base.ap, currentAp: 20, maxAp: 100 },
        },
        {},
        { ['source']: { skillUseAtBoardState: 3 }, ['drawn']: { skillUseAtBoardState: 3 } },
      ),
      [source.id],
    );
    const active = activateHandPermanentEffects(hand, source);
    expect(active.action52Buffs).toHaveLength(1);
    const used = act(active, { type: 'card', index: 0 });
    expect(used.ap.currentAp).toBe(29);
    expect(used.action52Buffs).toHaveLength(0);
    expect(Object.keys(used.handCardStats).sort()).toEqual([...used.hand].sort());
  },
);
