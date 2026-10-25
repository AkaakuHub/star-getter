import { expect, it } from 'vite-plus/test';
import { resultShareData } from '../../src/presentation/results/shareScore';
import { initialRoute } from '../../src/app/initialRoute';
import { rules } from '../../src/domain/game/model';

it('画像共有の本文に正確なスコア・ハッシュタグを含め、現在URLを保持する', () => {
  const current = 'https://example.com/play?route=bloom#live';
  const data = resultShareData(rules.maxScore, '開花', current);
  expect(data.title).toBe('スターギャザー');
  expect(data.text).toBe(
    `スターギャザー「開花」で${rules.maxScore.toLocaleString('ja-JP')}スター\n#スターギャザー`,
  );
  expect(data.url).toBe(current);
  expect(initialRoute(current)).toBe('bloom');
  expect(initialRoute('https://example.com/')).toBe('library');
});

it('小さなスコアも省略せず、3桁の区切りで共有する', () => {
  expect(resultShareData(1_234_567n, '書架', 'https://example.com/').text).toBe(
    'スターギャザー「書架」で1,234,567スター\n#スターギャザー',
  );
});
