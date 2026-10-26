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
}>;

export function validateTokenCardEffect(effect: TokenCardEffect): undefined {
  if (
    !effect.templateId ||
    effect.count < -(1n << 63n) ||
    effect.count >= 1n << 63n ||
    effect.seriesIds?.some((id) => id < -(1n << 63n) || id >= 1n << 63n)
  )
    throw new Error('追加カードデータの設定が正しくありません。');
  return undefined;
}
