export function resultShareData(score: bigint, routeName: string, currentUrl: string) {
  return {
    title: 'ラブゲッター',
    text: `ラブゲッター「${routeName}」で${score.toLocaleString('ja-JP')}スター\n#ラブゲッター`,
    url: currentUrl,
  };
}
