import { expect, it } from 'vitest';
import { boundCamera, cameraConfig, followCamera, screenToWorld } from '../../src/app/camera';
it.each([[390, 540], [844, 260], [1100, 780], [1, 1]])('camera bounds, safe framing and pointer mapping at %ix%i', (width, height) => {
    const c = cameraConfig(width, height, 768, 640);
    expect(c.viewWidth).toBeLessThanOrEqual(768);
    expect(c.viewHeight).toBeLessThanOrEqual(640);
    for (const player of [{ x: 10, y: 26 }, { x: 384, y: 340 }, { x: 758, y: 630 }]) {
        const p = followCamera({ x: 0, y: 0 }, player, 1, true, c, 1 / 60, true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + c.viewWidth).toBeLessThanOrEqual(768 + 1e-7);
        expect(p.y + c.viewHeight).toBeLessThanOrEqual(640 + 1e-7);
        const screen = { x: (player.x - p.x) * c.zoom, y: (player.y - p.y) * c.zoom };
        const world = screenToWorld(screen, p, c);
        expect(world.x).toBeCloseTo(player.x, 9);
        expect(world.y).toBeCloseTo(player.y, 9);
    }
    expect(boundCamera({ x: -100, y: -200 }, c)).toEqual({ x: 0, y: 0 });
});
it('descending camera places more visible world below the player and safe-clamps lag', () => { const c = cameraConfig(390, 500, 768, 1000), p = { x: 384, y: 600 }; const idle = followCamera({ x: 0, y: 0 }, p, 1, false, c, 1 / 60, true); const falling = followCamera({ x: 0, y: 0 }, p, 1, true, c, 1 / 60, true); expect(falling.y).toBeGreaterThan(idle.y); const lagged = followCamera({ x: 0, y: 0 }, p, 1, true, c, 1 / 60); expect((p.y - lagged.y) / c.viewHeight).toBeLessThanOrEqual(0.70 + 1e-7); expect(followCamera(idle, p, 1, true, c, 1 / 60)).toEqual(followCamera(idle, p, 1, true, c, 1 / 60)); });
