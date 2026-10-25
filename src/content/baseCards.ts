import { preparationCards } from './cards/preparation';
import { libraryCards } from './cards/library';
import { setupCards } from './cards/setup';
import { bloomCards } from './cards/bloom';

export const baseCards = [...libraryCards, ...setupCards, ...bloomCards, ...preparationCards];
