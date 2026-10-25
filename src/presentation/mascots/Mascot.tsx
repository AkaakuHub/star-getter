import { Sun, Cloud, CloudRain } from 'lucide-preact';
import type { PerformerId } from '../../domain/game/model';

const weather = {
  nova: { icon: Sun, fill: '#ffda62' },
  lumen: { icon: CloudRain, fill: '#97cef1' },
  tetra: { icon: Cloud, fill: '#f8f7ff' },
} as const;

export function Mascot({ performer }: Readonly<{ performer: PerformerId }>) {
  const character = weather[performer];
  const Weather = character.icon;
  return (
    <span className={'mascot weather-' + performer} aria-hidden="true">
      <span className="weather-character">
        <Weather className="weather-body" strokeWidth={1.7} color="#353148" fill={character.fill} />
        <span className="weather-face">
          <span className="weather-smile" />
        </span>
      </span>
    </span>
  );
}
