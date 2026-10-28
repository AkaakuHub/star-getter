export const tokenNames = {
  ensemble: 'ヨット',
  story: '貝がら',
  clock: '舵',
  bookmark: '浮き輪',
  shadow: 'パズル',
  pennant: '信号旗',
};

export function tokenName(id: string): string {
  const entry = Object.entries(tokenNames).find(([key]) => key === id);
  if (!entry) throw new Error('追加カードの表示名がありません。');
  return entry[1];
}
