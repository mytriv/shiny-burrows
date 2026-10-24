import { BALANCE } from '../../src/core/config';
import { ticks } from '../fixtures/ticks';
import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { stepGame } from '../../src/core/simulation';
import { IDLE, type GameState, type Tile } from '../../src/core/model';
import { sandbox } from '../fixtures/sandbox';
import { GameController } from '../../src/app/GameController';
import { DT } from '../../src/core/constants';
import { overlaps, playerBox, playerSolids } from '../../src/core/world';
import { firstBurrow } from '../../src/content/levels/first-burrow';
import { dig, regenerate } from '../../src/core/mining';
import { ladderAt, addLadders } from '../../src/core/ladders';
function wall(kind: Tile['kind'] = 'compacted', value = 0): GameState { return ticks(createState({ ...sandbox, tiles: sandbox.tiles.map((t, i) => i === 4 * 22 + 3 ? { kind, ...(value ? { lootId: 'gold', lootValue: value } : {}) } : t) }), 1); }
it('no jump API; even legacy jump data cannot produce ascent on ground', () => { let s = createState(sandbox); for (let i = 0; i < 120; i++)
    s = stepGame(s, { ...IDLE, ...{ jumpPressed: true } }).state; expect(s.player.position.y).toBe(160); expect(s.player.grounded).toBe(true); });
