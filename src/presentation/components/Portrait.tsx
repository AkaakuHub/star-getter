import type { PerformerId } from '../../domain/game/model';

export function Portrait({ performer }: Readonly<{ performer: PerformerId }>) {
  return (
    <span className={`portrait portrait-${performer}`} aria-hidden="true">
      <span className="portrait-orbit" />
      <span className="portrait-ear ear-left" />
      <span className="portrait-ear ear-right" />
      <span className="portrait-body" />
      <span className="portrait-head">
        <span className="portrait-eye eye-left" />
        <span className="portrait-eye eye-right" />
        <span className="portrait-mouth" />
      </span>
    </span>
  );
}
