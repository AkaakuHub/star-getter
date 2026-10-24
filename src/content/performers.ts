import type { Mood, PerformerId } from '../domain/game/model';

type Performer = Readonly<{
  id: PerformerId;
  name: string;
  mood: Mood;
  color: string;
  portrait: string;
}>;

export const performers: Readonly<Record<PerformerId, Performer>> = {
  nova: {
    id: 'nova',
    name: '朝凪のあ',
    mood: 'warm',
    color: '#ff8fab',
    portrait: '/cards/launch/spark.png',
  },
  lumen: {
    id: 'lumen',
    name: '雨宮せり',
    mood: 'cool',
    color: '#7edce4',
    portrait: '/cards/launch/ripple.png',
  },
  tetra: {
    id: 'tetra',
    name: '星乃りお',
    mood: 'bright',
    color: '#ffd678',
    portrait: '/cards/launch/bounce.png',
  },
};

export const moodNames: Readonly<Record<Mood, string>> = {
  warm: 'ウォーム',
  cool: 'クール',
  bright: 'ブライト',
};
