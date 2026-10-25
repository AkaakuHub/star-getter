type MaximumChange = Readonly<{
  calculation: 'fixed' | 'multiply' | 'add';
  value: number;
}>;

export function changeMaximum(origin: number, changes: readonly MaximumChange[]): number {
  return changes.reduce((value, change) => {
    switch (change.calculation) {
      case 'fixed':
        return change.value;
      case 'add':
        return change.value + value;
      case 'multiply':
        return Math.trunc(
          Math.fround(Math.fround(Math.fround(change.value / 10000) + 1) * Math.fround(value)),
        );
    }
  }, origin);
}

export function energyMaximum(origin: number, changes: readonly MaximumChange[]): number {
  return Math.min(100, changeMaximum(origin, changes));
}

export function staminaMaximum(
  origin: number,
  changes: readonly MaximumChange[],
  baseMultiple = 1,
): number {
  const maximum = changeMaximum(origin, changes);
  if (maximum < 1) return 1;
  const limit = baseMultiple === 0 ? 0 : Math.trunc((origin * 10) / baseMultiple);
  return Math.min(maximum, limit);
}
