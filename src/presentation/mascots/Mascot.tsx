import type { CostumeId, PerformerId } from '../../domain/game/model';
import { Costume } from './Costume';
import { Headwear } from './Headwear';

const hairColors = { nova: '#e79bb2', lumen: '#78b2bf', tetra: '#d8ab60' } as const;

export function Mascot({
  performer,
  costume,
}: Readonly<{ performer: PerformerId; costume: CostumeId }>) {
  const hair = hairColors[performer];
  return (
    <svg className="mascot" viewBox="0 0 240 300" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="279" rx="62" ry="8" fill="#353148" opacity="0.08" />
      <path d="M103 238v30M137 238v30" stroke="#f7dfcf" strokeWidth="16" strokeLinecap="round" />
      <path d="M94 271h17M130 271h17" stroke="#4f465d" strokeWidth="12" strokeLinecap="round" />
      {performer === 'nova' && (
        <g fill={hair}>
          <ellipse cx="62" cy="137" rx="21" ry="42" transform="rotate(13 62 137)" />
          <ellipse cx="178" cy="137" rx="21" ry="42" transform="rotate(-13 178 137)" />
        </g>
      )}
      {performer === 'lumen' && <path d="M59 105q-1-63 61-63t61 63v66H59Z" fill={hair} />}
      {performer === 'tetra' && (
        <path
          d="m66 145-13-36 10-11-5-28 26 3 9-30 23 12 27-13 10 24 27 3-7 27 15 15-14 34Z"
          fill={hair}
        />
      )}
      <Costume costume={costume} />
      <path
        d="M73 189 65 205M167 189 175 205"
        stroke="#f7dfcf"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="120" cy="111" r="58" fill="#f9e5d5" />
      <path d="M62 110q-5-65 58-65t58 65l-16-31-23 13-16-23-21 25-23-10Z" fill={hair} />
      {performer === 'nova' && (
        <path
          d="M92 65q7 16 21 20M123 60q8 15 24 20"
          stroke="#d5839d"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      {performer === 'lumen' && <path d="M159 65q-10 36-46 39l10-40Z" fill={hair} />}
      {performer === 'tetra' && <path d="m86 67 12 24 17-26 15 25 16-22" fill={hair} />}
      <ellipse cx="96" cy="119" rx="5" ry={performer === 'lumen' ? 7 : 8} fill="#4c435a" />
      <ellipse cx="144" cy="119" rx="5" ry={performer === 'lumen' ? 7 : 8} fill="#4c435a" />
      <ellipse cx="82" cy="134" rx="10" ry="5" fill="#eaa2a5" opacity="0.65" />
      <ellipse cx="158" cy="134" rx="10" ry="5" fill="#eaa2a5" opacity="0.65" />
      <path
        d={performer === 'tetra' ? 'M110 137q10 15 20 0Z' : 'M112 138q8 8 16 0'}
        fill={performer === 'tetra' ? '#cd7b85' : 'none'}
        stroke="#835764"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Headwear costume={costume} />
    </svg>
  );
}
