import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { IDLE, type GameState, type StepResult } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { sandbox } from '../fixtures/sandbox';
import { GameController } from '../../src/app/GameController';
import { overlaps, playerBox, playerSolids } from '../../src/core/world';
import { firstBurrow } from '../../src/content/levels/first-burrow';
function rockFixture(fragile = false): GameState {
    return createState({ ...sandbox, spawn: { x: 112, y: 160 }, tiles: sandbox.tiles.map((t, i) => i === 4 * 22 + 4 ? { kind: 'soil' } : fragile && i === 5 * 22 + 4 ? { kind: 'fragile' } : t), boulders: [{ id: 'rock', cell: { x: 4, y: 3 } }] });
}
function run(s: GameState, count: number, moveX: -1 | 0 | 1 = 0): GameState { for (let i = 0; i < count; i++)
    s = stepGame(s, { ...IDLE, moveX }).state; return s; }
function breakSupport(state:GameState):StepResult {
 for(let i=0;i<100;i++){const r=stepGame(state,{...IDLE,moveX:1});state=r.state;if(r.events.some(e=>e.type==='TileDug'))return r;}
 throw new Error('Support was not mined');
}
it('[P-ROCK-01] supported rock stays still; removing support releases in same tick', () => { const s = run(rockFixture(), 120); expect(s.boulders[0]?.position.y).toBe(96); const r = breakSupport(s); expect(r.events).toContainEqual({ type: 'BoulderReleased', id: 'rock' }); expect(r.state.boulders[0]?.warningTicks).toBe(11); expect(r.events.findIndex(e => e.type === 'TileDug')).toBeLessThan(r.events.findIndex(e => e.type === 'BoulderReleased')); });
it('[P-ROCK-01] rock falls in real time, stops on terrain and is solid from sides', () => { const released = breakSupport(rockFixture()).state; const s = run(released, 120); expect(s.boulders[0]?.position.y).toBe(128); expect(s.boulders[0]?.falling).toBe(false); expect(s.boulders[0]?.velocityY).toBe(0); const blocked = run(s, 60, 1); expect(blocked.player.position.x).toBe(112); expect(blocked.status).toBe('playing'); });
it('[P-ROCK-01] entering a released rock column is a gentle crush failure', () => { const released = breakSupport(rockFixture()).state; const s = run(released, 120, 1); expect(s.status).toBe('failed'); expect(s.player.alive).toBe(false); expect(playerSolids(s, playerBox(s.player.position)).some(b => overlaps(b, playerBox(s.player.position)))).toBe(false); });
it('P1: falling rock shatters fragile without generating loot', () => { const r = breakSupport(rockFixture(true)).state; const s = run(r, 120); expect(s.tiles[114]?.kind).toBe('empty'); expect(s.levelGoldCollected).toBe(0); expect(s.boulders[0]?.position.y).toBe(384); });
it('rocks deliberately ignore one-way platform support', () => { const released = breakSupport(rockFixture()).state; const s = run({ ...released, platforms: [{ x: 4, y: 4 }] }, 120); expect(s.boulders[0]?.position.y).toBe(128); });
it('rock advancement and events replay identically over 1000 ticks', () => { const replay = () => { let s = rockFixture(); const digest: string[] = []; for (let tick = 0; tick < 1000; tick++) {
    const r = stepGame(s, { ...IDLE, moveX: tick >= 3 && tick <= 34 ? 1 : 0 });
    s = r.state;
    digest.push(JSON.stringify(r));
} return digest; }; expect(replay()).toEqual(replay()); });
it('two unsupported rocks are released bottom-to-top then left-to-right', () => { const level = { ...sandbox, boulders: [{ id: 'high-right', cell: { x: 10, y: 2 } }, { id: 'low', cell: { x: 12, y: 3 } }, { id: 'high-left', cell: { x: 9, y: 2 } }] }; const r = stepGame(createState(level), IDLE); expect(r.events.filter(e => e.type === 'BoulderReleased').map(e => 'id' in e ? e.id : '')).toEqual(['low', 'high-left', 'high-right']); });
it('[P-RESET-01] restart restores full terrain/economy/rock state after failure', () => { const c = new GameController(firstBurrow); const initial = c.state; c.state = { ...c.state, tick: 45, status: 'failed', wallet: 0, levelGoldCollected: 10, spentCoins: 10, player: { ...c.state.player, alive: false }, platforms: [{ x: 8, y: 5 }], collectedLootIds: ['entrance-gold'], tiles: c.state.tiles.map(() => ({ kind: 'empty' })), boulders: [] }; c.pause(true); c.restart(); expect(c.state).toEqual(initial); expect(c.previous).toEqual(initial); expect(c.paused).toBe(false); });
it('level validation rejects duplicate rocks, rock/solid and rock/spawn overlap', () => { expect(() => createState({ ...sandbox, boulders: [{ id: 'r', cell: { x: 2, y: 4 } }] })).toThrow(); expect(() => createState({ ...sandbox, boulders: [{ id: 'r', cell: { x: 2, y: 5 } }] })).toThrow(); expect(() => createState({ ...sandbox, boulders: [{ id: 'r', cell: { x: 4, y: 2 } }, { id: 'r', cell: { x: 5, y: 2 } }] })).toThrow(); });
it('player cannot overlap bedrock or rocks throughout a complex 1000-tick stream', () => { let s = createState(firstBurrow); for (let tick = 0; tick < 1000; tick++) {
    s = stepGame(s, { ...IDLE, moveX: tick % 200 < 150 ? 1 : -1, climbY: tick % 22 === 0 ? 1 : 0 }).state;
    const body = playerBox(s.player.position);
    expect(playerSolids(s, body).some(b => overlaps(b, body))).toBe(false);
    expect(s.wallet).toBeGreaterThanOrEqual(0);
    expect(Object.values(s.player.position).every(Number.isFinite)).toBe(true);
} });
