import type { TokenKind } from './model';

export type TokenTemplateReference =
  | Readonly<{ kind: 'token-kind'; token: TokenKind }>
  | Readonly<{ kind: 'template'; templateId: string }>;

export type TokenRequest = Readonly<{
  template: TokenTemplateReference;
  count: number;
  seriesIds?: readonly number[];
  actionType28?: true;
}>;

export type TokenCardEffect = Readonly<{
  kind: 'token-card';
  templateId: string;
  count: number;
  seriesIds?: readonly number[];
}>;

export function validateTokenCardEffect(effect: TokenCardEffect): undefined {
  if (
    !effect.templateId ||
    !Number.isSafeInteger(effect.count) ||
    effect.seriesIds?.some((id) => !Number.isSafeInteger(id))
  )
    throw new Error('追加カードデータの設定が正しくありません。');
  return undefined;
}
