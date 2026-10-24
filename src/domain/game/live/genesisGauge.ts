export function calculateLoveGatherInitialGenesisGauge(input: {
  currentAp: number;
  currentMental: number;
  currentVoltageLevel: number;
}): number {
  if (
    !Number.isSafeInteger(input.currentAp) ||
    input.currentAp < 0 ||
    !Number.isSafeInteger(input.currentMental) ||
    input.currentMental < 0 ||
    !Number.isSafeInteger(input.currentVoltageLevel) ||
    input.currentVoltageLevel < 0
  ) {
    throw new Error('LoveGather initial Genesis gauge input is invalid');
  }
  return Math.trunc(
    Math.fround(
      Math.fround(input.currentMental * 0.25) +
        Math.fround((input.currentVoltageLevel + input.currentAp) * 5),
    ),
  );
}

export function calculateLoveGatherGenesisGaugeDelta(input: {
  actionType: number;
  gaugeType: 0 | 1 | 2 | 3;
  effectValue: number;
  currentGenesisEffectValue: number;
}): number | null {
  if (
    !Number.isSafeInteger(input.actionType) ||
    !Number.isFinite(input.effectValue) ||
    !Number.isFinite(input.currentGenesisEffectValue)
  ) {
    throw new Error('LoveGather Genesis gauge input is invalid');
  }
  if (input.effectValue === 0) return null;
  const sign = input.effectValue < 0 ? -1 : 1;
  const magnitude = Math.abs(Math.fround(input.effectValue));
  if (input.actionType === 39) {
    return Math.trunc(input.effectValue) * sign;
  }
  const scale = genesisGaugeScale(input.gaugeType);
  if (scale === null) return 0;
  const delta = Math.fround(
    Math.fround(magnitude / Math.sqrt(Math.fround(magnitude * scale))) *
      Math.fround(input.currentGenesisEffectValue),
  );
  return Math.trunc(delta) * sign;
}

function genesisGaugeScale(gaugeType: 0 | 1 | 2 | 3): number | null {
  switch (gaugeType) {
    case 0:
      return null;
    case 1:
      return 1;
    case 2:
      return 0.25;
    case 3:
      return 0.02;
  }
}
