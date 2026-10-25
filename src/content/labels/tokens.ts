import type { TokenKind } from '../../domain/game/model';

export const tokenNames: Readonly<Record<TokenKind, string>> = {
  ensemble: '帆船',
  story: '折り紙',
  clock: '風車',
  bookmark: '鍵',
  shadow: 'パズル',
};
