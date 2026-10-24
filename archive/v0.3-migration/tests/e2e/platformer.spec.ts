import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { IDLE, type GameState } from '../../src/core/model';
import { firstBurrow } from '../../src/content/levels/first-burrow';
import { stepGame } from '../../src/core/simulation';
test.setTimeout(90000);
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; failures.set(page, errors);
  page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4187/')) errors.push(`External: ${r.url()}`); });
});
test.afterEach(async ({ page }) => { expect(failures.get(page)).toEqual([]); });
async function state(page: Page): Promise<GameState & { paused: boolean }> { return JSON.parse(await page.locator('canvas').getAttribute('data-state') ?? '{}') as GameState & { paused: boolean }; }
async function view(page: Page): Promise<{ x: number; y: number; zoom: number; width: number; height: number }> { return JSON.parse(await page.locator('canvas').getAttribute('data-view') ?? '{}') as { x: number; y: number; zoom: number; width: number; height: number }; }
async function boot(page: Page) { await page.goto('/'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true); }
async function center(page: Page, name: string) { const b = await page.getByRole('button', { name, exact: true }).boundingBox(); if (!b) throw new Error(name); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
class Touch {
  private points = new Map<number, { id: number; x: number; y: number }>();
  constructor(private cdp: CDPSession, private page: Page) {}
  async down(id: number, name: string) { this.points.set(id, { id, ...await center(this.page, name) }); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: Array.from(this.points.values()) }); }
  async up(id: number) { const p = this.points.get(id); this.points.delete(id); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: p ? [p] : [] }); }
  async tap(name: string) { await this.down(9, name); await this.up(9); }
  async cancel() { this.points.clear(); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); }
}
type Action = 'dig' | 'buy' | 'place' | 'claws' | 'bridge' | 'down' | 'jump';
class Driver {
  constructor(readonly page: Page, readonly mode: 'keyboard' | 'mouse' | 'touch' = 'keyboard', readonly touch?: Touch) {}
  async action(action: Action) {
    if (this.mode === 'keyboard') { await this.page.keyboard.press({ dig: 'j', buy: 'b', place: 'e', claws: '1', bridge: '2', down: 'k', jump: 'Space' }[action]); return; }
    const name = { dig: 'Dig', buy: 'Buy bridge kit for 5 coins', place: 'Place', claws: 'Claws', bridge: 'Bridge', down: 'Aim ↓', jump: 'Jump' }[action];
    if (this.touch) await this.touch.tap(name); else await this.page.getByRole('button', { name, exact: true }).click();
  }
  async walk(x: number, left = false) {
    const name = left ? 'Move left' : 'Move right', key = left ? 'a' : 'd';
    if (this.mode === 'keyboard') await this.page.keyboard.down(key);
    else if (this.touch) await this.touch.down(1, name);
    else { const p = await center(this.page, name); await this.page.mouse.move(p.x, p.y); await this.page.mouse.down(); }
    await expect.poll(async () => { const p = (await state(this.page)).player.position.x; return left ? p <= x : p >= x; }, { intervals: [16], timeout: 15000 }).toBe(true);
    if (this.mode === 'keyboard') await this.page.keyboard.up(key); else if (this.touch) await this.touch.up(1); else await this.page.mouse.up();
  }
  async mine() { const energy = (await state(this.page)).player.energy; await this.action('dig'); await expect.poll(async () => (await state(this.page)).player.energy).toBe(energy - 1); }
  async down() { const y = (await state(this.page)).player.position.y; await this.action('down'); await this.mine(); await expect.poll(async () => { const s = await state(this.page); return s.player.grounded && s.player.position.y > y; }, { intervals: [30] }).toBe(true); }
}
async function paid(d: Driver) {
  const page = d.page;
  await d.mine(); expect((await state(page)).goldCollectedValue).toBe(10);
  for (let i = 1; i <= 2; i++) { await d.action('buy'); await expect.poll(async () => (await state(page)).bridgeInventory).toBe(i); }
  await d.walk(238); await d.action('bridge'); await expect(page.locator('#tool-status')).toContainText('Ready');
  await d.action('place'); await expect.poll(async () => (await state(page)).bridges.length).toBe(1);
  await d.walk(270); await d.action('place'); await expect.poll(async () => (await state(page)).bridges.length).toBe(2);
  expect((await state(page)).spentCoins).toBe(10); expect((await state(page)).wallet).toBe(0);
  await d.walk(566); await d.action('claws'); await d.mine(); expect((await state(page)).goldCollectedValue).toBe(16);
  await d.walk(655); for (let row = 5; row <= 14; row++) await d.down();
  expect((await view(page)).y).toBeGreaterThan(100); await d.walk(662); await d.mine(); await d.walk(695);
  await expect.poll(async () => (await state(page)).status).toBe('won');
  expect((await state(page)).wallet).toBe(6); expect((await state(page)).bridgeInventory).toBe(0); await expect(page.locator('#feedback')).toContainText('COMPLETE!');
}
async function shaft(d: Driver, lastRow = 12) { await d.mine(); await d.walk(175); for (let row = 5; row <= lastRow; row++) await d.down(); }
for (const [width, height, label] of [[390, 844, 'portrait'], [844, 390, 'landscape'], [1920, 1080, 'desktop']] as const) {
  test(`layout ${label}: dense mine, controls, bounded camera and jump`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await boot(page); await page.screenshot({ path: `test-results/${label}.png` });
    const canvas = await page.locator('canvas').boundingBox(), header = await page.locator('header').boundingBox(), footer = await page.locator('footer').boundingBox();
    if (!canvas || !header || !footer) throw new Error('Missing layout');
    expect(canvas.width).toBeLessThanOrEqual(1100); expect(canvas.height).toBeGreaterThan(150); expect(canvas.y).toBeGreaterThanOrEqual(header.y + header.height - 1); expect(canvas.y + canvas.height).toBeLessThanOrEqual(footer.y + 1);
    for (const b of await page.locator('button').all()) { const box = await b.boundingBox(); expect(box?.height).toBeGreaterThanOrEqual(44); expect(box?.width).toBeGreaterThanOrEqual(44); }
    const v = await view(page); expect(v.x).toBeGreaterThanOrEqual(0); expect(v.y).toBeGreaterThanOrEqual(0); expect(v.x + v.width).toBeLessThanOrEqual(768.001); expect(v.y + v.height).toBeLessThanOrEqual(640.001); expect(v.zoom * 32).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155); await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
    await page.keyboard.down('d'); await page.waitForTimeout(350); await page.keyboard.up('d'); expect((await state(page)).player.position.x).toBe(86);
  });
}
test('desktop keyboard: paid two-bridge route mines upper vein and descends to win', async ({ page }) => { await page.setViewportSize({ width: 1920, height: 1080 }); await boot(page); await paid(new Driver(page)); });
test('landscape keyboard: free route excavates the deep vein and wins without purchases', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 }); await boot(page); const d = new Driver(page); await shaft(d);
  for (const x of [6, 7, 8, 9, 13, 14, 15]) { await d.walk(x * 32 - 10); await d.mine(); }
  expect((await state(page)).goldCollectedValue).toBe(19); await page.screenshot({ path: 'test-results/mining-landscape.png' });
  await d.walk(591); await d.down(); await d.down(); for (const x of [19, 21]) { await d.walk(x * 32 - 10); await d.mine(); } await d.walk(695);
  await expect.poll(async () => (await state(page)).status).toBe('won'); expect((await state(page)).spentCoins).toBe(0); expect((await state(page)).wallet).toBe(19);
});
test('rock puzzle: crush and restart, then safely break fragile and discover the secret', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page); let d = new Driver(page); await shaft(d, 11);
  await page.keyboard.down('a'); await page.waitForTimeout(50); await page.keyboard.up('a'); await d.mine();
  await page.keyboard.down('a'); await expect.poll(async () => (await state(page)).status).toBe('failed'); await page.keyboard.up('a'); await expect(page.locator('#feedback')).toContainText('Try again');
  await page.keyboard.press('r'); await expect.poll(async () => (await state(page)).player.position.x).toBe(80); expect((await state(page)).wallet).toBe(0); expect((await state(page)).player.energy).toBe(60);
  d = new Driver(page); await shaft(d, 11); await page.keyboard.down('a'); await page.waitForTimeout(50); await page.keyboard.up('a'); await d.mine();
  await expect.poll(async () => (await state(page)).boulders[0]?.position.y).toBe(384); await page.screenshot({ path: 'test-results/rock-puzzle.png' });
  await page.keyboard.down('a'); await expect.poll(async () => (await state(page)).discoveredSecrets.length, { intervals: [30] }).toBe(1); await page.keyboard.up('a'); expect((await state(page)).wallet).toBe(13); expect((await state(page)).status).toBe('playing');
});
test('portrait touch: simultaneous motion/actions, full paid win and cancel/blur recovery', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page); const touch = new Touch(await context.newCDPSession(page), page);
  await touch.down(1, 'Move right'); await touch.tap('Jump'); await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155); await touch.up(1); await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
  await paid(new Driver(page, 'touch', touch)); await page.getByRole('button', { name: 'Restart', exact: true }).tap();
  await touch.down(1, 'Move left'); await page.waitForTimeout(100); await touch.cancel(); await page.waitForTimeout(100); const stopped = await state(page); await page.waitForTimeout(100); expect((await state(page)).player.position.x).toBe(stopped.player.position.x);
  await touch.down(1, 'Move right'); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect.poll(async () => (await state(page)).paused).toBe(true); const before = await state(page); await page.waitForTimeout(100); expect((await state(page)).tick).toBe(before.tick); await touch.cancel(); await page.getByRole('button', { name: 'Pause', exact: true }).tap(); await page.waitForTimeout(100); expect((await state(page)).player.position.x).toBe(before.player.position.x);
});
test('mouse-only paid route completes with separate Buy and Place actions', async ({ page }) => { await page.setViewportSize({ width: 844, height: 390 }); await boot(page); await paid(new Driver(page, 'mouse')); });
test('camera descent pointer mapping targets the actual mined block after scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page); const d = new Driver(page); await shaft(d, 8); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const v = await view(page), box = await page.locator('canvas').boundingBox(); if (!box) throw new Error('Canvas'); expect(v.y).toBeGreaterThan(0);
  await page.mouse.click(box.x + (176 - v.x) * v.zoom, box.y + (9 * 32 + 16 - v.y) * v.zoom);
  await expect.poll(async () => JSON.parse(await page.locator('canvas').getAttribute('data-target') ?? '{}').cell).toEqual({ x: 5, y: 9 });
  await page.keyboard.press('Escape'); await d.mine(); await expect.poll(async () => (await state(page)).player.position.y).toBeGreaterThan(288); await page.screenshot({ path: 'test-results/mining-portrait.png' });
});
test('airborne resize preserves fixed-tick physics and camera remains bounded', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await boot(page); await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).player.position.y).toBeLessThan(155);
  const before = await state(page); await page.setViewportSize({ width: 844, height: 390 }); const after = await state(page);
  let expected: GameState = { ...before, level: firstBurrow, tiles: firstBurrow.tiles }; for (let tick = before.tick; tick < after.tick; tick++) expected = stepGame(expected, IDLE).state;
  expect(after.player.position.x).toBeCloseTo(expected.player.position.x, 7); expect(after.player.position.y).toBeCloseTo(expected.player.position.y, 7); expect(after.paused).toBe(false);
});
