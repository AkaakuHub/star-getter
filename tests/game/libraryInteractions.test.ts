import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect, skillValue } from '@akaakuhub/suku-sute-core/game/effects';
import { applyDrawAbility } from '@akaakuhub/suku-sute-core/game/cards/drawAbilities';
import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import {
  rules,
  type Card,
  type GameState,
  type TokenKind,
} from '@akaakuhub/suku-sute-core/game/model';
import { cardCooldownTicks, moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game, withHand } from './support/game';

function token(state: GameState, kind: TokenKind): Card {
  const card = state.deck.find((item) => item.token === kind);
  if (!card) throw new Error('追加カードがありません。');
  return card;
}

function card(state: GameState, id: string): Card {
  const source = state.deck.find((item) => item.id === id);
  if (!source) throw new Error('基本カードがありません。');
  return source;
}

it('同じ2枚でも、空模様を晴れ100%に変えてから使ったときだけ追加効果を得る', () => {
  let initial = addTokens(addTokens(game('library'), 'clock', 1), 'story', 1);
  const clock = token(initial, 'clock'),
    story = token(initial, 'story');
  initial = withHand({ ...initial, moodOffset: 50, energy: 20, maxEnergy: 20 }, [
    clock.id,
    story.id,
  ]);
  const play = (first: Card, second: Card) => {
    const used = act(initial, { type: 'card', index: initial.hand.indexOf(first.id) });
    const state = advanceTo(used, (used.tick + cardCooldownTicks(used)) / rules.ticksPerSecond);
    return act(state, { type: 'card', index: state.hand.indexOf(second.id) });
  };
  const prepared = play(clock, story),
    reversed = play(story, clock);
  expect(prepared.stats.cardsUsed).toBe(2);
  expect(reversed.stats.cardsUsed).toBe(2);
  expect(moodValue(prepared)).toBe(100);
  expect(prepared.hearts.heartLimit).toBeGreaterThan(reversed.hearts.heartLimit);
  expect(prepared.boosts.reduce((sum, boost) => sum + boost.percent, 0)).toBeGreaterThan(
    reversed.boosts.reduce((sum, boost) => sum + boost.percent, 0),
  );
});

it('80枚で舵を引いた増幅は貝がらだけに適用する', () => {
  let state = addTokens(addTokens(game('library'), 'clock', 1), 'story', 1);
  state = addTokens(state, 'story', 80 - state.deck.length);
  const clock = token(state, 'clock'),
    story = token(state, 'story');
  state = withHand({ ...state, moodOffset: 50 }, [clock.id]);
  const drawn = applyDrawAbility(state, clock);
  expect(drawn.apTimeEffects[0]?.value).toBe(0.5);
  expect(drawn.storyAmplification).toBe(1251.25);
  expect(drawn.amplification).toBe(state.amplification);
  const effect = { kind: 'hearts', amount: 10 } as const;
  expect(skillValue(drawn, 10, effect, clock)).toBe(skillValue(state, 10, effect, clock));
  expect(skillValue(drawn, 10, effect, story)).toBeGreaterThan(
    skillValue(state, 10, effect, story) * 10,
  );
});

it('招待状の消費減少は元の所属で判定し、同じ太陽の見た目でも撮影係には適用しない', () => {
  let state = addTokens(game('library'), 'story', 74);
  state = { ...state, costReductions: {} };
  const story = token(state, 'story'),
    camera = card(state, 'camera');
  const drawn = applyDrawAbility(state, card(state, 'library-invitation'));
  expect(cardCost(state, story)).toBe(5);
  expect(cardCost(drawn, story)).toBe(1);
  expect(cardCost(drawn, camera)).toBe(cardCost(state, camera));
});

for (const count of [79, 80]) {
  it(`共演は${count}枚の条件で追加カードを生成し、使用後も循環する`, () => {
    let state = game('library');
    state = addTokens(state, 'story', count - state.deck.length);
    const source = card(state, 'library-ensemble');
    state = withHand({ ...state, energy: 1 }, [source.id]);
    const used = act(state, { type: 'card', index: 0 });
    expect(used.stats.cardsUsed).toBe(1);
    expect(used.deck.some((item) => item.id === source.id)).toBe(true);
    expect(used.discard).toContain(source.id);
    expect(used.deck.filter((item) => item.token === 'clock')).toHaveLength(count >= 80 ? 3 : 0);
    expect(used.deck.filter((item) => item.token === 'bookmark')).toHaveLength(count >= 80 ? 3 : 0);
    expect(used.deck).toHaveLength(count + (count >= 80 ? 9 : 0));
  });
}

