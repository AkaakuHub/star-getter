import { BatteryMedium, Zap } from 'lucide-preact';
import type { GameState } from '../../domain/game/model';
import { voltageLevel, voltageProgress } from '../../domain/game/live/voltageLevel';
import { liveLayout } from './layout';
import { BloomGauge } from './BloomGauge';
import { formatNumber } from '../score/formatNumber';

export function ResourceGauges({ state }: Readonly<{ state: GameState }>) {
  if (state.bloom) return <BloomGauge progress={state.bloom.progress} />;
  const voltage = voltageLevel(state.excitement, state.maximumVoltageLevel);
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
            style={{ width: voltageProgress(state.excitement, state.maximumVoltageLevel) + '%' }}
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
        aria-valuenow={Math.floor(state.stamina)}
      >
        <BatteryMedium size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: state.stamina + '%' }} />
        </div>
        <strong>{Math.floor(state.stamina)}</strong>
        <span>元気</span>
      </div>
      <div
        className="resource-gauge ap-gauge"
        style={liveLayout.ap}
        role="progressbar"
        aria-label="エナジー"
        aria-valuemin={0}
        aria-valuemax={state.maxEnergy}
        aria-valuenow={Math.floor(state.energy)}
      >
        <Zap size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: (state.energy / state.maxEnergy) * 100 + '%' }} />
        </div>
        <strong>
          {Math.floor(state.energy)}
          <small>/{state.maxEnergy}</small>
        </strong>
        <span>エナジー</span>
      </div>
    </>
  );
}
