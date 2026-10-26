import type { TokenKind } from './model';

export type TokenTemplateReference =
  | Readonly<{ kind: 'token-kind'; token: TokenKind }>
  | Readonly<{ kind: 'template'; templateId: string }>;

export type TokenRequest = Readonly<{
  template: TokenTemplateReference;
  count: number;
  seriesIds?: readonly bigint[];
}>;

export type TokenCardEffect = Readonly<{
  kind: 'token-card';
  templateId: string;
  count: bigint;
  seriesIds?: readonly bigint[];
  parameterDetails?: Readonly<Record<string, { id: bigint; value: bigint; unitsPerValue: number }>>;
}>;

export function validateTokenCardEffect(effect: TokenCardEffect): undefined {
  if (
    !effect.templateId ||
    effect.count < -(1n << 63n) ||
    effect.count >= 1n << 63n ||
    effect.seriesIds?.some((id) => id < -(1n << 63n) || id >= 1n << 63n) ||
    Object.values(effect.parameterDetails ?? {}).some(
      (detail) =>
        detail.id < -(1n << 63n) ||
        detail.id >= 1n << 63n ||
        detail.value < -(1n << 63n) ||
        detail.value >= 1n << 63n ||
        detail.unitsPerValue !== 1,
    )
  )
    throw new Error('追加カードデータの設定が正しくありません。');
  return undefined;
}
