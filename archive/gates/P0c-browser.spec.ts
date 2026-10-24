import { test, expect, type Page } from '@playwright/test';
import { type GameState } from '../../src/core/model';
async function state(page: Page) { return JSON.parse(await page.locator('canvas').getAttribute('data-state') ?? '{}') as GameState & { paused: boolean }; }
for (const [width, height] of [[390, 844], [844, 390], [1920, 1080]] as const) {
  test(`P0a motion sandbox ${width}x${height}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height }); await page.goto('/?motion');
    await expect.poll(async () => (await state(page)).player?.grounded).toBe(true);
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155);
    await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
    await page.keyboard.down('d');
    await expect.poll(async () => (await state(page)).player.position.x).toBeGreaterThan(268);
    await page.keyboard.up('d');
    await expect.poll(async () => (await state(page)).player.position.y).toBeGreaterThan(200);
    await page.screenshot({ path: `test-results/p0a-${width}x${height}.png` });
    await page.keyboard.press('r');
    await expect.poll(async () => (await state(page)).player.position.x).toBe(80);
    expect(errors).toEqual([]);
  });
}
test('P0b floor excavation visibly falls and ore pays once', async ({ page }) => {
  await page.goto('/?excavation'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true);
  await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Gold 5/5');
  await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Wallet 5');
  await page.keyboard.press('k'); await page.waitForTimeout(180); await page.keyboard.press('j');
  await expect.poll(async () => (await state(page)).player.position.y).toBeGreaterThan(200);
  await expect(page.locator('#stats')).toContainText('Secret yes');
});
async function walk(page: Page, x: number) {
  await page.keyboard.down('d');
  await expect.poll(async () => (await state(page)).player.position.x, { intervals: [16], timeout: 12000 }).toBeGreaterThanOrEqual(x);
  await page.keyboard.up('d');
}
test('P0c First Burrow: two separately bought one-cell bridges win', async ({ page }) => {
  await page.goto('/'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true);
  await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Wallet 10');
  await walk(page, 238); await page.keyboard.press('2');
  await expect(page.locator('#tool-status')).toContainText('ready'); await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).bridges.length).toBe(1);
  await walk(page, 270); await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).bridges.length).toBe(2);
  await page.keyboard.down('d'); await expect.poll(async () => (await state(page)).status, { timeout: 12000, intervals: [50] }).toBe('won'); await page.keyboard.up('d');
  expect((await state(page)).wallet).toBe(0); expect((await state(page)).goldCollectedValue).toBe(10);
});
test('P0c First Burrow: free excavation and jump route wins without spending', async ({ page }) => {
  await page.goto('/'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true);
  await page.keyboard.press('j'); await walk(page, 175); await page.keyboard.press('k'); await page.keyboard.press('j');
  await expect.poll(async () => (await state(page)).player.position.y).toBe(288);
  for (const x of [6, 7, 8]) { await walk(page, x * 32 - 10); await page.keyboard.press('j'); }
  await walk(page, 374); await page.keyboard.down('d'); await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).status, { timeout: 12000, intervals: [50] }).toBe('won'); await page.keyboard.up('d');
  expect((await state(page)).spentCoins).toBe(0); expect((await state(page)).wallet).toBe(10);
});
