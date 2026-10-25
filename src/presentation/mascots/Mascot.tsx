import {
  Sun,
  Cloud,
  CloudRain,
  Star,
  Moon,
  Flower2,
  Crown,
  Sailboat,
  WandSparkles,
  Gem,
  Snowflake,
  Glasses,
  Orbit,
  Flag,
  Ribbon,
} from 'lucide-preact';
import type { CostumeId, PerformerId } from '../../domain/game/model';
import { costumePalettes } from './appearance';

const weather = {
  nova: { icon: Sun, fill: '#ffda62' },
  lumen: { icon: CloudRain, fill: '#97cef1' },
  tetra: { icon: Cloud, fill: '#f8f7ff' },
} as const;

const accessories = {
  star: Star,
  moon: Moon,
  blossom: Flower2,
  encore: Crown,
  sailor: Sailboat,
  witch: WandSparkles,
  prism: Gem,
  snow: Snowflake,
  sunny: Glasses,
  space: Orbit,
  march: Flag,
  ribbon: Ribbon,
} as const;

export function Mascot({
  performer,
  costume,
}: Readonly<{ performer: PerformerId; costume: CostumeId }>) {
  const character = weather[performer];
  const Weather = character.icon;
  const Accessory = accessories[costume];
  const palette = costumePalettes[costume];
  return (
    <span
      className={'mascot weather-' + performer}
      style={{ '--costume-fabric': palette.fabric, '--costume-trim': palette.trim }}
      aria-hidden="true"
    >
      <span className="weather-character">
        <Weather className="weather-body" strokeWidth={1.7} color="#353148" fill={character.fill} />
        <span className="weather-face">
          <span className="weather-smile" />
        </span>
        <span className="weather-scarf" />
        <span className="weather-accessory">
          <Accessory strokeWidth={2} />
        </span>
      </span>
    </span>
  );
}
