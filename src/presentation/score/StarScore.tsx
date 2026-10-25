import { projectStarScore } from './starScore';

export function StarScore({ value }: Readonly<{ value: bigint }>) {
  const display = projectStarScore(value);
  return (
    <div className="score-value star-number" aria-label={value.toString() + 'スター'}>
      {display.lines.map((digits, line) => (
        <span className="star-line" key={line} aria-hidden="true">
          {digits.map(({ digit, leading, comma }, index) => (
            <span className={leading ? 'star-leading' : undefined} key={index}>
              {digit}
              {comma && <span className="star-comma">,</span>}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
