import type { Mood, PerformerId } from '../domain/game/model';

type Performer = Readonly<{ id: PerformerId; name: string; mood: Mood; color: string }>;

export const performers: Readonly<Record<PerformerId, Performer>> = {
  nova: { id: 'nova', name: 'ノヴァ', mood: 'warm', color: '#f78077' },
  lumen: { id: 'lumen', name: 'ルーメン', mood: 'cool', color: '#7ccac5' },
  tetra: { id: 'tetra', name: 'テトラ', mood: 'bright', color: '#f1c86b' },
};

export const moodNames: Readonly<Record<Mood, string>> = {
  warm: 'ウォーム',
  cool: 'クール',
  bright: 'ブライト',
};
