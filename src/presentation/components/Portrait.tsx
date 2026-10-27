import type { PerformerId } from '@akaakuhub/suku-sute-core/game/model';
import { Mascot } from '../mascots/Mascot';

export function Portrait({ performer }: Readonly<{ performer: PerformerId }>) {
  return (
    <span className={'portrait portrait-' + performer} aria-hidden="true">
      <Mascot performer={performer} />
    </span>
  );
}
