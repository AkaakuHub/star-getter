import { expect, it } from 'vite-plus/test';
import { shareScoreUrl } from '../../src/presentation/results/shareScore';
import { initialRoute } from '../../src/app/initialRoute';
import { rules } from '../../src/domain/game/model';

it('X共有にスコア・ハッシュタグ・現在URLを含め、プリセットとハッシュも保持する', () => {
  const current = 'https://example.com/play?route=bloom#live';
  const url = new URL(shareScoreUrl(rules.maxScore, '開花', current));
  expect(url.origin + url.pathname).toBe('https://twitter.com/intent/tweet');
  expect(url.searchParams.get('text')).toContain('9999無量大数');
  expect(url.searchParams.get('hashtags')).toBe('ラブギャザー');
  expect(url.searchParams.get('url')).toBe(current);
  expect(initialRoute(current)).toBe('bloom');
  expect(initialRoute('https://example.com/')).toBe('library');
});
