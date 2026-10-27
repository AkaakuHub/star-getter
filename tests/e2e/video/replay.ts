import type { Locator, Page } from 'playwright-core';
import type { InputRecord } from '../recording/gameRecording';
import type { TapRecord } from './types.ts';

export async function snapshot(page: Page) {
  return page.evaluate(() => {
    const session = window.e2eVideoSession;
    if (!session) throw new Error('録画用の時計がありません。');
    return session.snapshot();
  });
}

export async function paint(page: Page): Promise<void> {
  await page.evaluate(() => {
    const session = window.e2eVideoSession;
    if (!session) throw new Error('録画用の時計がありません。');
    session.paint();
  });
}

async function tap(page: Page, locator: Locator, label: string) {
  await page.evaluate((value) => {
    window.e2eVideoTapLabel = value;
  }, label);
  const point = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    for (const vertical of [0.5, 0.25, 0.75, 0.1, 0.9]) {
      for (const horizontal of [0.5, 0.25, 0.75, 0.1, 0.9]) {
        const x = bounds.left + bounds.width * horizontal;
        const y = bounds.top + bounds.height * vertical;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === element || element.contains(hit))) return { x, y };
      }
    }
    throw new Error('タップできる位置がありません。');
  });
  await page.mouse.click(point.x, point.y);
  return point;
}

export async function replayInput(page: Page, row: InputRecord): Promise<TapRecord | null> {
  const action = row.input;
  if (action.kind === 'card-inspect' || action.kind === 'card-cancel') return null;
  let point: Readonly<{ x: number; y: number }>;
  if (action.kind === 'card-select' || action.kind === 'card') {
    const state = await snapshot(page);
    const index = state.hand.indexOf(action.card.instanceId);
    if (index < 0) throw new Error('記録されたカードが手札にありません: ' + action.card.instanceId);
    point = await tap(
      page,
      page.locator('section[aria-label="手札"] button.hand-card').nth(index),
      action.kind === 'card' ? '発動' : '選択',
    );
  } else if (action.kind === 'special-menu') {
    point = await tap(
      page,
      page.getByRole('button', { name: '共鳴を選択', exact: true }),
      '共鳴一覧',
    );
  } else if (action.kind === 'special') {
    const locator = page.getByRole('button', { name: action.card.name + 'の共鳴、', exact: false });
    await locator.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    point = await tap(page, locator, '共鳴を発動');
  } else if (action.kind === 'automatic-hearts') {
    point = await tap(
      page,
      page.getByRole('button', { name: 'きらめき100個で自動回収', exact: true }),
      '自動回収' + (action.enabled ? 'ON' : 'OFF'),
    );
  } else if (action.kind === 'wait-mode') {
    point = await tap(
      page,
      page.getByRole('button', { name: 'カード使用可能時の自動停止', exact: true }),
      '自動停止' + (action.enabled ? 'ON' : 'OFF'),
    );
  } else if (action.kind === 'collect' || action.kind === 'wait-cancel') {
    point = await tap(
      page,
      page.locator('.heart-field'),
      action.kind === 'collect' ? '回収' : '待ちを解除',
    );
  } else {
    throw new Error('未知の操作です。');
  }
  if (action.kind === 'wait-cancel')
    await page.evaluate(() => {
      // E2Eの同期入力では、再開のPromiseが最初のフレーム要求より先に時計を進める。
      window.e2eVideoSession?.deferResumeFrame();
    });
  return { sequence: row.sequence, wallSeconds: row.wallSeconds, kind: action.kind, ...point };
}

export async function verifyInput(page: Page, row: InputRecord): Promise<void> {
  const actual = await snapshot(page);
  const expected = { ...row.after, tick: row.tick };
  for (const key of [
    'tick',
    'score',
    'gauge',
    'deckSize',
    'energy',
    'heartLimit',
    'storyAmplification',
    'lastActionTick',
    'phase',
  ] as const) {
    if (actual[key] !== expected[key])
      throw new Error(
        JSON.stringify({
          sequence: row.sequence,
          input: row.input,
          key,
          expected: expected[key],
          actual: actual[key],
        }),
      );
  }
  if (JSON.stringify(actual.hand) !== JSON.stringify(expected.hand.map((card) => card.instanceId)))
    throw new Error('操作後の手札が一致しません: ' + row.sequence);
  if (actual.error) throw new Error(actual.error);
}
