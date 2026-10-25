import type { TokenKind } from '../../domain/game/model';

export const tokenNames: Readonly<Record<TokenKind, string>> = {
  ensemble: 'ヨット',
  story: '貝がら',
  clock: '舵',
  bookmark: '浮き輪',
  shadow: 'パズル',
};
