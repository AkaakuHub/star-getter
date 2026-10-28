import type { Locator, Page } from 'playwright-core';
import type { GameSetup } from '../../../src/app/setup/gameSetup.ts';

async function click(page: Page, button: Locator): Promise<void> {
  const point = await button.evaluate((element) => {
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
}

export async function configureDeck(page: Page, setup: GameSetup): Promise<void> {
  await click(page, page.getByRole('button', { name: '編成する', exact: true }));
  const remove = page.getByRole('button', { name: /を外す$/ });
  while ((await remove.count()) > 0) await click(page, remove.first());
  for (const id of setup.cardDatasIds)
    await click(page, page.locator(`[data-card-id="${id}"][aria-pressed]`));
  await click(page, page.getByRole('button', { name: '戻る', exact: true }));
}