it('walks both directions, falls off an edge and settles on lower ground', () => { let s = ticks(createState(sandbox), 1, { moveX: 1 }); expect(s.player.position.x).toBeCloseTo(81.6); s = ticks(s, 1, { moveX: -1 }); expect(s.player.position.x).toBeCloseTo(80); s = ticks(s, 120, { moveX: 1 }); expect(s.player.position.y).toBeGreaterThan(160); expect(ticks(s, 120).player.position.y).toBe(288); });
it('terminal falls, wall collision, world bounds and kill boundary', () => { let s = ticks(createState({ ...sandbox, spawn: { x: 450, y: 160 } }), 240, { moveX: 1 }); expect(s.player.position.x).toBe(470); expect(s.player.position.y).toBe(160); s = ticks(createState({ ...sandbox, tiles: sandbox.tiles.map(() => ({ kind: 'empty' })) }), 180); expect(s.status).toBe('failed'); });
it('fixed delta only, malformed geometry rejected', () => { expect(() => stepGame(createState(sandbox), IDLE, .1)).toThrow(); expect(() => createState({ ...sandbox, width: 0 })).toThrow(); expect(() => createState({ ...sandbox, spawn: { x: -1, y: 0 } })).toThrow(); });
it('terrain uses 2/3/3/5 integrity and power reduces hits by ceil formula', () => { for (const [kind, max] of [['soil', 2], ['compacted', 3], ['gravel', 3], ['hard', 5]] as const) {
    for (const power of [1, 2, 3]) {
        let s = { ...wall(kind), pickaxePower: power };
        s = { ...s, player: { ...s.player, position: { x: 86, y: 160 } } };
        let hits = 0;
        while (s.tiles[91]?.kind !== 'empty') {
            const r = dig(s, { ...IDLE, digHeld: true });
            expect(r.events.some(e => e.type === 'TileHit')).toBe(true);
            s = { ...r.state, tick: r.state.tick + BALANCE.digTicks };
            hits++;
            expect(hits).toBeLessThan(6);
        }
        expect(hits).toBe(Math.max(2,Math.ceil(max / power)));
    }
} });
it('partial integrity resets after exactly 180 idle ticks, active hits refresh timer', () => { let s = wall('hard'); s = { ...s, player: { ...s.player, position: { x: 86, y: 160 } } }; s = dig(s, IDLE).state; expect(s.tiles[91]?.currentIntegrity).toBe(4); expect(regenerate({ ...s, tick: s.tick + 179 }).state.tiles[91]?.currentIntegrity).toBe(4); expect(regenerate({ ...s, tick: s.tick + 180 }).state.tiles[91]?.currentIntegrity).toBe(5); s = dig({ ...s, tick: 100 }, IDLE).state; expect(regenerate({ ...s, tick: 279 }).state.tiles[91]?.currentIntegrity).toBe(3); });
it('held movement repeats cadence, empty/distant/solid cells cannot pay twice', () => { let s = wall('ore_soil', 7); s = { ...s, player: { ...s.player, position: { x: 86, y: 160 } } }; s = ticks(s, 240, { moveX: 1 }); expect(s.levelGoldCollected).toBe(7); expect(s.wallet).toBe(7); expect(s.tiles[91]?.kind).toBe('empty'); expect(s.collectedLootIds).toEqual(['gold']); });
it('facing updates before strike even while blocked; no separate aiming exists', () => { let s = wall(); s = { ...s, player: { ...s.player, position: { x: 86, y: 160 }, facing: -1 } }; s = ticks(s, 1, { moveX: 1, digHeld: true }); expect(s.player.facing).toBe(1); expect(s.tiles[91]?.currentIntegrity).toBe(2); });
it('Down alone never mines or levitates, no ladder means Up cannot fly', () => { const s = ticks(createState(firstBurrow), 180, { climbY: 1 }); expect(s.tiles).toEqual(createState(firstBurrow).tiles); expect(s.player.position.y).toBe(128); expect(ticks(s, 120, { climbY: -1 }).player.position.y).toBe(128); });
it('three-layer excavation adds anchor and segments, Up returns to surface safely', () => { let s = ticks(createState(firstBurrow), 1); for (let i = 0; i < 3; i++) {
    const y = s.player.position.y;
    s = ticks(s, 60, { climbY: 1, digHeld: true });
    expect(s.player.position.y).toBeGreaterThan(y);
} expect(s.ladders.length).toBeGreaterThanOrEqual(4); s = ticks(s, 180, { climbY: -1 }); expect(s.player.position.y).toBe(122); expect(playerSolids(s, playerBox(s.player.position)).some(b => overlaps(b, playerBox(s.player.position)))).toBe(false); });
it('connected shaft extends through open cells only; unrelated caverns gain no ladders', () => { const tiles = firstBurrow.tiles.map((t, i) => i % 16 === 2 && [5, 6, 7].includes(Math.floor(i / 16)) ? { kind: 'empty' as const } : t); const s = ticks(createState({ ...firstBurrow, tiles }), 180, { climbY: 1, digHeld: true }); expect(s.ladders.some(l => l.y === 7)).toBe(true); let natural = ticks(createState({ ...firstBurrow, tiles: tiles.map((t, i) => i === 66 ? { kind: 'empty' } : t) }), 120); expect(natural.ladders).toEqual([]); natural = ticks({ ...s, player: { ...s.player, position: { x: 112, y: 128 } } }, 1); expect(natural.activeShaft).toBe(null); });
it('ladder alignment tolerance, reentry, solid ceiling and overlays cannot replace terrain', () => { let s = ticks(createState(firstBurrow), 1); s = ticks(s, 180, { climbY: 1, digHeld: true }); const y = s.player.position.y; s = { ...s, player: { ...s.player, position: { x: 86, y } } }; expect(ladderAt(s)).toBeDefined(); s = ticks(s, 180, { climbY: -1 }); expect(s.player.position.x).toBeCloseTo(80); expect(s.player.position.y).toBe(122); expect(addLadders(s, [{ x: 0, y: 4 }]).state.ladders).toEqual(s.ladders); });
it('pause freezes damage timers and resume catchup; restart clears damage and ladders', () => { const c = new GameController(firstBurrow); const initial = c.state; c.queue({ ...IDLE, climbY: 1, digHeld: true }); c.advance(DT * 5); c.pause(true); const before = c.state; c.advance(100); expect(c.state).toBe(before); c.pause(false); c.advance(100); expect(c.state.tick - before.tick).toBe(5); c.restart(); expect(c.state).toEqual(initial); });
it('1000 ticks replay states/events exactly with no overlaps or negative funds', () => { const run = () => { let s = createState(firstBurrow); const digest: string[] = []; for (let i = 0; i < 1000; i++) {
    const r = stepGame(s, { ...IDLE, moveX: i % 200 < 100 ? 1 : -1, digHeld: i % 3 === 0, climbY: i % 30 < 15 ? 1 : -1 });
    s = r.state;
    expect(playerSolids(s, playerBox(s.player.position)).some(b => overlaps(b, playerBox(s.player.position)))).toBe(false);
    expect(s.wallet).toBeGreaterThanOrEqual(0);
    digest.push(JSON.stringify(r));
} return digest; }; expect(run()).toEqual(run()); });
it('display frame grouping preserves deterministic simulation and held dig', () => { const a = new GameController(firstBurrow), b = new GameController(firstBurrow); for (let i = 0; i < 120; i++) {
    a.queue({ ...IDLE, climbY: 1, digHeld: true });
    a.advance(DT);
} for (let i = 0; i < 60; i++) {
    b.queue({ ...IDLE, climbY: 1, digHeld: true });
    b.advance(DT * 2);
} expect(a.state).toEqual(b.state); });
it('solid ceiling stops ladder ascent without clipping; idle ladder never hovers', () => { let s = ticks(createState(firstBurrow), 180, { climbY: 1, digHeld: true }); const col = 2, row = 5; const tiles = s.tiles.map((t, i) => i === row * 16 + col ? { kind: 'bedrock' as const } : t); s = { ...s, tiles }; s = ticks(s, 200, { climbY: -1 }); expect(s.player.position.y).toBe(218); expect(playerSolids(s, playerBox(s.player.position)).some(b => overlaps(b, playerBox(s.player.position)))).toBe(false); const before = s.player.position.y; expect(ticks(s, 1).player.position.y).toBeGreaterThan(before); });
it('interrupted mining preserves damage before timeout; destroyed floor never regrows', () => { let s = wall('compacted'); s = { ...s, player: { ...s.player, position: { x: 86, y: 160 } } }; s = dig(s, IDLE).state; const before = s; s = ticks(s, 50); expect(s.tiles[91]?.currentIntegrity).toBe(2); expect(before.tiles[91]?.currentIntegrity).toBe(2); s = ticks(s, 50, { moveX: 1 }); expect(s.tiles[91]?.kind).toBe('empty'); expect(ticks(s, 300).tiles[91]?.kind).toBe('empty'); });
it('malformed hardness, reward metadata and entry economy rejected', () => { expect(() => createState({ ...firstBurrow, tiles: firstBurrow.tiles.map((t, i) => i === 66 ? { kind: 'soil', hardness: 0 } : t) })).toThrow(); expect(() => createState(firstBurrow, -1)).toThrow(); expect(() => createState(firstBurrow, 0, 0)).toThrow(); expect(() => createState({ ...firstBurrow, tiles: firstBurrow.tiles.map((t, i) => i === 66 ? { kind: 'soil', lootId: 'bad', lootValue: 9 } : t) })).toThrow(); });
