import type { CostumeId } from '../../domain/game/model';
import { costumePalettes } from './appearance';

export function Headwear({ costume }: Readonly<{ costume: CostumeId }>) {
  const { fabric, trim } = costumePalettes[costume];
  switch (costume) {
    case 'star':
      return <path d="m89 60-5-27 22 16 14-28 14 28 22-16-5 27Z" fill={trim} />;
    case 'moon':
      return (
        <g>
          <path d="M86 30h68v33H86Z" fill={fabric} />
          <path d="M86 51h68v10H86Z" fill={trim} />
          <rect x="73" y="60" width="94" height="10" rx="5" fill={fabric} />
          <path d="M134 33a11 11 0 1 0 9 16 10 10 0 0 1-9-16" fill={trim} />
        </g>
      );
    case 'blossom':
      return (
        <g>
          <ellipse cx="111" cy="54" rx="41" ry="15" fill={fabric} />
          <g fill={trim}>
            <circle cx="140" cy="46" r="9" />
            <circle cx="150" cy="55" r="9" />
            <circle cx="145" cy="66" r="9" />
            <circle cx="132" cy="65" r="9" />
            <circle cx="129" cy="52" r="9" />
          </g>
          <circle cx="139" cy="56" r="6" fill={fabric} />
        </g>
      );
    case 'encore':
      return (
        <g>
          <path d="M80 69q40-43 80 0" fill="none" stroke={trim} strokeWidth="12" />
          <circle cx="153" cy="59" r="16" fill={fabric} />
          <circle cx="153" cy="59" r="8" fill={trim} />
        </g>
      );
    case 'sailor':
      return (
        <g>
          <path d="M77 48q43-27 86 0l-10 19H87Z" fill={trim} />
          <path d="M87 63h66" stroke={fabric} strokeWidth="8" />
          <circle cx="120" cy="49" r="5" fill={fabric} />
        </g>
      );
    case 'witch':
      return (
        <g>
          <path d="m120 9 35 53H85Z" fill={fabric} />
          <path d="m92 51 55-3 8 14H85Z" fill={trim} />
          <ellipse cx="120" cy="66" rx="60" ry="10" fill={fabric} />
        </g>
      );
    case 'prism':
      return (
        <g>
          <path d="m77 68 86-10-7 23-75 6Z" fill={trim} />
          <path d="m127 63 20-2-16 22-20 2Z" fill="#fffaf4" />
        </g>
      );
    case 'snow':
      return (
        <g fill={trim}>
          <path d="M77 73q-9-44 20-37 23-20 45 0 28-7 21 37-45-14-86 0" />
          <circle cx="80" cy="83" r="14" />
          <circle cx="160" cy="83" r="14" />
        </g>
      );
    case 'sunny':
      return (
        <g>
          <ellipse cx="120" cy="53" rx="47" ry="21" fill={fabric} />
          <path d="M82 63h76" stroke={trim} strokeWidth="8" strokeLinecap="round" />
          <path d="m123 28 3-9" stroke={fabric} strokeWidth="7" strokeLinecap="round" />
        </g>
      );
    case 'space':
      return (
        <g>
          <circle cx="120" cy="105" r="66" fill="none" stroke={trim} strokeWidth="9" />
          <path
            d="M81 60q-18 16-18 40"
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect x="50" y="89" width="14" height="31" rx="6" fill={trim} />
          <rect x="176" y="89" width="14" height="31" rx="6" fill={trim} />
        </g>
      );
    case 'march':
      return (
        <g>
          <path d="M88 23h64v41H88Z" fill={fabric} />
          <path d="M88 48h64v10H88Z" fill={trim} />
          <ellipse cx="120" cy="65" rx="42" ry="9" fill={fabric} />
          <path d="m120 47 8-11-8-11-8 11Z" fill={trim} />
        </g>
      );
    case 'ribbon':
      return (
        <g>
          <path d="m120 55-35-24v38l35-8 35 8V31Z" fill={fabric} />
          <circle cx="120" cy="56" r="9" fill={trim} />
        </g>
      );
  }
}
