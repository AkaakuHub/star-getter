import { Gem, Star } from 'lucide-preact';
import { render } from 'preact';

let sprites: Promise<Readonly<{ heart: HTMLImageElement; flower: HTMLImageElement }>> | null = null;

export function createHeartSprites() {
  if (!sprites) {
    sprites = Promise.all([createSprite('heart'), createSprite('flower')]).then(
      ([heart, flower]) => ({ heart, flower }),
    );
  }
  return sprites;
}

async function createSprite(kind: 'heart' | 'flower'): Promise<HTMLImageElement> {
  const container = document.createElement('div');
  render(
    kind === 'heart' ? (
      <Star size={64} color="#e64f86" fill="#e64f86" />
    ) : (
      <Gem size={64} color="#fbbf24" />
    ),
    container,
  );
  const svg = container.firstElementChild;
  if (!(svg instanceof SVGSVGElement)) throw new Error('きらめきの描画を準備できません。');
  const source = new XMLSerializer().serializeToString(svg);
  render(null, container);
  const sprite = new Image();
  sprite.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  await sprite.decode();
  return sprite;
}
