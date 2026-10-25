import { routeIds, routes, type RouteId } from '../content/routes';

export function initialRoute(currentUrl: string): RouteId {
  const slug = new URL(currentUrl).searchParams.get('route');
  if (slug === null) return 'library';
  const route = routeIds.find((id) => routes[id].slug === slug);
  if (!route) throw new Error('プリセットの指定が正しくありません。');
  return route;
}

export function routeUrl(route: RouteId, currentUrl: string): URL {
  const url = new URL(currentUrl);
  url.searchParams.set('route', routes[route].slug);
  return url;
}
