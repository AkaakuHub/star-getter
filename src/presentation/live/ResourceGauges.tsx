import { BatteryMedium, Zap } from 'lucide-preact';
import { type GameState, rules } from '../../domain/game/model';
import { voltageLevel, voltageProgress } from '../../domain/game/live/voltageLevel';
import { liveLayout } from './layout';
import { BloomGauge } from './BloomGauge';

export function ResourceGauges({ state }: Readonly<{ state: GameState }>) {
  if (state.bloom) return <BloomGauge progress={state.bloom.progress} />;
  const voltage = voltageLevel(state.excitement);
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
        <strong>{voltage}</strong>
        <div>
          <i style={{ width: voltageProgress(state.excitement) + '%' }} />
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
      </div>
      <div
        className="resource-gauge ap-gauge"
        style={liveLayout.ap}
        role="progressbar"
        aria-label="エナジー"
        aria-valuemin={0}
        aria-valuemax={rules.maxEnergy}
        aria-valuenow={Math.floor(state.energy)}
      >
        <Zap size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: state.energy * 10 + '%' }} />
        </div>
        <strong>{state.bloom ? '∞' : Math.floor(state.energy)}</strong>
        <span>エナジー</span>
      </div>
    </>
  );
}
