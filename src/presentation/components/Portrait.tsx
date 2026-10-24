import { performers } from '../../content/performers';
import type { PerformerId } from '../../domain/game/model';

export function Portrait({ performer }: Readonly<{ performer: PerformerId }>) {
  return (
    <span className={'portrait portrait-' + performer} aria-hidden="true">
      <img src={performers[performer].portrait} alt="" draggable={false} />
    </span>
  );
}
