import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { expect, it } from 'vite-plus/test';
import { tracks } from '../../src/content/tracks';
import { defaultDeckCardDatasIds, resolveDeck } from '../../src/content/cards';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { addHearts, heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game(count: number) {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const state = act(createGame(track, resolveDeck(defaultDeckCardDatasIds), 7), { type: 'start' });
  return addHearts(
    {
      ...state,
      hearts: { ...state.hearts, stageHearts: [], hiddenHeartBatches: [] },
      relayUsed: [...liveCurrentHandCardInstanceIds(state)],
    },
    count,
  );
}

it('100個が0.3秒続いた時点で自動回収し、99個では回収しない', () => {
  const full = game(100);
  expect(advanceTo(full, 0.29).stats.heartsCollected).toBe(0);
  const collected = advanceTo(full, 0.3);
  expect(collected.stats.heartsCollected).toBe(100);
  expect(heartCount(collected)).toBe(0);
  expect(advanceTo(game(99), 0.5).stats.heartsCollected).toBe(0);
});

it('オフの間は100個でも回収せず、手動回収は使用できる', () => {
  const state = { ...game(100), automaticHeart: { enabled: false, timerSeconds: 0 } };
  const advanced = advanceTo(state, 0.5);
  expect(heartCount(advanced)).toBe(100);
  expect(advanced.stats.heartsCollected).toBe(0);
  expect(act(advanced, { type: 'collect' }).stats.heartsCollected).toBe(100);
});

it('一時停止した実時間を自動回収の待ち時間へ加えない', () => {
  const state = advanceTo(game(100), 0.2);
  const paused = act(state, { type: 'pause' });
  expect(advanceTo(paused, 10)).toBe(paused);
  const resumed = act(paused, { type: 'resume' });
  expect(advanceTo(resumed, 0.29).stats.heartsCollected).toBe(0);
  expect(advanceTo(resumed, 0.3).stats.heartsCollected).toBe(100);
});

it('描画間隔にかかわらず自動回収の結果が一致する', () => {
  const state = game(100);
  let frequent = state;
  for (let frame = 1; frame <= 30; frame++) frequent = advanceTo(frequent, frame / 60);
  expect(frequent).toEqual(advanceTo(state, 0.5));
});
