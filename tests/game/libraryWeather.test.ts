import { expect, it } from 'vite-plus/test';
import { beatHeartCount } from '@akaakuhub/suku-sute-core/game/beat';
import { applyDrawAbility } from '@akaakuhub/suku-sute-core/game/cards/drawAbilities';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { skillValue } from '@akaakuhub/suku-sute-core/game/effects';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game, withHand } from './support/game';

function library(mood: number) {
  let state = addTokens(addTokens(game('library'), 'clock', 1), 'bookmark', 1);
  state = addTokens(state, 'story', 80 - state.deck.length);
  return withHand(
    { ...state, moodOffset: mood, hearts: { ...state.hearts, heartLimit: 100_000 } },
    [],
  );
}

for (const [mood, beats] of [
  [0, 160],
  [50, 200],
  [100, 240],
] as const) {
  it(`80枚で貝がらを引いたときの空模様${mood}%の生成量を適用する`, () => {
    const state = library(mood);
    const story = state.deck.find((card) => card.token === 'story');
    if (!story) throw new Error('貝がらがありません。');
    expect(heartCount(applyDrawAbility(state, story))).toBe(beats * beatHeartCount(state));
  });
}

it('舵を引く前は蓄積増幅がなく、引き直すたびに貝がら専用の増幅を加算する', () => {
  const state = library(100);
  const clock = state.deck.find((card) => card.token === 'clock');
  if (!clock) throw new Error('舵がありません。');
  expect(state.storyAmplification).toBe(0);
  const first = applyDrawAbility(state, clock);
  expect(first.storyAmplification).toBe(1501.5);
  expect(applyDrawAbility(first, clock).storyAmplification).toBe(3003);
  const before80 = { ...state, deck: state.deck.slice(0, 79) };
  expect(applyDrawAbility(before80, clock).storyAmplification).toBe(0);
});

it('80枚以上で手札にある貝がらと浮き輪の増幅は晴れ補正を含み、舵には掛からない', () => {
  const state = library(100);
  const story = state.deck.find((card) => card.token === 'story');
  const bookmark = state.deck.find((card) => card.token === 'bookmark');
  const clock = state.deck.find((card) => card.token === 'clock');
  if (!story || !bookmark || !clock) throw new Error('追加カードがありません。');
  const held = withHand(state, [story.cardInstanceId, bookmark.cardInstanceId]);
  const effect = { kind: 'heart-limit', amount: 100 } as const;
  expect(skillValue(held, 100, effect, story)).toBe(3103);
  expect(skillValue(held, 100, effect, clock)).toBe(100);
  expect(skillValue(state, 100, effect, story)).toBe(100);
});
