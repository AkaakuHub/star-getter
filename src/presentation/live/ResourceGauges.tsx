import { BatteryMedium, Zap } from 'lucide-preact';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { voltageLevel, voltageProgress } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { liveLayout } from './layout';
import { GenesisGauge } from './GenesisGauge';
import { formatNumber } from '../score/formatNumber';

export function ResourceGauges({ state }: Readonly<{ state: GameState }>) {
  if (state.genesis.effects.length > 0)
    return <GenesisGauge currentGauge={state.genesis.currentGauge} />;
  const voltage = voltageLevel(state.currentVoltage, state.maximumVoltageLevel);
  return (
    <>
      <div
        className="voltage-gauge"
        style={liveLayout.voltage}
        role="progressbar"
        aria-label="熱気"
        aria-valuemin={0}
        aria-valuemax={1000}
        aria-valuenow={voltage}
      >
        <span>熱気</span>
        <strong>{formatNumber(voltage)}</strong>
        <div>
          <i
            style={{
              width: voltageProgress(state.currentVoltage, state.maximumVoltageLevel) + '%',
            }}
          />
        </div>
      </div>
      <div
        className="resource-gauge mental-gauge"
        style={liveLayout.mental}
        role="progressbar"
        aria-label="元気"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(state.mental.currentMental)}
      >
        <BatteryMedium size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: state.mental.currentMental + '%' }} />
        </div>
        <strong>{Math.floor(state.mental.currentMental)}</strong>
        <span>元気</span>
      </div>
      <div
        className="resource-gauge ap-gauge"
        style={liveLayout.ap}
        role="progressbar"
        aria-label="エナジー"
        aria-valuemin={0}
        aria-valuemax={state.maxAp}
        aria-valuenow={Math.floor(state.currentAp)}
      >
        <Zap size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: (state.currentAp / state.maxAp) * 100 + '%' }} />
        </div>
        <strong>
          {Math.floor(state.currentAp)}
          <small>/{state.maxAp}</small>
        </strong>
        <span>エナジー</span>
      </div>
    </>
  );
}
