import { useEffect, useState } from 'preact/hooks';
import { routes, type RouteId } from '../../content/routes';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { createResultImage } from './createResultImage';
import { resultShareData } from './shareScore';

type ResultImage =
  | Readonly<{ kind: 'preparing' }>
  | Readonly<{ kind: 'ready'; file: File }>
  | Readonly<{ kind: 'failed' }>;

export function useResultShare(state: GameState, route: RouteId) {
  const [image, setImage] = useState<ResultImage>({ kind: 'preparing' });
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setImage({ kind: 'preparing' });
    setError('');
    void createResultImage(state, route).then(
      (file) => {
        if (active) setImage({ kind: 'ready', file });
      },
      () => {
        if (!active) return;
        setImage({ kind: 'failed' });
        setError('結果画像を作成できませんでした。');
      },
    );
    return () => {
      active = false;
    };
  }, [state, route]);

  const share = async (): Promise<void> => {
    if (image.kind !== 'ready' || sharing) return;
    if (!window.isSecureContext) {
      setError('このページでは画像共有を利用できません。HTTPSで開いてください。');
      return;
    }
    if (
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function' ||
      !navigator.canShare({ files: [image.file] })
    ) {
      setError('このブラウザーでは画像共有を利用できません。');
      return;
    }
    setSharing(true);
    setError('');
    try {
      await navigator.share({
        ...resultShareData(state.score, routes[route].name, location.href),
        files: [image.file],
      });
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === 'AbortError'))
        setError('共有先に結果画像を渡せませんでした。');
    } finally {
      setSharing(false);
    }
  };

  return {
    preparing: image.kind === 'preparing',
    ready: image.kind === 'ready',
    sharing,
    error,
    share,
  };
}
