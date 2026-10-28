import { Gem } from 'lucide-preact';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { liveLayout } from './layout';
import { formatNumber } from '../score/formatNumber';

export function GenesisGauge({ currentGauge }: Readonly<{ currentGauge: number }>) {
  const value = currentGauge;
  const maximum = Number(rules.maxGenesisGauge);
  const fill = Math.max(0, Math.min(100, (value / maximum) * 100));
  return (
    <>
      <div className="genesis-progress" style={liveLayout.genesis} role="status">
        <Gem size={15} aria-hidden="true" />
        <span>開花</span>
        <strong>{formatNumber(currentGauge)}</strong>
        <small>/{formatNumber(rules.maxGenesisGauge)}</small>
      </div>
      {[liveLayout.genesisLeft, liveLayout.genesisRight].map((position, index) => (
        <div
          key={index}
          className="resource-gauge genesis-gauge"
          style={position}
          role="progressbar"
          aria-label="開花プログレス"
          aria-valuemin={0}
          aria-valuemax={maximum}
          aria-valuenow={Math.max(0, value)}
          aria-valuetext={formatNumber(value)}
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
