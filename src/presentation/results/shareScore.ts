export function resultShareData(score: bigint, routeName: string, currentUrl: string) {
  return {
    title: 'star-getter',
    text: `star-getter「${routeName}」で${score.toLocaleString('ja-JP')}スター\n#StarGetter`,
    url: currentUrl,
  };
}
