import type { CostumeId, PerformerId } from '../domain/game/model';

type Performer = Readonly<{
  id: PerformerId;
  name: string;
  color: string;
  costume: CostumeId;
}>;

export const performers: Readonly<Record<PerformerId, Performer>> = {
  nova: {
    id: 'nova',
    name: 'たいよう',
    color: '#f6b83c',
    costume: 'star',
  },
  lumen: {
    id: 'lumen',
    name: 'あめ',
    color: '#79b8e5',
    costume: 'sailor',
  },
  tetra: {
    id: 'tetra',
    name: 'くも',
    color: '#a6a6cf',
    costume: 'sunny',
  },
};
