import { test, expect } from '@playwright/test';
test('boots, keyboard wins, undo and restart restore state, resize preserves state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label', /playing, treasure 0, steps 0/);
  for (let i = 1; i <= 7; i++) {
    await page.keyboard.press('ArrowRight');
    await expect(canvas).toHaveAttribute('aria-label', new RegExp(`steps ${i}$`));
    await page.waitForTimeout(160);
  }
  await expect(canvas).toHaveAttribute('aria-label', /won, treasure 4, steps 7/);
  await page.keyboard.press('z');
  await expect(canvas).toHaveAttribute('aria-label', /playing, treasure 4, steps 6/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute('aria-label', /steps 6/);
  await page.screenshot({ path: 'test-results/portrait.png' });
  await page.keyboard.press('r');
  await expect(canvas).toHaveAttribute('aria-label', /treasure 0, steps 0/);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(canvas).toBeVisible();
  await page.screenshot({ path: 'test-results/landscape.png' });
  expect(errors).toEqual([]);
});
test('touch directional button matches keyboard action', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label', /steps 0/);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas missing');
  await page.touchscreen.tap(box.x + box.width * 340 / 520, box.y + box.height * 700 / 800);
  await expect(canvas).toHaveAttribute('aria-label', /playing, treasure 0, steps 1/);
  await context.close();
});
test('built assets stay local; mouse pause blocks moves and resumes', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4187')) external.push(request.url()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label', /steps 0/);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas missing');
  await page.mouse.click(box.x + box.width * 390 / 520, box.y + box.height * 575 / 800);
  await expect(canvas).toHaveAttribute('aria-label', /paused/);
  await page.keyboard.press('ArrowRight');
  await expect(canvas).toHaveAttribute('aria-label', /steps 0, paused/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowRight');
  await expect(canvas).toHaveAttribute('aria-label', /steps 1$/);
  expect(external).toEqual([]);
});

