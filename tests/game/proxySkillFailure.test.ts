import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceProxySkillPeriods } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType46は期限切れで目標未達のProxyカードを墓地へ戻す', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const initial = act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    applyEffect(
      initial,
      {
        kind: 'card-move-induce',
        sourceEffectId: 'proxy-card-graveyard',
        targetEffectId: 704n,
        timing: 'stage-to-graveyard',
        limit: 1n,
        requireCount: 1n,
        effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 704n }],
      },
      source,
    ),
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100n,
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
    skillUseDestinations: Object.fromEntries(
      Object.entries(active.skillUseDestinations).filter(([id]) => id !== source.id),
    ),
  };
  const expired = advanceProxySkillPeriods(inProxy, 0.2, applyEffect);
  expect(expired.proxyAbsorptions).toHaveLength(0);
  expect(expired.proxyCards).not.toContain(source.id);
  expect(expired.discard).toContain(source.id);
  expect(expired.boosts).toHaveLength(inProxy.boosts.length + 1);
  expect(expired.cardMoveInducers[0]?.useCount).toBe(1);
});

it('ActionType908は墓地行き時に参照実装のint32 LimitNumで上限を判定する', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const initial = act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const withInducer = applyEffect(
    initial,
    {
      kind: 'card-move-induce',
      sourceEffectId: 'proxy-card-limit-wrap',
      targetEffectId: 705n,
      timing: 'stage-to-graveyard',
      limit: 2_147_483_648n,
      requireCount: 0n,
      effects: [{ kind: 'boost', multiplier: 1.2, skillEffectId: 705n }],
    },
    source,
  );
  const active = applyEffect(
    withInducer,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100n,
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
    skillUseDestinations: Object.fromEntries(
      Object.entries(active.skillUseDestinations).filter(([id]) => id !== source.id),
    ),
  };

  const expired = advanceProxySkillPeriods(inProxy, 0.2, applyEffect);

  expect(expired.boosts).toHaveLength(inProxy.boosts.length);
  expect(expired.cardMoveInducers[0]?.useCount).toBe(1);
});
