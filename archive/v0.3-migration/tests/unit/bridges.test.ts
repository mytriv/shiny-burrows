import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { sandbox } from '../fixtures/sandbox';
import { IDLE } from '../../src/core/model';
import { type GameState } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { buyBridge, placeBridge } from '../../src/core/bridges';
import { dig } from '../../src/core/mining';
const bank = () => ({ ...stepGame(createState({ ...sandbox, spawn: { x: 240, y: 160 } }), IDLE).state, wallet: 10, bridgeInventory: 1 });
it('mining the bank cannot use stale grounded flag to buy an unsupported bridge', () => { const s = bank(); const tiles = s.tiles.map((t, i) => i === 5 * 22 + 7 ? { kind: 'soil' as const } : t); const mined = dig({ ...s, tiles }, { ...IDLE, digDirection: 'down' }).state; expect(mined.player.grounded).toBe(true); const attempted = placeBridge(mined, IDLE); expect(attempted.state).toBe(mined); expect(attempted.events).toContainEqual({ type: 'ActionRejected', reason: 'notGrounded' }); });
it('[P-BRIDGE-01] buy charges five for one kit; construction consumes it once without charging again', () => { const s = { ...bank(), bridgeInventory: 0 }; const purchase = buyBridge(s); expect(purchase.state.wallet).toBe(5); expect(purchase.state.bridgeInventory).toBe(1); expect(purchase.state.player.energy).toBe(30); const r = placeBridge(purchase.state, IDLE); expect(r.state.wallet).toBe(5); expect(r.state.spentCoins).toBe(5); expect(r.state.bridgeInventory).toBe(0); expect(r.state.bridges).toEqual([{ x: 8, y: 5 }]); expect(r.state.player.energy).toBe(29); expect(placeBridge(r.state, IDLE).state).toBe(r.state); let crossed = r.state; for (let i = 0; i < 50; i++) crossed = stepGame(crossed, { ...IDLE, moveX: 1 }).state; expect(crossed.player.position.y).toBe(160); expect(crossed.player.position.x).toBeCloseTo(320); });
it.each(['poor', 'remote', 'occupied', 'airborne', 'energy', 'overlap'] as const)('[P-BRIDGE-02] invalid %s placement is free', scenario => { let s = bank(); let targetCell = { x: 8, y: 5 }; if (scenario === 'poor') s = { ...s, bridgeInventory: 0 }; if (scenario === 'remote') targetCell = { x: 10, y: 5 }; if (scenario === 'occupied') targetCell = { x: 6, y: 5 }; if (scenario === 'airborne') s = { ...s, player: { ...s.player, grounded: false } }; if (scenario === 'energy') s = { ...s, player: { ...s.player, energy: 0 } }; if (scenario === 'overlap') s = { ...s, player: { ...s.player, position: { x: 250, y: 170 } } }; const r = placeBridge(s, { ...IDLE, targetCell }); expect(r.state).toBe(s); expect(r.events[0]?.type).toBe('ActionRejected'); });
it('bridge is a one-way top: pass underneath/upward, land from above', () => { let s: GameState = { ...bank(), bridges: [{ x: 8, y: 5 }] }; s = { ...s, player: { ...s.player, position: { x: 272, y: 190 }, velocity: { x: 0, y: -200 }, grounded: false } }; let top = 190; for (let i = 0; i < 80; i++) { s = stepGame(s, IDLE).state; top = Math.min(top, s.player.position.y); } expect(top).toBeLessThan(160); expect(s.player.position.y).toBe(160); });



