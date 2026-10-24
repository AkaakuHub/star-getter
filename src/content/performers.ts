import type { CostumeId, Mood, PerformerId } from '../domain/game/model';

type Performer = Readonly<{
  id: PerformerId;
  name: string;
  mood: Mood;
  color: string;
  costume: CostumeId;
}>;

export const performers: Readonly<Record<PerformerId, Performer>> = {
  nova: {
    id: 'nova',
    name: '朝凪のあ',
    mood: 'warm',
    color: '#ff8fab',
    costume: 'star',
  },
  lumen: {
    id: 'lumen',
    name: '雨宮せり',
    mood: 'cool',
    color: '#7edce4',
    costume: 'sailor',
  },
  tetra: {
    id: 'tetra',
    name: '星乃りお',
    mood: 'bright',
    color: '#ffd678',
    costume: 'sunny',
  },
};
