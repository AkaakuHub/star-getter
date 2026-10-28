import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { game, withHand } from './support/game';

for (const enabled of [false, true]) {
  it(`自動回収${enabled ? 'ON' : 'OFF'}でも通常カードの発動間隔を省略できない`, () => {
    const initial = game('library');
    const state = withHand(
      { ...initial, currentAp: 20, automaticHeart: { enabled, timerSeconds: 0 } },
      ['class', 'library-invitation'],
    );
    const first = act(state, { type: 'card', index: 0 });
    expect(first.stats.cardsUsed).toBe(1);
    expect(act(first, { type: 'card', index: 0 })).toBe(first);
    const tooSoon = advanceTo(first, 21 / 60);
    expect(act(tooSoon, { type: 'card', index: 0 })).toBe(tooSoon);
    const ready = advanceTo(first, 22 / 60);
    expect(act(ready, { type: 'card', index: 0 }).stats.cardsUsed).toBeGreaterThan(
      first.stats.cardsUsed,
    );
  });
}

it('開花の共鳴後も30tickに達するまで次の通常カードを発動できない', () => {
  const initial = game('genesis');
  const started = advanceTo(
    act({ ...initial, currentAp: 20 }, { type: 'special', cardId: 'horizon' }),
    1,
  );
  const first = act(withHand(started, ['class', 'rain-preparation']), { type: 'card', index: 0 });
  expect(first.stats.cardsUsed).toBe(1);
  const tooSoon = advanceTo(first, 1 + 29 / 60);
  expect(act(tooSoon, { type: 'card', index: 0 })).toBe(tooSoon);
  const ready = advanceTo(first, 1 + 30 / 60);
  expect(act(ready, { type: 'card', index: 0 }).stats.cardsUsed).toBeGreaterThan(
    first.stats.cardsUsed,
  );
});
