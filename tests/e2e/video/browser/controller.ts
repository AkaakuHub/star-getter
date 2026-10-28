import { GameController } from '../../../../src/app/gameController';
import { createConfiguredGame } from '../../../../src/app/createConfiguredGame';
import type { GamePreferences } from '../../../../src/app/gamePreferences';
import type { GameSetup } from '../../../../src/app/setup/gameSetup';
import { ScenarioAudio, ScenarioClock, ScenarioFrames } from '../../playback';
import { createAnimationClock } from './animations';
import type { ReplaySession } from '../types';

export function createGameController(
  setup: GameSetup,
  heartShowLimit: number,
  preferences: GamePreferences,
): GameController {
  const config = window.e2eVideoConfig;
  if (setup.presetId !== config.route) throw new Error('録画対象のプリセットが一致しません。');
  const clock = new ScenarioClock();
  const frames = new ScenarioFrames();
  const controller = new GameController(
    createConfiguredGame(setup, config.seed, heartShowLimit),
    clock,
    frames,
    new ScenarioAudio(),
    preferences.waitMode,
  );
  let wallTick = 0;
  let resumeFrameDeferred = false;
  const paint = createAnimationClock(
    () => (controller.state.tick * 1000) / 60,
    () => (wallTick * 1000) / 60,
  );
  const session: ReplaySession = {
    async advanceTo(target) {
      if (target < wallTick) throw new Error('操作時刻を巻き戻すことはできません。');
      while (wallTick < target) {
        await Promise.resolve();
        wallTick++;
        if (!clock.paused) {
          clock.seconds = (controller.state.tick + 1) / 60;
          if (!resumeFrameDeferred) frames.run((wallTick * 1000) / 60);
        }
        resumeFrameDeferred = false;
      }
    },
    deferResumeFrame() {
      resumeFrameDeferred = true;
    },
    paint,
    snapshot() {
      const state = controller.state;
      return {
        wallTick,
        tick: state.tick,
        score: state.score.toString(),
        gauge: state.genesis.effects.length > 0 ? state.genesis.currentGauge.toString() : null,
        deckSize: state.deck.length,
        currentAp: state.currentAp,
        heartLimit: state.hearts.heartLimit,
        storyAmplification: state.storyAmplification,
        lastActionTick: state.lastActionTick,
        phase: state.phase,
        hand: state.hand,
        error: controller.error,
      };
    },
  };
  window.e2eVideoSession = session;
  return controller;
}
