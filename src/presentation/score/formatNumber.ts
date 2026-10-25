const numberFormat = new Intl.NumberFormat('ja-JP');

export function formatNumber(value: number | bigint): string {
  return numberFormat.format(value);
}
