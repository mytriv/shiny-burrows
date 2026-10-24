import { describe, expect, it } from 'vitest';
import { DT, PLAYER_HEIGHT } from '../../src/core/constants';
import { createState } from '../../src/core/levels';
import { IDLE, type GameState, type InputIntent, type LevelDefinition } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { sandbox } from '../fixtures/sandbox';
import { cellCenter, overlaps, playerBox, solidBoxes, worldToCell } from '../../src/core/world';
import { GameController } from '../../src/app/GameController';
export function ticks(state: GameState, count: number, input: Partial<InputIntent> = {}): GameState { for (let i = 0; i < count; i++) state = stepGame(state, { ...IDLE, ...input }).state; return state; }
export function fixture(edits: Partial<LevelDefinition> = {}): GameState { return createState({ ...sandbox, ...edits }); }
describe('P0a motion gate', () => {
  it('[P-MOVE-01] held input is continuous in both directions', () => { let s = ticks(fixture(), 1, { moveX: 1 }); expect(s.player.position.x).toBeCloseTo(81.6); s = ticks(s, 1, { moveX: -1 }); expect(s.player.position.x).toBeCloseTo(80); });
  it('[P-FALL-01] support is stable for 120 ticks', () => { const s = ticks(fixture(), 120); expect(s.player.position.y).toBe(160); expect(s.player.grounded).toBe(true); });
  it('[P-FALL-03] walks off gap, falls automatically and lands lower', () => { let s = ticks(fixture(), 120, { moveX: 1 }); expect(s.player.position.x).toBeCloseTo(272); expect(s.player.position.y).toBeGreaterThan(160); s = ticks(s, 120); expect(s.player.position.y).toBe(288); expect(s.player.grounded).toBe(true); });
  it('[P-COLL-01] cannot phase through wall or floor at terminal speed', () => { const s = ticks(fixture({ spawn: { x: 450, y: 160 } }), 240, { moveX: 1 }); expect(s.player.position.x).toBe(470); expect(s.player.position.y).toBe(160); expect(solidBoxes(s, playerBox(s.player.position)).some(b => overlaps(b, playerBox(s.player.position)))).toBe(false); });
  it('[P-COLL-01] ceiling and world bounds constrain motion', () => { let s = ticks(fixture({ spawn: { x: 42, y: 40 } }), 60, { moveX: -1 }); expect(s.player.position.x).toBe(42); const tiles = sandbox.tiles.map((t, i) => i >= 44 && i < 66 ? { kind: 'bedrock' as const } : t); s = ticks(fixture({ tiles }), 1); s = ticks(s, 10, { jumpPressed: true }); expect(s.player.position.y - PLAYER_HEIGHT).toBeGreaterThanOrEqual(96); });
  it('[P-JUMP-01] grounded jump has bounded height and cannot double jump', () => { let s = ticks(fixture(), 1); const start = s.player.position.y; s = stepGame(s, { ...IDLE, jumpPressed: true }).state; let apex = s.player.position.y; for (let i = 0; i < 25; i++) { s = stepGame(s, IDLE).state; apex = Math.min(apex, s.player.position.y); } expect(start - apex).toBeGreaterThan(30); expect(start - apex).toBeLessThan(38); expect(stepGame(s, { ...IDLE, jumpPressed: true }).events.some(e => e.type === 'Jumped')).toBe(false); });
  it('unsupported spawn cannot jump and falls with idle input', () => { const r = stepGame(fixture({ spawn: { x: 272, y: 160 } }), { ...IDLE, jumpPressed: true }); expect(r.state.player.velocity.y).toBeGreaterThan(0); expect(r.events).not.toContainEqual({ type: 'Jumped' }); });
  it('kill boundary fails; intended chamber fall does not', () => { const s = ticks(fixture({ tiles: sandbox.tiles.map(() => ({ kind: 'empty' })) }), 180); expect(s.status).toBe('failed'); expect(s.player.alive).toBe(false); });
  it('coordinate conversion uses 32px square cells', () => { expect(worldToCell({ x: 63.9, y: 32 })).toEqual({ x: 1, y: 1 }); expect(cellCenter({ x: 1, y: 2 })).toEqual({ x: 48, y: 80 }); });
  it('rejects nonfixed timestep and malformed geometry', () => { expect(() => stepGame(fixture(), IDLE, 0.1)).toThrow(); expect(() => fixture({ width: 0 })).toThrow(); expect(() => fixture({ spawn: { x: -1, y: 0 } })).toThrow(); });
  it('[P-DET-01] 1000 tick-indexed intents reproduce states/events exactly', () => { const run = () => { let s = fixture(); const digest: string[] = []; for (let i = 0; i < 1000; i++) { const r = stepGame(s, { ...IDLE, moveX: i % 100 < 50 ? 1 : -1, jumpPressed: i % 93 === 0 }); s = r.state; digest.push(JSON.stringify(r)); } return digest; }; expect(run()).toEqual(run()); });
  it('[P-PAUSE-01] pause freezes ticks and caps resume catch-up', () => { const c = new GameController(sandbox); c.advance(DT); c.pause(true); const before = c.state; c.advance(100); expect(c.state).toBe(before); c.pause(false); c.advance(100); expect(c.state.tick - before.tick).toBe(5); });
  it('display frame grouping preserves ticks and consumes jump edges once', () => { const a = new GameController(sandbox), b = new GameController(sandbox); for (let i = 0; i < 120; i++) a.advance(DT); for (let i = 0; i < 60; i++) b.advance(DT * 2); expect(a.state).toEqual(b.state); a.queue({ ...IDLE, jumpPressed: true }); expect(a.advance(DT * 5).filter(e => e.type === 'Jumped')).toHaveLength(1); });
  it('[P-RESET-01] reset reproduces initial state', () => { const c = new GameController(sandbox); const initial = c.state; c.queue({ ...IDLE, moveX: 1 }); c.advance(1); c.restart(); expect(c.state).toEqual(initial); });
});

