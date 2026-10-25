import { expect, it } from 'vite-plus/test';
import { recordScoreHistory } from '../../src/domain/game/scoreHistory';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { addHearts } from '../../src/domain/game/hearts';
import { advanceTo, createGame } from '../../src/domain/game/simulation';

it('加点があった時刻に直前の累積値と新しい累積値を並べて階段を作る', () => {
  const first = recordScoreHistory([], { timeMilliseconds: 100, totalScore: 10n });
  const second = recordScoreHistory(first, { timeMilliseconds: 1500, totalScore: 50n });
  expect(second).toEqual([
    { timeMilliseconds: 100, totalScore: 10n },
    { timeMilliseconds: 1500, totalScore: 10n },
    { timeMilliseconds: 1500, totalScore: 50n },
  ]);
});

it('同じミリ秒の加点は最後の累積値を更新し、連打による加点を保持する', () => {
  const first = recordScoreHistory([], { timeMilliseconds: 100, totalScore: 10n });
  const second = recordScoreHistory(first, { timeMilliseconds: 1500, totalScore: 50n });
  const third = recordScoreHistory(second, { timeMilliseconds: 1500, totalScore: 80n });
  expect(third).toEqual([
    { timeMilliseconds: 100, totalScore: 10n },
    { timeMilliseconds: 1500, totalScore: 10n },
    { timeMilliseconds: 1500, totalScore: 80n },
  ]);
});

it('回収時の加点を表示遅延を待たずにそのゲーム時刻で記録する', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const initial = act(createGame(track, routes.library.deck, 7, 100, routes.library.tokens), {
    type: 'start',
  });
  const collected = act(addHearts({ ...initial, tick: 90 }, 10), { type: 'collect' });
  expect(collected.score).toBeGreaterThan(0n);
  expect(collected.scoreHistory.at(-1)).toEqual({
    timeMilliseconds: 1500,
    totalScore: collected.score,
  });
});

it('ゼロ点でも開始と曲末の記録が残る', () => {
  const original = tracks[0];
  if (!original) throw new Error('楽曲がありません。');
  const section = original.sections[0];
  if (!section) throw new Error('パートがありません。');
  const track = { ...original, bpm: 120, beats: 1, sections: [section] };
  const state = act(createGame(track, routes.library.deck, 7, 100, routes.library.tokens), {
    type: 'start',
  });
  const finished = advanceTo(state, 0.5);
  expect(finished.score).toBe(0n);
  expect(finished.scoreHistory).toEqual([
    { timeMilliseconds: 0, totalScore: 0n },
    { timeMilliseconds: 500, totalScore: 0n },
    { timeMilliseconds: 500, totalScore: 0n },
  ]);
});
