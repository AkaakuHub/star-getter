import { describe, expect, it } from 'vite-plus/test';
import { cardsInPack, defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { packs } from '../../src/content/packs';
import { flattenPacks, type CardPack } from '../../src/domain/catalog/packs';

describe('カードパックの追加', () => {
  it('新しいパックを追加しても既存のカードIDと編成を維持する', () => {
    const previous = resolveDeck(defaultDeckIds);
    const card = previous[0];
    if (!card) throw new Error('テストカードがありません。');
    const expansion: CardPack = {
      id: 'expansion',
      name: '追加パック',
      releasedOn: '2026-11-01',
      cards: [{ ...card, id: 'expansion-spark' }],
    };
    const expanded = flattenPacks([...packs, expansion]);
    for (const oldCard of previous)
      expect(expanded.find((item) => item.id === oldCard.id)).toBe(oldCard);
    expect(expanded.at(-1)?.id).toBe('expansion-spark');
    expect(resolveDeck(defaultDeckIds)).toEqual(previous);
  });

  it('重複IDや不正な効果量があるパックを拒否する', () => {
    const first = packs[0];
    if (!first) throw new Error('テストパックがありません。');
    expect(() => flattenPacks([...packs, first])).toThrow();
    expect(() => flattenPacks([...packs, { ...first, id: 'different-pack' }])).toThrow();
    const card = first.cards[0];
    if (!card) throw new Error('テストカードがありません。');
    expect(() =>
      flattenPacks([{ ...first, cards: [{ ...card, effects: [{ kind: 'hearts', amount: -1 }] }] }]),
    ).toThrow();
  });

  it('指定した公開パックのカードだけを選択できる', () => {
    const first = packs[0];
    if (!first) throw new Error('テストパックがありません。');
    expect(cardsInPack(first.id)).toEqual(first.cards);
    expect(cardsInPack('')).toHaveLength(flattenPacks(packs).length);
    expect(() => cardsInPack('missing-pack')).toThrow();
  });
});
