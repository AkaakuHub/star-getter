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
    name: 'たいよう',
    mood: 'warm',
    color: '#f6b83c',
    costume: 'star',
  },
  lumen: {
    id: 'lumen',
    name: 'あめ',
    mood: 'cool',
    color: '#79b8e5',
    costume: 'sailor',
  },
  tetra: {
    id: 'tetra',
    name: 'くも',
    mood: 'bright',
    color: '#a6a6cf',
    costume: 'sunny',
  },
};
