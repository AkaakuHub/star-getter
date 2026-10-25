export type TimeRange = Readonly<{ minimum: number; maximum: number }>;
export type InputTiming = Readonly<{
  decisionSeconds: TimeRange;
  confirmationSeconds: TimeRange;
  specialMenuSeconds: TimeRange;
  pointerIntervalSeconds: TimeRange;
  collectionIntervalFactor: TimeRange;
}>;

export const inputTiming: InputTiming = {
  decisionSeconds: { minimum: 0.45, maximum: 1 },
  confirmationSeconds: { minimum: 0.15, maximum: 0.35 },
  specialMenuSeconds: { minimum: 0.65, maximum: 1.4 },
  pointerIntervalSeconds: { minimum: 0.04, maximum: 0.08 },
  collectionIntervalFactor: { minimum: 0.8, maximum: 1.2 },
};
