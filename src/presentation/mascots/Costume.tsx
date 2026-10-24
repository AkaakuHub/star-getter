import type { CostumeId } from '../../domain/game/model';
import { costumePalettes } from './appearance';

export function Costume({ costume }: Readonly<{ costume: CostumeId }>) {
  const { fabric, trim } = costumePalettes[costume];
  switch (costume) {
    case 'star':
      return (
        <g>
          <path d="M79 169 50 257 190 257 161 169Z" fill={trim} />
          <path d="M89 170 151 170 168 257 72 257Z" fill={fabric} />
          <path d="m120 191 6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2Z" fill={trim} />
          <path
            d="M79 175 68 206M161 175 172 206"
            stroke={fabric}
            strokeWidth="20"
            strokeLinecap="round"
          />
        </g>
      );
    case 'moon':
      return (
        <g>
          <path d="m81 170-18 105 57-24 57 24-18-105Z" fill={fabric} />
          <path d="M105 171h30l-15 62Z" fill="#fffaf4" />
          <path d="m101 176 19 9 19-9v17l-19-8-19 8Z" fill={trim} />
          <path
            d="M82 180 66 215M158 180 174 215"
            stroke={fabric}
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path d="M102 249v19M138 249v19" stroke={fabric} strokeWidth="20" />
        </g>
      );
    case 'blossom':
      return (
        <g>
          <path
            d="M88 168h64l-5 42 27 39q-13 25-27 8-14 23-27 4-14 19-28-4-14 17-26-8l27-39Z"
            fill={fabric}
          />
          <path d="M91 203h58v10H91Z" fill={trim} />
          <circle cx="120" cy="186" r="13" fill={trim} />
          <circle cx="120" cy="186" r="5" fill={fabric} />
          <path
            d="M83 181 68 204M157 181 172 204"
            stroke={fabric}
            strokeWidth="25"
            strokeLinecap="round"
          />
        </g>
      );
    case 'encore':
      return (
        <g>
          <path d="M82 169h76l8 64H74Z" fill={fabric} />
          <path d="m87 171 33 26 33-26-14 33h-38Z" fill={trim} />
          <path d="M84 233h72v24H84Z" fill={trim} />
          <path
            d="M82 182 66 219M158 182 174 219"
            stroke={fabric}
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path d="M98 263h12M130 263h12" stroke={fabric} strokeWidth="10" />
        </g>
      );
    case 'sailor':
      return (
        <g>
          <path d="M82 168h76l-9 45 16 43H75l16-43Z" fill={fabric} />
          <path d="m83 169 37 30 37-30-12 34h-50Z" fill={trim} />
          <path d="m120 193-10 29h20Z" fill="#4f7d9b" />
          <path
            d="M80 181 64 211M160 181 176 211"
            stroke={fabric}
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path d="M79 240h82M77 249h86" stroke={trim} strokeWidth="4" />
        </g>
      );
    case 'witch':
      return (
        <g>
          <path d="m85 168-26 100 61-15 61 15-26-100Z" fill={fabric} />
          <path d="m85 169 35 35 35-35-14 47h-42Z" fill={trim} />
          <path d="m120 209 7 11-7 11-7-11Z" fill="#f5d78b" />
          <path
            d="M84 178 63 216M156 178 177 216"
            stroke={fabric}
            strokeWidth="20"
            strokeLinecap="round"
          />
        </g>
      );
    case 'prism':
      return (
        <g>
          <path d="m82 169 38-9 38 9 6 72-44 14-44-14Z" fill={fabric} />
          <path d="m120 163 37 8-16 31-21-6-21 6-16-31Z" fill={trim} />
          <path d="m120 196 15 23-15 23-15-23Z" fill="#fffaf4" />
          <path d="m81 173-21 28 17 12 19-26M159 173l21 28-17 12-19-26" fill={trim} />
          <path d="M99 255v13M141 255v13" stroke={fabric} strokeWidth="15" />
        </g>
      );
    case 'snow':
      return (
        <g>
          <rect x="77" y="167" width="86" height="94" rx="28" fill={fabric} />
          <path d="M120 179v77M82 209h76M82 237h76" stroke="#d4dfe8" strokeWidth="3" />
          <path
            d="M86 174q34 27 68 0"
            fill="none"
            stroke={trim}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M81 184 65 217M159 184 175 217"
            stroke={fabric}
            strokeWidth="25"
            strokeLinecap="round"
          />
          <path d="M104 179v31h15v-31" fill={trim} />
        </g>
      );
    case 'sunny':
      return (
        <g>
          <path d="M84 167h72l8 61H76Z" fill={trim} />
          <path d="M92 169h12v42h32v-42h12v83H92Z" fill={fabric} />
          <rect x="106" y="219" width="28" height="23" rx="5" fill={trim} />
          <circle cx="99" cy="210" r="3" fill="#faf4d7" />
          <circle cx="141" cy="210" r="3" fill="#faf4d7" />
          <path
            d="M81 179 66 209M159 179 174 209"
            stroke={trim}
            strokeWidth="23"
            strokeLinecap="round"
          />
        </g>
      );
    case 'space':
      return (
        <g>
          <rect x="77" y="166" width="86" height="94" rx="24" fill={fabric} />
          <rect x="99" y="188" width="42" height="36" rx="8" fill={trim} />
          <path d="M107 197h26M107 206h15" stroke="#fffaf4" strokeWidth="4" />
          <path
            d="M80 180 62 215M160 180 178 215"
            stroke={fabric}
            strokeWidth="25"
            strokeLinecap="round"
          />
          <path d="M97 251v19M143 251v19" stroke={trim} strokeWidth="17" />
        </g>
      );
    case 'march':
      return (
        <g>
          <path d="M82 168h76l-3 77H85Z" fill={fabric} />
          <path d="M78 173h24v13H78ZM138 173h24v13h-24Z" fill={trim} />
          <path d="M100 196h40M100 208h40M100 220h40" stroke={trim} strokeWidth="5" />
          <path
            d="M82 181 65 218M158 181 175 218"
            stroke={fabric}
            strokeWidth="19"
            strokeLinecap="round"
          />
          <path d="M99 245v25M141 245v25" stroke={fabric} strokeWidth="20" />
          <path d="M90 261h20M131 261h20" stroke={trim} strokeWidth="5" />
        </g>
      );
    case 'ribbon':
      return (
        <g>
          <path d="M88 168h64l-5 39 28 53H65l28-53Z" fill={fabric} />
          <path
            d="M94 211 82 254M108 211l-3 43M132 211l3 43M146 211l12 43"
            stroke={trim}
            strokeWidth="5"
          />
          <path d="m120 189-29-13v29l29-11 29 11v-29Z" fill={trim} />
          <circle cx="120" cy="192" r="7" fill={fabric} />
          <path
            d="M83 180 68 207M157 180 172 207"
            stroke={fabric}
            strokeWidth="23"
            strokeLinecap="round"
          />
        </g>
      );
  }
}
