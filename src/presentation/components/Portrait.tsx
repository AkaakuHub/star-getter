import { performers } from '../../content/performers';
import type { PerformerId } from '../../domain/game/model';
import { Mascot } from '../mascots/Mascot';

export function Portrait({ performer }: Readonly<{ performer: PerformerId }>) {
  return (
    <span className={'portrait portrait-' + performer} aria-hidden="true">
      <Mascot performer={performer} costume={performers[performer].costume} />
    </span>
  );
}
