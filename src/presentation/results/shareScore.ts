import { formatScore } from '../cardDescription';

export function shareScoreUrl(score: bigint, routeName: string, currentUrl: string): string {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', `ラブギャザー「${routeName}」で${formatScore(score)}LOVE`);
  url.searchParams.set('hashtags', 'ラブギャザー');
  url.searchParams.set('url', currentUrl);
  return url.href;
}
