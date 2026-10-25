import { formatScore } from '../cardDescription';

export function shareScoreUrl(score: bigint, routeName: string, currentUrl: string): string {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', `スターギャザー「${routeName}」で${formatScore(score)}スター`);
  url.searchParams.set('hashtags', 'スターギャザー');
  url.searchParams.set('url', currentUrl);
  return url.href;
}
