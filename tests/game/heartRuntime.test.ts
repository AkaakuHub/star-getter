import { describe, expect, it } from 'vite-plus/test';
import {
  createStarGatherHeartRuntimeState,
  spawnStarGatherBeatHearts,
} from '../../src/domain/game/live/heartSpawn';
import {
  advanceStarGatherHeartRuntime,
  collectStarGatherHeartRuntime,
} from '../../src/domain/game/live/heartRuntime';
import { starGatherHeartCount } from '../../src/domain/game/live/heartState';
import { projectStarGatherHeartPresentations } from '../../src/domain/game/live/heartPresentation';
import { createRangeRandom } from '../../src/domain/game/random';

describe('きらめきの生成と移動', () => {
  it('本家の生成範囲・飛び出す距離・時間を乱数で決める', () => {
    const random = createRangeRandom(7);
    const spawned = spawnStarGatherBeatHearts(
      createStarGatherHeartRuntimeState(30),
      100,
      random.range,
    );
    expect(spawned.state.baseLifeTimeSeconds).toBe(2.5);
    expect(spawned.state.stageHearts).toHaveLength(50);
    expect(starGatherHeartCount(spawned.state)).toBe(100);
    const positions = new Set(spawned.state.stageHearts.map((heart) => heart.waitPosition.x));
    expect(positions.size).toBe(50);
    for (const heart of spawned.state.stageHearts) {
      expect(heart.waitPosition.x).toBeGreaterThanOrEqual(-5.5);
      expect(heart.waitPosition.x).toBeLessThanOrEqual(5.5);
      expect(heart.waitPosition.y).toBeGreaterThanOrEqual(-1.5);
      expect(heart.waitPosition.y).toBeLessThanOrEqual(0.5);
      expect(heart.waitPosition.y - heart.spawnStartPosition.y).toBeCloseTo(1, 0);
      expect(heart.spawnDurationSeconds).toBeGreaterThanOrEqual(0.45);
      expect(heart.spawnDurationSeconds).toBeLessThanOrEqual(0.55);
    }
  });

  it('IDに依存せず、異なる乱数seedでは異なる位置となる', () => {
    const first = createRangeRandom(7);
    const second = createRangeRandom(8);
    const base = createStarGatherHeartRuntimeState(30);
    expect(spawnStarGatherBeatHearts(base, 10, first.range).state).not.toEqual(
      spawnStarGatherBeatHearts(base, 10, second.range).state,
    );
  });

  it('出現時は透明で下から飛び出し、回収後は個数から除いて移動を続ける', () => {
    const random = createRangeRandom(7);
    const spawned = spawnStarGatherBeatHearts(
      createStarGatherHeartRuntimeState(30),
      10,
      random.range,
    );
    const initial = projectStarGatherHeartPresentations(spawned.state.stageHearts, 0);
    expect(initial[0]?.alpha).toBe(0);
    const advanced = advanceStarGatherHeartRuntime(spawned.state, 0.5, false);
    const visible = projectStarGatherHeartPresentations(advanced.state.stageHearts, 0);
    expect(visible[0]?.position.y).toBeGreaterThan(initial[0]?.position.y ?? 0);
    const collected = collectStarGatherHeartRuntime(advanced.state, random.range);
    expect(starGatherHeartCount(collected.state)).toBe(0);
    expect(collected.state.stageHearts.length).toBeGreaterThan(0);
    expect(
      advanceStarGatherHeartRuntime(collected.state, 1.2, false).state.stageHearts,
    ).toHaveLength(0);
  });
});
