export function resultShareData(score: bigint, routeName: string, currentUrl: string) {
  return {
    title: 'スターギャザー',
    text: `スターギャザー「${routeName}」で${score.toLocaleString('ja-JP')}スター\n#スターギャザー`,
    url: currentUrl,
  };
}
