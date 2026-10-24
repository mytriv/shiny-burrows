import { route } from '../levels/v3-routes';
import { test, expect, type Page, type CDPSession } from '@playwright/test';
import type { GameState } from '../../src/core/model';
test.setTimeout(150000);
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => { const errors: string[] = []; failures.set(page, errors); page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if (e.type() === 'error')
    errors.push(e.text()); }); page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4187/'))
    errors.push('External: ' + r.url()); }); });
test.afterEach(async ({ page }) => expect(failures.get(page)).toEqual([]));
async function state(page: Page): Promise<GameState & {
    paused: boolean;
}> { return JSON.parse(await page.locator('canvas').getAttribute('data-state') ?? '{}') as GameState & {
    paused: boolean;
}; }
async function boot(page: Page) { await page.goto('/'); await expect.poll(async () => (await state(page)).player?.grounded).toBe(true); }
async function center(page: Page, name: string) { const b = await page.getByRole('button', { name, exact: true }).boundingBox(); if (!b)
    throw new Error(name); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
class Touch {
    private points = new Map<number, {
        id: number;
        x: number;
        y: number;
    }>();
    constructor(private cdp: CDPSession, private page: Page) { }
    async down(id: number, name: string) { this.points.set(id, { id, ...await center(this.page, name) }); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [...this.points.values()] }); }
    async up(id: number) { const p = this.points.get(id); this.points.delete(id); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: p ? [p] : [] }); }
    async tap(name: string) { await this.down(9, name); await this.up(9); }
    async cancel() { this.points.clear(); await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); }
}
test('V3-B keyboard excavates three layers and climbs its automatic ladder', async ({ page }) => {
    await boot(page);
    await expect(page.getByRole('button', { name: 'Jump', exact: true })).toHaveCount(0);
    await page.keyboard.down('s');

    await expect.poll(async () => (await state(page)).player.position.y, { intervals: [16], timeout:10000 }).toBeGreaterThanOrEqual(224);

    await page.keyboard.up('s');
    const s = await state(page);
    expect(s.ladders).toEqual(expect.arrayContaining([4,5,6].map(y=>({x:2,y}))));expect(s.ladders.every(c=>c.y>=4)).toBe(true);
    await page.keyboard.down('w');
    await expect.poll(async () => (await state(page)).player.position.y, { timeout: 10000 }).toBe(128);
    await page.keyboard.up('w');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const tick = (await state(page)).tick;
    await page.waitForTimeout(300);
    expect((await state(page)).tick).toBe(tick);
    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect.poll(async () => (await state(page)).ladders.length).toBe(0);
});
test('V3-B real mobile directional input digs down then climbs; cancel releases holds', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await boot(page);
    const t = new Touch(await context.newCDPSession(page), page);
    await t.down(1, 'Climb down or drop');
    await expect.poll(async () => (await state(page)).player.position.y, { intervals: [16] }).toBeGreaterThanOrEqual(224);
    await t.cancel();
    await t.down(3, 'Climb up');
    await expect.poll(async () => (await state(page)).player.position.y, { timeout: 10000 }).toBe(128);
    await t.up(3);
    const y = (await state(page)).player.position.y;
    expect(y).toBe(128); // Released acquired ladder grip remains stationary at the bank.
    await page.getByRole('button', { name: 'Restart', exact: true }).tap();
    await expect.poll(async () => (await state(page)).ladders.length).toBe(0);
});
async function playLevel(page: Page, index: number, paid = false) {
    for (const action of route(index, paid)) {
        if (action.kind === 'buy' || action.kind === 'place') {
            await page.keyboard.press(action.kind === 'buy' ? 'b' : 'e');
            await expect.poll(async () => action.kind === 'buy' ? (await state(page)).inventory.platforms : (await state(page)).platforms.length).toBe(1);
            continue;
        }
        if ((await state(page)).status === 'won')
            break;
        if (action.kind === 'walk') {
            const left = (await state(page)).player.position.x > action.value, key = left ? 'a' : 'd';
            await page.keyboard.down(key);
            await expect.poll(async () => { const s = await state(page); return s.status === 'won' || (left ? s.player.position.x <= action.value + 2 : s.player.position.x >= action.value - 2); }, { intervals: [16], timeout: 15000 }).toBe(true);
            await page.keyboard.up(key);
        }
        else {
            await page.keyboard.down('s');

            await expect.poll(async () => { const s = await state(page); return s.player.position.y >= action.value - .1 && s.player.grounded; }, { intervals: [16], timeout: 15000 }).toBe(true);

            await page.keyboard.up('s');
        }
    }
    await expect.poll(async () => (await state(page)).status).toBe('won');
}
test('V3-D three real levels, surface upgrades, restart economy and completion', async ({ page }) => {
    await boot(page);
    await playLevel(page, 0);
    await expect(page.locator('#station')).toBeVisible();
    const wallet = (await state(page)).wallet;
    await page.locator('#upgrade').click();
    await expect(page.locator('#station-stats')).toContainText('Coins ' + (wallet - 8));
    await page.locator('#next').click();
    await expect.poll(async () => (await state(page)).pickaxePower).toBe(2);
    await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
    await page.keyboard.down('d');
    await expect.poll(async () => (await state(page)).levelGoldCollected).toBeGreaterThan(0);
    await page.keyboard.up('d');

    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect.poll(async () => (await state(page)).wallet).toBe(wallet - 8);
    await expect(page.locator('#feedback')).not.toContainText('+14 gold');
    await page.screenshot({ path: 'test-results/v3-amber-hollow.png' });
    await playLevel(page, 1);
    await page.locator('#upgrade').click();
    await page.locator('#next').click();
    await expect.poll(async () => (await state(page)).pickaxePower).toBe(3);
    await expect.poll(async () => (await state(page)).player.grounded).toBe(true);
    await page.screenshot({ path: 'test-results/v3-golden-depths.png' });
    await playLevel(page, 2);
    await expect(page.locator('#station-title')).toContainText('Three lovely burrows complete');
    await expect(page.locator('#next')).toBeHidden();
    await page.locator('#new-adventure').click();
    await expect.poll(async () => (await state(page)).wallet).toBe(0);
});
test('V3-C actual paid platform route buys, places and completes', async ({ page }) => { await boot(page); await playLevel(page, 0, true); expect((await state(page)).spentCoins).toBe(5); expect((await state(page)).platforms).toHaveLength(1); });
for (const [width, height] of [[390, 844], [844, 390], [1920, 1080]])
    test('V3-E layout and touch platform/drop at ' + width + 'x' + height, async ({ page, context }, info) => {
        test.setTimeout(20000);
        await page.setViewportSize({ width: width ?? 390, height: height ?? 844 });
        await boot(page);
        const t = new Touch(await context.newCDPSession(page), page);
        await page.keyboard.down('d');
        await expect.poll(async () => (await state(page)).player.position.x, { intervals: [16] }).toBeGreaterThanOrEqual(142);

        await page.keyboard.up('d');
        await t.tap('Buy ▰ 5');
        await expect.poll(async () => (await state(page)).inventory.platforms).toBe(1);
        await t.tap('Platform');
        await expect.poll(async () => (await state(page)).platforms.length).toBe(1);
        await t.down(1, 'Move right');
        await expect.poll(async () => (await state(page)).player.position.x, { intervals: [16] }).toBeGreaterThanOrEqual(173);
        await t.up(1);
        // Keep the full collider over the one-tile gap. Renderer/driver latency can
        // otherwise leave a foot on the adjoining solid bank, which must not drop.
        for(let attempt=0;attempt<12;attempt++){
            const x=(await state(page)).player.position.x;
            if(x>=171&&x<=181)break;
            await t.down(1,x>181?'Move left':'Move right');await page.waitForTimeout(20);await t.up(1);
        }
        const centered=(await state(page)).player.position.x;
        expect(centered).toBeGreaterThanOrEqual(170);expect(centered).toBeLessThanOrEqual(182);
        await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-input')??'{}').moveX as number).toBe(0);
        expect((await state(page)).player.position.y).toBe(128);
        await t.tap('Climb down or drop');
        await expect.poll(async () => (await state(page)).player.position.y, { intervals: [16] }).toBe(288);
        expect((await state(page)).ignoredPlatforms).toEqual([]);
        await t.down(1, 'Climb down or drop');
        await expect.poll(async () => (await state(page)).player.position.y, { intervals: [16] }).toBeGreaterThanOrEqual(384);
        await t.cancel();
        await t.down(3, 'Climb up');
        await expect.poll(async () => (await state(page)).player.position.y, { timeout: 10000 }).toBe(128);
        await t.up(3);
        await page.getByRole('button', { name: 'Pause', exact: true }).tap();
        await page.screenshot({ path: info.outputPath('v3-' + width + 'x' + height + '.png') });
        const rects = await page.locator('button[data-action]').evaluateAll(buttons => buttons.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
        for (const r of rects) {
            expect(r.w).toBeGreaterThanOrEqual(44);
            expect(r.h).toBeGreaterThanOrEqual(44);
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.y + r.h).toBeLessThanOrEqual(height ?? 844);
        }
        const box = await page.locator('canvas').boundingBox();
        if (!box)
            throw new Error('canvas');
        expect(box.height).toBeGreaterThan(150);
        expect(await page.locator('body').evaluate(e => e.scrollWidth)).toBeLessThanOrEqual(width ?? 390);
    });
test('V3-E mouse Down auto-mining and real damaged-block regeneration', async ({ page }) => {
    await boot(page);
    const at = await center(page, 'Climb down or drop');
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await expect.poll(async () => (await state(page)).ladders.length, { intervals: [16] }).toBeGreaterThanOrEqual(4);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    // Every soil cell now exposes damage before its second hit.
    await page.keyboard.down('s');

    await expect.poll(async () => JSON.parse(await page.locator('canvas').getAttribute('data-damage') ?? '[]').length as number, { intervals: [10], timeout: 10000 }).toBeGreaterThan(0);

    await page.keyboard.up('s');
    const damaged = await page.locator('canvas').getAttribute('data-damage');
    expect(damaged).not.toBe('[]');
    await expect.poll(async () => await page.locator('canvas').getAttribute('data-damage'), { timeout: 6000 }).toBe('[]');
});
