import { Gem } from 'lucide-preact';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { liveLayout } from './layout';
import { formatNumber } from '../score/formatNumber';

export function BloomGauge({ progress }: Readonly<{ progress: bigint }>) {
  const value = Number(progress);
  const maximum = Number(rules.maxBloomGauge);
  const fill = (value / maximum) * 100;
  return (
    <>
      <div className="bloom-progress" style={liveLayout.bloom} role="status">
        <Gem size={15} aria-hidden="true" />
        <span>開花</span>
        <strong>{formatNumber(progress)}</strong>
        <small>/{formatNumber(rules.maxBloomGauge)}</small>
      </div>
      {[liveLayout.bloomLeft, liveLayout.bloomRight].map((position, index) => (
        <div
          key={index}
          className="resource-gauge bloom-gauge"
          style={position}
          role="progressbar"
          aria-label="開花プログレス"
          aria-valuemin={0}
          aria-valuemax={maximum}
          aria-valuenow={value}
        >
          <Gem size={18} aria-hidden="true" />
          <div className="vertical-meter">
            <i style={{ height: fill + '%' }} />
          </div>
        </div>
      ))}
    </>
  );
}
