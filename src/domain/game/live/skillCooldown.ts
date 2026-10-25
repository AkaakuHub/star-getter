export function calculateStarGatherBaseSkillCooldownSeconds(playTimeMilliseconds: number): number {
  if (!Number.isSafeInteger(playTimeMilliseconds) || playTimeMilliseconds < 0) {
    throw new Error('Musics.PlayTime is invalid');
  }
  return Math.fround(
    Math.fround(Math.fround(playTimeMilliseconds) * Math.fround(1 / 256)) / Math.fround(1_000),
  );
}