it('共演の一斉使用は元の手札を順に使用し、子カードの生成・除外も実行する', () => {
  let state = addTokens(
    addTokens(addTokens(game('library'), 'ensemble', 1), 'clock', 1),
    'story',
    1,
  );
  const ensemble = token(state, 'ensemble'),
    clock = token(state, 'clock'),
    story = token(state, 'story');
  state = withHand({ ...state, energy: 20, maxEnergy: 20 }, [ensemble.id, clock.id, story.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(3);
  expect(used.cardUses.map((use) => use.card.id)).toEqual([ensemble.id, clock.id, story.id]);
  expect(used.deck.some((item) => item.id === clock.id || item.id === story.id)).toBe(false);
  expect(used.deck.filter((item) => item.token === 'bookmark')).toHaveLength(4);
  expect(used.deck.some((item) => item.id === ensemble.id)).toBe(false);
});

it('100枚の状態で浮き輪を使うと、生成判定が先なので追加できず除外後99枚になる', () => {
  let state = addTokens(game('library'), 'bookmark', 1);
  state = addTokens(state, 'story', 100 - state.deck.length);
  const source = token(state, 'bookmark');
  const beforeId = state.nextTokenId;
  state = withHand({ ...state, energy: 10 }, [source.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.deck).toHaveLength(99);
  expect(used.nextTokenId).toBe(beforeId);
  expect([...used.hand, ...used.drawPile, ...used.discard]).not.toContain(source.id);
  expect(addTokens(used, 'clock', 10).deck).toHaveLength(100);
});

it('手札中の対象増幅と熱気回復増幅を掛け合わせ、同じ見た目の別所属には適用しない', () => {
  let state = game();
  state = withHand({ ...state, tick: 720, moodOffset: -100, energy: 0, excitement: 0 }, [
    'perennial',
  ]);
  const effect = { kind: 'excitement', amount: 10 } as const;
  expect(skillValue(state, 10, effect, card(state, 'horizon'))).toBe(55);
  expect(skillValue(state, 10, effect, card(state, 'camera'))).toBe(10);
  state = applyEffect(state, {
    kind: 'resource-boost',
    target: 'excitement',
    percent: 300,
    uses: 5,
    condition: 'always',
  });
  const boosted = applyEffect(state, effect, card(state, 'horizon'));
  expect(boosted.excitement).toBe(220);
  expect(boosted.resourceBoosts[0]?.uses).toBe(4);
});

it('パズルは14回目に通常熱気を設定し、元気0でも休憩せず除外する', () => {
  const initial = game();
  let state = addTokens(
    {
      ...initial,
      deck: initial.deck.map((card) =>
        card.id === 'horizon' ? { ...card, drawAbility: undefined } : card,
      ),
    },
    'shadow',
    1,
  );
  const source = token(state, 'shadow');
  for (let count = 1; count <= 14; count++) {
    state = withHand(
      {
        ...state,
        tick: state.tick + cardCooldownTicks(state),
        energy: 20,
        maxEnergy: 20,
        resting: false,
      },
      [source.id],
    );
    state = act(state, { type: 'card', index: 0 });
    expect(state.cardUseCounts[source.id]).toBe(count);
    expect(state.deck.some((item) => item.id === source.id)).toBe(count < 14);
  }
  expect(state.mentalProtected).toBe(true);
  expect(state.stamina).toBe(0);
  expect(state.excitement).toBe(655_000_000);
  expect(advanceTo(state, 3).resting).toBe(false);
});

it('一斉使用中の除外予約は総枚数に残り、後続80枚条件を判定してから除外する', () => {
  let state = addTokens(game('library'), 'story', 1);
  state = addTokens(state, 'bookmark', 80 - state.deck.length);
  const source = card(state, 'library-ensemble'),
    story = token(state, 'story');
  state = withHand({ ...state, energy: 1 }, [source.id, story.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(2);
  expect(used.deck).toHaveLength(88);
  expect(used.deck.filter((item) => item.token === 'clock')).toHaveLength(3);
});

it('使用中の極光を補充候補へ戻さず、AP0化の後で新手札の回復を実行する', () => {
  let state = addTokens(game('library'), 'bookmark', 20);
  const source = card(state, 'aurora-ensemble'),
    bookmark = token(state, 'bookmark');
  state = withHand({ ...state, energy: 20, maxEnergy: 20 }, [
    source.id,
    'library-ensemble',
    bookmark.id,
  ]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(3);
  expect(used.energy).toBeGreaterThan(0);
  expect(used.energy).toBeLessThan(used.maxEnergy);
  expect(used.hand).not.toContain(source.id);
  expect(used.discard).toContain(source.id);
  expect(used.activation).toBeNull();
  expect(used.lastUsedMember).toBe(source.member);
  expect(used.lastUsedUnit).toBe(source.unit);
});

it('ActionType42の子カードは親スキルの追加カード確定後に80枚条件を判定する', () => {
  let state = addTokens(game('library'), 'ensemble', 1);
  state = addTokens(state, 'story', 79 - state.deck.length);
  const source = token(state, 'ensemble');
  state = withHand({ ...state, energy: 1 }, [source.id, 'library-ensemble']);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(2);
  expect(used.deck).toHaveLength(93);
  expect(used.deck.filter((item) => item.token === 'clock')).toHaveLength(6);
  expect(used.deck.filter((item) => item.token === 'bookmark')).toHaveLength(6);
  expect(used.tokenGroups).toEqual([]);
  expect(used.deck.some((item) => item.id === source.id)).toBe(false);
  expect([...used.hand, ...used.drawPile, ...used.discard]).not.toContain(source.id);
});

for (const [count, baseReduction, tokenReduction] of [
  [20, 20, 10],
  [100, 60, 100],
]) {
  it(`総数${count}枚で基本の共演と生成された帆船の割引を別々に計算する`, () => {
    if (count === undefined || baseReduction === undefined || tokenReduction === undefined)
      throw new Error('割引条件がありません。');
    let state = addTokens(game(), 'ensemble', 1);
    state = addTokens(state, 'story', count - state.deck.length);
    const generated = token(state, 'ensemble');
    const others = [
      'horizon',
      'frost-echo',
      'frost-pulse',
      'rain-preparation',
      'perennial',
      'camera',
      'class',
    ];
    state = withHand({ ...state, costReductions: {}, handLimit: 8 }, [
      'library-ensemble',
      ...others,
    ]);
    expect(cardCost(state, card(state, 'library-ensemble'))).toBe(82 - baseReduction);
    state = withHand(state, [generated.id, ...others]);
    expect(cardCost(state, generated)).toBe(Math.max(1, 82 - tokenReduction));
  });
}

it('一斉使用の追加APを全手札コストへ加え、最終コストを1以上にする', () => {
  const initial = game('library');
  const source = card(initial, 'library-ensemble');
  const effects = source.effects.map((effect) =>
    effect.kind === 'use-hand' ? { ...effect, addAp: 7 } : effect,
  );
  const updated = { ...source, effects };
  const deck = initial.deck.map((item) => (item.id === source.id ? updated : item));
  const otherIds = deck
    .filter((item) => item.id !== source.id)
    .slice(0, 2)
    .map(({ id }) => id);
  const state = withHand(
    { ...initial, deck, cardPool: deck, energy: 100, costReductions: { [source.id]: 1000 } },
    [source.id, ...otherIds],
  );
  expect(cardCost(state, updated)).toBe(1);

  const withoutReduction = { ...state, costReductions: {} };
  expect(cardCost(withoutReduction, updated)).toBe(cardCost(withoutReduction, source) + 7);
});

it('ActionType42の追加APは参照実装同様にint32へ変換する', () => {
  const initial = game('library');
  const source = card(initial, 'library-ensemble');
  const updated = {
    ...source,
    effects: source.effects.map((effect) =>
      effect.kind === 'use-hand' ? { ...effect, addAp: 2_147_483_648 } : effect,
    ),
  };
  const deck = initial.deck.map((item) => (item.id === source.id ? updated : item));
  const state = withHand({ ...initial, deck, cardPool: deck, energy: 100 }, [source.id]);
  expect(cardCost(state, updated)).toBe(1);
});

it('一斉使用中の子カードはActionType42の合算コストではなく通常の個別コストを記録する', () => {
  const initial = game('library');
  const source = card(initial, 'library-ensemble');
  const child = {
    ...card(initial, 'library-pages'),
    effects: [{ kind: 'use-hand' as const, addAp: 7 }],
  };
  const state = withHand(
    {
      ...initial,
      deck: initial.deck.map((item) => (item.id === child.id ? child : item)),
      cardPool: initial.deck.map((item) => (item.id === child.id ? child : item)),
    },
    [source.id, child.id],
  );
  expect(cardCost(state, child)).toBeGreaterThan(child.cost);
  expect(cardCost(state, child, true)).toBe(child.cost);
  const used = act({ ...state, energy: 100 }, { type: 'card', index: 0 });
  expect(used.cardUses.find((item) => item.card.id === child.id)?.cost).toBe(child.cost);
});

it('招待状自身を使用すると、生成した帆船を優先検索して補充する', () => {
  const initial = game('library');
  const state = withHand({ ...initial, energy: 10 }, ['library-invitation']);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(1);
  expect(
    used.hand.slice(0, 2).map((id) => used.deck.find((card) => card.id === id)?.token),
  ).toEqual(['ensemble', 'ensemble']);
});

it('生成帆船自身を使用した後に折り紙を2回検索し、他カードの使用では検索しない', () => {
  let state = addTokens(addTokens(game('library'), 'ensemble', 1), 'story', 2);
  const source = token(state, 'ensemble');
  state = withHand({ ...state, energy: 1 }, [source.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(
    used.hand.slice(0, 2).map((id) => used.deck.find((card) => card.id === id)?.token),
  ).toEqual(['story', 'story']);
});

it('招待状の追加901も実行し、鍵の消費減少を2回適用する', () => {
  let state = addTokens(addTokens(game('library'), 'story', 1), 'bookmark', 1);
  state = { ...state, costReductions: {} };
  const reduced = applyDrawAbility(state, card(state, 'library-invitation'));
  expect(cardCost(reduced, token(state, 'story'))).toBe(3);
  expect(cardCost(reduced, token(state, 'bookmark'))).toBe(1);
});
