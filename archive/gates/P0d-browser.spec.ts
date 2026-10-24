import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { type GameState } from '../../src/core/model';
import { IDLE } from '../../src/core/model';
import { firstBurrow } from '../../src/content/levels/first-burrow';
import { stepGame } from '../../src/core/simulation';
test.setTimeout(60000);
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; failures.set(page, errors);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4187/')) errors.push(`External request: ${r.url()}`); });
});
test.afterEach(async ({ page }) => { expect(failures.get(page)).toEqual([]); });
async function state(page: Page): Promise<GameState & { paused: boolean }> { return JSON.parse(await page.locator('canvas').getAttribute('data-state') ?? '{}') as GameState & { paused: boolean }; }
async function boot(page: Page) { await page.goto('/'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true); }
async function walk(page: Page, x: number, key = 'd') {
  await page.keyboard.down(key);
  await expect.poll(async () => { const value = (await state(page)).player.position.x; return key === 'd' ? value >= x : value <= x; }, { intervals: [16], timeout: 12000 }).toBe(true);
  await page.keyboard.up(key);
}
async function descend(page: Page) {
  await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Wallet 10');
  await walk(page, 175); await page.keyboard.press('k'); await page.keyboard.press('j');
  await expect.poll(async () => (await state(page)).player.position.y).toBe(288);
}
for (const [width, height, label] of [[390, 844, 'portrait'], [844, 390, 'landscape'], [1920, 1080, 'desktop']] as const) {
  test(`layout ${label}: physical jump, wall and screenshots`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await boot(page);
    await page.screenshot({ path: `test-results/${label}.png` });
    const canvas = await page.locator('canvas').boundingBox();
    const header = await page.locator('header').boundingBox(), footer = await page.locator('footer').boundingBox();
    expect(canvas && header && footer).toBeTruthy();
    if (!canvas || !header || !footer) throw new Error('Missing layout');
    expect(canvas.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(footer.y + 1);
    expect(canvas.height).toBeGreaterThan(150);
    for (const button of await page.locator('button').all()) { const box = await button.boundingBox(); expect(box?.height).toBeGreaterThanOrEqual(44); expect(box?.width).toBeGreaterThanOrEqual(44); }
    await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155);
    await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
    await page.keyboard.down('d'); await page.waitForTimeout(450); await page.keyboard.up('d');
    expect((await state(page)).player.position.x).toBe(86); // Solid ore wall, not grid teleportation.
  });
}
test('keyboard: paid route buys two one-cell bridges and physically drops to exit', async ({ page }) => {
  await boot(page); await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Wallet 10');
  await page.keyboard.press('j'); await expect(page.locator('#stats')).toContainText('Wallet 10');
  await walk(page, 238); await page.keyboard.press('2');
  await expect(page.locator('#tool-status')).toContainText('ready'); await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).bridges.length).toBe(1);
  await page.keyboard.press('e'); await expect.poll(async () => (await state(page)).wallet).toBe(5);
  await walk(page, 270); await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).bridges.length).toBe(2);
  await page.keyboard.down('d'); await expect.poll(async () => (await state(page)).status, { timeout: 12000, intervals: [50] }).toBe('won'); await page.keyboard.up('d');
  const won = await state(page); expect(won.wallet).toBe(0); expect(won.goldCollectedValue).toBe(10); expect(won.spentCoins).toBe(10); expect(won.player.position.y).toBeGreaterThan(256);
  await expect(page.locator('#feedback')).toContainText('COMPLETE!');
});
test('keyboard: free route digs floor, falls, mines tunnel and jumps stone to win', async ({ page }) => {
  await boot(page); await descend(page);
  for (const x of [6, 7, 8]) { await walk(page, x * 32 - 10); await page.keyboard.press('j'); }
  await walk(page, 374); await page.keyboard.down('d'); await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(270);
  await expect.poll(async () => (await state(page)).status, { timeout: 12000, intervals: [50] }).toBe('won'); await page.keyboard.up('d');
  expect((await state(page)).spentCoins).toBe(0); expect((await state(page)).wallet).toBe(13);
});
test('boulder crush failure, restart, safe release and optional secret', async ({ page }) => {
  await boot(page); await descend(page);
  await page.keyboard.down('a'); await page.waitForTimeout(50); await page.keyboard.up('a'); await page.keyboard.press('j');
  await expect.poll(async () => (await state(page)).boulders[0]?.falling).toBe(true);
  await page.keyboard.down('a'); await expect.poll(async () => (await state(page)).status).toBe('failed'); await page.keyboard.up('a');
  await expect(page.locator('#feedback')).toContainText('Try again');
  await page.keyboard.press('r'); await expect.poll(async () => (await state(page)).player.position.x).toBe(80);
  expect((await state(page)).wallet).toBe(0); expect((await state(page)).player.energy).toBe(30); expect((await state(page)).boulders[0]?.position.y).toBe(224);
  await descend(page); await page.keyboard.down('a'); await page.waitForTimeout(50); await page.keyboard.up('a'); await page.keyboard.press('j');
  await expect.poll(async () => (await state(page)).boulders[0]?.position.y).toBe(256);
  await page.keyboard.down('a'); await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).discoveredSecrets.length, { intervals: [30] }).toBe(1); await page.keyboard.up('a');
  expect((await state(page)).wallet).toBe(13); expect((await state(page)).status).toBe('playing');
});
test('resize during airborne motion preserves the exact tick simulation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page); await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155);
  const before = await state(page);
  await page.setViewportSize({ width: 844, height: 390 });
  const after = await state(page);
  let expected: GameState = { ...before, level: firstBurrow, tiles: firstBurrow.tiles };
  for (let tick = before.tick; tick < after.tick; tick++) expected = stepGame(expected, IDLE).state;
  expect(after.player.position.x).toBeCloseTo(expected.player.position.x, 7);
  expect(after.player.position.y).toBeCloseTo(expected.player.position.y, 7);
  expect(after.paused).toBe(false);
});
async function center(page: Page, name: string) { const b = await page.getByRole('button', { name, exact: true }).boundingBox(); if (!b) throw new Error(name); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
test('mouse-only controls complete the paid route with explicit confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 }); await boot(page);
  await page.getByRole('button', { name: 'Use', exact: true }).click(); await expect(page.locator('#stats')).toContainText('Wallet 10');
  const holdUntil = async (predicate: (s: GameState) => boolean) => { const b = await center(page, 'Move right'); await page.mouse.move(b.x, b.y); await page.mouse.down(); await expect.poll(async () => predicate(await state(page)), { intervals: [16], timeout: 12000 }).toBe(true); await page.mouse.up(); };
  await holdUntil(s => s.player.position.x >= 238); await page.getByRole('button', { name: 'Bridge', exact: true }).click();
  await expect(page.locator('#tool-status')).toContainText('ready'); await page.getByRole('button', { name: 'Use', exact: true }).click();
  await expect.poll(async () => (await state(page)).bridges.length).toBe(1);
  await holdUntil(s => s.player.position.x >= 270); await page.getByRole('button', { name: 'Use', exact: true }).click();
  await expect.poll(async () => (await state(page)).bridges.length).toBe(2);
  await holdUntil(s => s.status === 'won'); expect((await state(page)).spentCoins).toBe(10);
});
class Touch {
  private points = new Map<number, { id: number; x: number; y: number }>();
  constructor(private cdp: CDPSession, private page: Page) {}
  async down(id: number, name: string) { this.points.set(id, { id, ...await center(this.page, name) }); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: Array.from(this.points.values()) }); }
  async up(id: number) { const point = this.points.get(id); this.points.delete(id); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: point ? [point] : [] }); }
  async tap(name: string) { await this.down(9, name); await this.up(9); }
  async cancel() { this.points.clear(); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); }
}
test('touch-only paid playthrough; simultaneous running/actions and cancel/blur release', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page);
  const touch = new Touch(await context.newCDPSession(page), page);
  await touch.down(1, 'Move right'); await touch.tap('Jump');
  await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155);
  await touch.up(1); await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
  await touch.down(1, 'Move right'); await touch.tap('Use');
  await expect(page.locator('#stats')).toContainText('Wallet 10');
  await expect.poll(async () => (await state(page)).player.position.x, { intervals: [16] }).toBeGreaterThanOrEqual(238); await touch.up(1);
  await touch.tap('Bridge'); await touch.tap('Use'); await expect.poll(async () => (await state(page)).bridges.length).toBe(1);
  await touch.down(1, 'Move right'); await expect.poll(async () => (await state(page)).player.position.x, { intervals: [16] }).toBeGreaterThanOrEqual(270); await touch.up(1);
  await touch.tap('Use'); await expect.poll(async () => (await state(page)).bridges.length).toBe(2);
  await touch.down(1, 'Move right'); await expect.poll(async () => (await state(page)).status, { timeout: 12000, intervals: [50] }).toBe('won'); await touch.up(1);
  await page.getByRole('button', { name: 'Restart', exact: true }).tap();
  await touch.down(1, 'Move left'); await page.waitForTimeout(100); await touch.cancel(); await page.waitForTimeout(100);
  const stopped = await state(page); await page.waitForTimeout(150); expect((await state(page)).player.position.x).toBe(stopped.player.position.x);
  await touch.down(1, 'Move right'); await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  const paused = await state(page); await page.waitForTimeout(150); expect((await state(page)).tick).toBe(paused.tick);
  await touch.cancel(); await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  await page.waitForTimeout(150); const resumed = await state(page); expect(resumed.player.position.x).toBe(paused.player.position.x); expect(resumed.tick).toBeGreaterThan(paused.tick);
});
test('pointer/touch selects adjacent terrain and explicit Use mines once', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page);
  const box = await page.locator('canvas').boundingBox(); if (!box) throw new Error('No canvas');
  const view = JSON.parse(await page.locator('canvas').getAttribute('data-view') ?? '{}') as { x: number; y: number; zoom: number };
  await page.mouse.click(box.x + (112 - view.x) * view.zoom, box.y + (144 - view.y) * view.zoom);
  await expect(page.locator('#tool-status')).toContainText('Aim 3,4');
  await page.getByRole('button', { name: 'Use', exact: true }).click(); await expect(page.locator('#stats')).toContainText('Gold 10/10');
  await page.getByRole('button', { name: 'Use', exact: true }).click(); expect((await state(page)).wallet).toBe(10);
});

