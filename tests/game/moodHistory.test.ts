import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { recordMoodHistory } from '@akaakuhub/suku-sute-core/game/moodHistory';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.library.deck, 7, 100, routes.library.tokens), {
    type: 'start',
  });
}

it('空模様は同じミリ秒でも変更前後を追加して階段を残す', () => {
  const first = [{ timeMilliseconds: 0, moodValue: 0 }];
  const second = recordMoodHistory(first, { timeMilliseconds: 100, moodValue: -100 });
  const third = recordMoodHistory(second, { timeMilliseconds: 100, moodValue: 100 });
  expect(third).toEqual([
    { timeMilliseconds: 0, moodValue: 0 },
    { timeMilliseconds: 100, moodValue: 0 },
    { timeMilliseconds: 100, moodValue: -100 },
    { timeMilliseconds: 100, moodValue: -100 },
    { timeMilliseconds: 100, moodValue: 100 },
  ]);
});

it('空模様を初期値から記録し、効果実行ではなく進行フレームで変化を記録する', () => {
  const initial = game();
  expect(initial.moodHistory).toEqual([{ timeMilliseconds: 0, moodValue: 0 }]);
  const changed = applyEffect(initial, { kind: 'mood', amount: 20 });
  expect(changed.moodHistory).toBe(initial.moodHistory);
  const observed = advanceTo(changed, 1 / 60);
  expect(observed.moodHistory.at(-1)).toEqual({ timeMilliseconds: 16, moodValue: 20 });
  expect(advanceTo(observed, 0.5).moodHistory).toEqual(observed.moodHistory);
});

it('同じ進行フレームの間に元へ戻った値は記録しない', () => {
  const initial = game();
  const changed = applyEffect(applyEffect(initial, { kind: 'mood', amount: 20 }), {
    kind: 'mood',
    amount: -20,
  });
  expect(advanceTo(changed, 1 / 60).moodHistory).toEqual(initial.moodHistory);
});
