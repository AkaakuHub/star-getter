import { useState } from 'preact/hooks';
import { initialRoute } from './initialRoute';
import { createPresetSetup } from './setup/gameSetup';
import { LiveGame } from './LiveGame';
import { StartScreen } from '../presentation/setup/StartScreen';

export function App() {
  const [setup, setSetup] = useState(() => createPresetSetup(initialRoute(location.href)));
  const [playing, setPlaying] = useState(false);
  if (playing)
    return (
      <LiveGame
        initialSetup={setup}
        onSetup={(next) => {
          setSetup(next);
          setPlaying(false);
        }}
      />
    );
  return <StartScreen setup={setup} onChange={setSetup} onStart={() => setPlaying(true)} />;
}
