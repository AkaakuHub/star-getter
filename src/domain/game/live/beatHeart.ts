type StarGatherBeatHeartCard = Readonly<{
  beatPoint: number;
  goodMood: 1 | 2 | 3;
}>;

type StarGatherBeatHeartBuffPorts = Readonly<{
  applyBeatPointBuff: (value: number) => number;
  applyBeatHeartBuff: ((value: number) => number) | null;
}>;

type StarGatherBeatHeartCalculation = Readonly<{
  value: number;
  createCount: number;
}>;

export function calculateStarGatherBeatHeart(
  input: Readonly<{
    cards: readonly StarGatherBeatHeartCard[];
    musicBeatPoint: number;
    moodValue: number;
    heartAppearRatio: number;
  }>,
  ports: StarGatherBeatHeartBuffPorts,
): StarGatherBeatHeartCalculation {
  validateInput(input);
  let cardValueSum = 0;
  for (const card of input.cards) {
    const moodFactor = calculateStarGatherMoodFactor(input.moodValue, card.goodMood);
    const moodBeatPoint = Math.fround(
      Math.fround(Math.fround(moodFactor) * Math.fround(card.beatPoint)) *
        Math.fround(input.musicBeatPoint),
    );
    const cardValue = Math.trunc(Math.fround(moodBeatPoint * 0.01));
    cardValueSum = Math.fround(cardValueSum + cardValue);
  }

  const averageCardValue = Math.fround(cardValueSum / input.cards.length);
  const beatPointBuffedValue = checkedPortValue(
    ports.applyBeatPointBuff(averageCardValue),
    'beat point buff',
  );
  const ratioValue = Math.trunc(
    Math.fround(Math.fround(beatPointBuffedValue) * Math.fround(input.heartAppearRatio)),
  );
  const value =
    ports.applyBeatHeartBuff === null
      ? ratioValue
      : checkedPortValue(ports.applyBeatHeartBuff(ratioValue), 'Beat Heart buff');
  return { value, createCount: Math.trunc(Math.fround(value)) };
}

function validateInput(
  input: Readonly<{
    cards: readonly StarGatherBeatHeartCard[];
    musicBeatPoint: number;
    moodValue: number;
    heartAppearRatio: number;
  }>,
): void {
  if (input.cards.length === 0) {
    throw new Error('StarGather Beat Heart cards are absent');
  }
  if (
    !Number.isFinite(input.musicBeatPoint) ||
    !Number.isSafeInteger(input.moodValue) ||
    !Number.isFinite(input.heartAppearRatio)
  ) {
    throw new Error('StarGather Beat Heart music value is invalid');
  }
  for (const card of input.cards) {
    if (
      !Number.isFinite(card.beatPoint) ||
      (card.goodMood !== 1 && card.goodMood !== 2 && card.goodMood !== 3)
    ) {
      throw new Error('StarGather Beat Heart card value is invalid');
    }
  }
}

function calculateStarGatherMoodFactor(moodValue: number, goodMood: 1 | 2 | 3): number {
  if (!Number.isSafeInteger(moodValue)) {
    throw new Error('StarGather mood value is invalid');
  }
  if (moodValue === 0) return 1;
  if (moodValue > 0) {
    if (goodMood === 3) return 1;
    const value = Math.fround(moodValue / 100);
    return Math.fround(1 + (goodMood === 2 ? value / 2 : value));
  }
  if (goodMood === 1) return 1;
  const value = Math.fround(moodValue / -100);
  return Math.fround(1 + (goodMood === 2 ? value / 2 : value));
}

function checkedPortValue(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`StarGather ${label} result is invalid`);
  }
  return value;
}
