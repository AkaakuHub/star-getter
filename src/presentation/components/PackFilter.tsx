import { packs } from '../../content/packs';

export function PackFilter({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (value: string) => void }>) {
  return (
    <select
      className="pack-filter"
      aria-label="カードパック"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      <option value="">すべてのパック</option>
      {packs.map((pack) => (
        <option value={pack.id} key={pack.id}>
          {pack.name}
        </option>
      ))}
    </select>
  );
}
