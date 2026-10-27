import type { CostumeId } from '@akaakuhub/suku-sute-core/game/model';

type Palette = Readonly<{
  fabric: string;
  trim: string;
  paper: string;
}>;

export const costumePalettes: Readonly<Record<CostumeId, Palette>> = {
  star: { fabric: '#f17aaf', trim: '#fff0a6', paper: '#ffd2ed' },
  moon: { fabric: '#4f467e', trim: '#f8dc95', paper: '#4d4677' },
  blossom: { fabric: '#f6afa5', trim: '#faf1c7', paper: '#ffcebc' },
  encore: { fabric: '#df734d', trim: '#ffdf88', paper: '#ffc36f' },
  sailor: { fabric: '#77cbd1', trim: '#fcfaf3', paper: '#a3e7ee' },
  witch: { fabric: '#4c587f', trim: '#c6c5f4', paper: '#baaff3' },
  prism: { fabric: '#718f9e', trim: '#b3f0db', paper: '#9fe9c5' },
  snow: { fabric: '#faf8ee', trim: '#92b4dc', paper: '#d6efff' },
  sunny: { fabric: '#efba4f', trim: '#fff4ce', paper: '#ffe68a' },
  space: { fabric: '#d3d2eb', trim: '#8577b1', paper: '#6978a5' },
  march: { fabric: '#557ca7', trim: '#f8db8a', paper: '#b3c9f6' },
  ribbon: { fabric: '#d97189', trim: '#ffdeb8', paper: '#f7b4bb' },
};
