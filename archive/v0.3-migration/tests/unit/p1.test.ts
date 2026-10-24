import { expect, it } from 'vitest';
import { boundCamera, cameraConfig, followCamera, screenToWorld } from '../../src/app/camera';
import { createState } from '../../src/core/levels';
import { firstBurrow } from '../../src/content/levels/first-burrow';
import { buyBridge, placeBridge } from '../../src/core/bridges';
import { oreExposed, treasureHint } from '../../src/core/discovery';
import { dig, collectOverlays } from '../../src/core/mining';
import { IDLE } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { sandbox } from '../fixtures/sandbox';
import { GameController } from '../../src/app/GameController';
it.each([[390, 540], [844, 260], [1100, 780], [1, 1]])('camera bounds, safe framing and pointer mapping at %ix%i', (width, height) => {
  const c = cameraConfig(width, height, 768, 640);
  expect(c.viewWidth).toBeLessThanOrEqual(768); expect(c.viewHeight).toBeLessThanOrEqual(640);
  for (const player of [{ x: 10, y: 26 }, { x: 384, y: 340 }, { x: 758, y: 630 }]) {
    const p = followCamera({ x: 0, y: 0 }, player, 1, true, c, 1 / 60, true);
    expect(p.x).toBeGreaterThanOrEqual(0); expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.x + c.viewWidth).toBeLessThanOrEqual(768 + 1e-7); expect(p.y + c.viewHeight).toBeLessThanOrEqual(640 + 1e-7);
    const screen = { x: (player.x - p.x) * c.zoom, y: (player.y - p.y) * c.zoom };
    const world = screenToWorld(screen, p, c); expect(world.x).toBeCloseTo(player.x, 9); expect(world.y).toBeCloseTo(player.y, 9);
  }
  expect(boundCamera({ x: -100, y: -200 }, c)).toEqual({ x: 0, y: 0 });
});
it('descending camera places more visible world below the player and safe-clamps lag', () => { const c = cameraConfig(390, 500, 768, 1000), p = { x: 384, y: 600 }; const idle = followCamera({ x: 0, y: 0 }, p, 1, false, c, 1 / 60, true); const falling = followCamera({ x: 0, y: 0 }, p, 1, true, c, 1 / 60, true); expect(falling.y).toBeGreaterThan(idle.y); const lagged = followCamera({ x: 0, y: 0 }, p, 1, true, c, 1 / 60); expect((p.y - lagged.y) / c.viewHeight).toBeLessThanOrEqual(0.70 + 1e-7); expect(followCamera(idle, p, 1, true, c, 1 / 60)).toEqual(followCamera(idle, p, 1, true, c, 1 / 60)); });
it('hidden ore offers a nearby hint and reveals a face without paying out', () => { const initial = createState(firstBurrow); expect(oreExposed(initial, { x: 8, y: 12 })).toBe(false); expect(treasureHint(initial)).toBe(false); const near = { ...initial, player: { ...initial.player, position: { x: 7 * 32 + 16, y: 12 * 32 } } }; expect(treasureHint(near)).toBe(true); expect(oreExposed(near, { x: 8, y: 12 })).toBe(true); expect(near.wallet).toBe(0); const tiles = initial.tiles.map((t, i) => i === 12 * 24 + 7 ? { kind: 'empty' as const } : t); expect(oreExposed({ ...initial, tiles }, { x: 8, y: 12 })).toBe(true); });
it('buy and build have separate accounting; invalid purchase is free', () => { const state = createState(sandbox); expect(buyBridge(state).state).toBe(state); const funded = { ...state, wallet: 10, player: { ...state.player, energy: 0 } }; const r = buyBridge(funded); expect(r.state.wallet).toBe(5); expect(r.state.spentCoins).toBe(5); expect(r.state.bridgeInventory).toBe(1); expect(r.state.player.energy).toBe(0); expect(r.state.goldCollectedValue).toBe(0); expect(placeBridge(r.state, IDLE).state).toBe(r.state); });
it('a valid kit is not consumed by failed placement, including an empty energy bar', () => { const start = stepGame(createState({ ...sandbox, spawn: { x: 240, y: 160 } }), IDLE).state; const empty = { ...start, bridgeInventory: 2, player: { ...start.player, energy: 0 } }; expect(placeBridge(empty, IDLE).state).toBe(empty); const ready = { ...empty, player: { ...empty.player, energy: 3 } }; const built = placeBridge(ready, IDLE); expect(built.state.bridgeInventory).toBe(1); expect(built.state.wallet).toBe(0); expect(placeBridge(built.state, IDLE).state).toBe(built.state); });
it('extracted value pays both score and wallet once; buying cannot lower score', () => { const initial = createState(firstBurrow); const mined = dig(initial, IDLE).state; const bought = buyBridge(mined).state; expect(bought.goldCollectedValue).toBe(10); expect(bought.wallet).toBe(5); expect(dig(bought, IDLE).state.wallet).toBe(5); expect(initial.tiles[99]?.kind).toBe('ore_soil'); });
it('energy depletion blocks tools, never walking/jumping or a qualified exit', () => { let state = createState(sandbox); state = { ...state, player: { ...state.player, energy: 0 } }; for (let i = 0; i < 120; i++) state = stepGame(state, { ...IDLE, moveX: i < 60 ? 1 : -1, jumpPressed: i === 10 }).state; expect(state.player.energy).toBe(0); expect(state.status).toBe('playing'); const full = createState(firstBurrow); const exit = { ...full, goldCollectedValue: 16, player: { ...full.player, position: { x: 720, y: 512 }, energy: 0 } }; expect(collectOverlays(exit).state.status).toBe('won'); });
it('restart after collecting, purchasing and building resets inventory and all unique source IDs', () => { const c = new GameController(firstBurrow); const initial = c.state; c.state = buyBridge(dig(c.state, IDLE).state).state; c.state = { ...c.state, bridgeInventory: 4, spentCoins: 10, discoveredSecrets: ['secret-nook'] }; c.restart(); expect(c.state).toEqual(initial); expect(dig(c.state, IDLE).state.wallet).toBe(10); });
it('digging flush against a tile edge tolerates subpixel roundoff without digging through an actual overlap', () => { const initial = createState(firstBurrow); const near = { ...initial, player: { ...initial.player, position: { x: 86 + 1e-12, y: 160 } } }; expect(dig(near, IDLE).state.wallet).toBe(10); const bad = { ...initial, player: { ...initial.player, position: { x: 87, y: 160 } } }; expect(dig(bad, IDLE).state).toBe(bad); });
it('buy edges are consumed once even when the app catches up five fixed ticks', () => { const c = new GameController(sandbox); c.state = { ...c.state, wallet: 20 }; c.queue({ ...IDLE, buyBridgePressed: true }); c.advance(0.1); expect(c.state.bridgeInventory).toBe(1); expect(c.state.wallet).toBe(15); });
