import type { CostumeId } from '../../domain/game/model';

type Palette = Readonly<{
  fabric: string;
  trim: string;
  paper: string;
  motif: 'star' | 'circle' | 'diamond' | 'stripe';
}>;

export const costumePalettes: Readonly<Record<CostumeId, Palette>> = {
  star: { fabric: '#f17aaf', trim: '#fff0a6', paper: '#fbe6ee', motif: 'star' },
  moon: { fabric: '#4f467e', trim: '#f8dc95', paper: '#e8e4f4', motif: 'circle' },
  blossom: { fabric: '#f6afa5', trim: '#faf1c7', paper: '#fff0e6', motif: 'circle' },
  encore: { fabric: '#df734d', trim: '#ffdf88', paper: '#fae6ca', motif: 'stripe' },
  sailor: { fabric: '#77cbd1', trim: '#fcfaf3', paper: '#e1f3f2', motif: 'stripe' },
  witch: { fabric: '#4c587f', trim: '#c6c5f4', paper: '#e2e7f4', motif: 'star' },
  prism: { fabric: '#718f9e', trim: '#b3f0db', paper: '#e7f0eb', motif: 'diamond' },
  snow: { fabric: '#faf8ee', trim: '#92b4dc', paper: '#e7ecf8', motif: 'star' },
  sunny: { fabric: '#efba4f', trim: '#fff4ce', paper: '#fcf0c9', motif: 'circle' },
  space: { fabric: '#d3d2eb', trim: '#8577b1', paper: '#e9e5f4', motif: 'circle' },
  march: { fabric: '#557ca7', trim: '#f8db8a', paper: '#e1eafa', motif: 'stripe' },
  ribbon: { fabric: '#d97189', trim: '#ffdeb8', paper: '#fae5df', motif: 'diamond' },
};
