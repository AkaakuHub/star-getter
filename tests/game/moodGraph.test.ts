import { expect, it } from 'vite-plus/test';
import { projectMoodStepPoints } from '@akaakuhub/suku-sute-core/game/live/moodGraph';
import { tracks } from '../../src/content/tracks';
import { resolveDeck, defaultDeckIds } from '../../src/content/cards';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('空模様の変更時刻まで値を保ち、−100から100へ垂直に切り替える', () => {
  expect(
    projectMoodStepPoints(
      [
        { songTimeSeconds: 20, keyValue: -100 },
        { songTimeSeconds: 80, keyValue: 100 },
      ],
      100,
      { x: 0, y: 0, width: 100, height: 200 },
    ),
  ).toEqual([
    { x: 0, y: 200 },
    { x: 20, y: 200 },
    { x: 80, y: 200 },
    { x: 80, y: 0 },
    { x: 100, y: 0 },
  ]);
});

it('楽曲の空模様値が範囲外なら開始を拒否する', () => {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const invalid = {
    ...track,
    moodKeys: [{ songTimeSeconds: 0, keyValue: 101 }],
  };
  expect(() => createGame(invalid, resolveDeck(defaultDeckIds), 7)).toThrow(
    '空模様の設定が正しくありません。',
  );
});
