import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceProxySkillPeriods } from '../../src/domain/game/effects/proxySkill';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType46は期限切れで目標未達のProxyカードを墓地へ戻す', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const initial = act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 20, targetAmount: 1 }],
      effects: [],
    },
    source,
  );
  const inProxy = {
    ...active,
    hand: active.hand.filter((id) => id !== source.id),
    drawPile: active.drawPile.filter((id) => id !== source.id),
    discard: active.discard.filter((id) => id !== source.id),
    proxyCards: [...active.proxyCards, source.id],
  };
  const expired = advanceProxySkillPeriods(inProxy, 0.2, applyEffect);
  expect(expired.proxyAbsorptions).toHaveLength(0);
  expect(expired.proxyCards).not.toContain(source.id);
  expect(expired.discard).toContain(source.id);
});
