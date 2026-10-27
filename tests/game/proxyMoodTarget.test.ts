import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceProxySkillPeriods } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType48の負の目標値は非絶対加算時に下方向で到達判定する', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const initial = act(createGame(track, routes.bloom.deck, 7), { type: 'start' });
  const source = initial.deck[0];
  if (!source) throw new Error('Proxy発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 100n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0,
      targets: [{ actionType: 48, targetAmount: -3 }],
      effects: [{ actionType: 14, effect: { kind: 'energy', amount: 2 } }],
    },
    source,
  );
  const activeEnergy = active.energy;
  const absorbed = applyEffect(active, {
    kind: 'mood-change-skill',
    calculationType: 1,
    num: -50_000n,
    duration: { kind: 'stage', value: 0n },
  });
  expect(absorbed.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(-5n);
  expect(advanceProxySkillPeriods(absorbed, 0.2, applyEffect).energy).toBeGreaterThan(activeEnergy);
});
