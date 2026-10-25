import { describe, expect, it } from 'vite-plus/test';
import {
  readHeartShowLimit,
  writeHeartShowLimit,
} from '../../src/infrastructure/storage/heartDisplay';

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('きらめき表示数の保存', () => {
  it('初回は100個で、選択した値を再読込できる', () => {
    const saved = storage();
    expect(readHeartShowLimit(saved)).toBe(100);
    writeHeartShowLimit(saved, 30);
    expect(readHeartShowLimit(saved)).toBe(30);
  });

  it('10個刻みの範囲外を保存せず、直前の設定を保持する', () => {
    const saved = storage();
    writeHeartShowLimit(saved, 50);
    for (const value of [0, 15, 101, Number.NaN])
      expect(() => writeHeartShowLimit(saved, value)).toThrow();
    expect(readHeartShowLimit(saved)).toBe(50);
  });
});
