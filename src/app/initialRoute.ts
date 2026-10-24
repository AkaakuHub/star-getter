import type { RouteId } from '../content/routes';

export function initialRoute(currentUrl: string): RouteId {
  const route = new URL(currentUrl).searchParams.get('route');
  if (route === null) return 'library';
  if (route === 'library' || route === 'bloom') return route;
  throw new Error('プリセットの指定が正しくありません。');
}
