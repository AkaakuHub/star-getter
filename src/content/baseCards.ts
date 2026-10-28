import { sunriseCard } from './cards/sunrise';
import { preparationCards } from './cards/preparation';
import { libraryCards } from './cards/library';
import { setupCards } from './cards/setup';
import { genesisCards } from './cards/genesis';
import { parityCards } from './cards/parity';

export const baseCards = [
  ...libraryCards,
  ...setupCards,
  ...genesisCards,
  ...preparationCards,
  sunriseCard,
  ...parityCards,
];
