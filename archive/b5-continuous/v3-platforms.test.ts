import { GameController } from '../../src/app/GameController';
import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { IDLE, type GameState } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { buyPlatform, placePlatform, validatePlatform } from '../../src/core/platforms';
import { sandbox } from '../fixtures/sandbox';
import { ticks } from '../fixtures/ticks';
function bank(): GameState { return ticks(createState({ ...sandbox, spawn: { x: 240, y: 160 }, startWallet: 5 }), 1); }
it('atomic buy and placement consume money/inventory separately; invalid placements cost nothing', () => { let s = bank(); s = buyPlatform(s).state; expect(s.wallet).toBe(0); expect(s.inventory.platforms).toBe(1); expect(s.levelGoldCollected).toBe(0); s = placePlatform(s).state; expect(s.platforms).toEqual([{ x: 8, y: 5 }]); expect(s.inventory.platforms).toBe(0); expect(placePlatform(s).state).toBe(s); expect(buyPlatform(s).state).toBe(s); });
it('placement rejects airborne, overlap, occupied, distant, out-of-bounds and no inventory', () => { const s = bank(); expect(validatePlatform(s)).toBe('noPlatform'); expect(validatePlatform({ ...s, player: { ...s.player, grounded: false } })).toBe('notGrounded'); expect(validatePlatform(s, { x: 30, y: 5 })).toBe('outOfBounds'); expect(validatePlatform(s, { x: 9, y: 5 })).toBe('outOfRange'); expect(validatePlatform({ ...s, player: { ...s.player, facing: -1 } })).toBe('occupied'); });
it('paid crossing supports walking; no-spend route falls to lower floor', () => { let paid = placePlatform(buyPlatform(bank()).state).state; paid = ticks(paid, 40, { moveX: 1 }); expect(paid.player.position.x).toBeCloseTo(304); expect(paid.player.position.y).toBe(160); expect(paid.spentCoins).toBe(5); const free = ticks(ticks(bank(), 20, { moveX: 1 }), 120); expect(free.player.position.y).toBe(288); expect(free.spentCoins).toBe(0); expect(free.wallet).toBe(5); });
it('intentional drop ignores only supporting platform until entire body clears; no snapback', () => { let s: GameState = { ...bank(), platforms: [{ x: 8, y: 5 }], player: { ...bank().player, position: { x: 272, y: 160 } } }; s = stepGame(s, { ...IDLE, climbY: 1, downPressed: true }).state; expect(s.ignoredPlatforms).toEqual([{ x: 8, y: 5 }]); expect(s.player.position.y).toBeGreaterThan(160); for (let i = 0; i < 120; i++) {
    const before = s.player.position.y;
    s = stepGame(s, { ...IDLE, climbY: 1 }).state;
    expect(s.player.position.y).toBeGreaterThanOrEqual(before);
} expect(s.player.position.y).toBe(288); expect(s.ignoredPlatforms).toEqual([]); expect(s.platforms).toEqual([{ x: 8, y: 5 }]); });
it('holding Down drops one stacked platform only, release and repress drops next', () => { let s: GameState = { ...bank(), platforms: [{ x: 8, y: 5 }, { x: 8, y: 7 }], player: { ...bank().player, position: { x: 272, y: 160 } } }; s = stepGame(s, { ...IDLE, climbY: 1, downPressed: true }).state; s = ticks(s, 120, { climbY: 1 }); expect(s.player.position.y).toBe(224); s = stepGame(s, { ...IDLE, climbY: 1, downPressed: true }).state; s = ticks(s, 120); expect(s.player.position.y).toBe(288); });
it('one-way platforms do not block sides or ascent and catch terminal falls', () => { let s: GameState = { ...bank(), platforms: [{ x: 8, y: 5 }], player: { ...bank().player, position: { x: 272, y: 40 }, velocity: { x: 0, y: 360 } } }; expect(ticks(s, 60).player.position.y).toBe(160); s = { ...s, player: { ...s.player, position: { x: 272, y: 210 }, velocity: { x: 0, y: -200 } } }; expect(stepGame(s, IDLE).state.player.position.y).toBeLessThan(210); const side = ticks({ ...s, tiles: s.tiles.map((t, i) => Math.floor(i / 22) === 5 ? { kind: 'empty' } : t), player: { ...s.player, position: { x: 240, y: 190 }, velocity: { x: 0, y: 0 } } }, 20, { moveX: 1 }); expect(side.player.position.x).toBeGreaterThan(264); });
it('platform drop takes priority over a nearby ladder and ladder cannot replace platform', () => { const s = { ...bank(), platforms: [{ x: 8, y: 5 }], ladders: [{ x: 8, y: 4 }, { x: 8, y: 6 }], player: { ...bank().player, position: { x: 272, y: 160 } } }; const r = stepGame(s, { ...IDLE, climbY: 1, downPressed: true }); expect(r.state.player.climbing).toBe(false); expect(r.state.player.velocity.y).toBeGreaterThan(0); });
it('buy/place edges consumed once during five-tick controller catchup', () => { const c = new GameController({ ...sandbox, spawn: { x: 240, y: 160 }, startWallet: 20 }); c.advance(1 / 60); c.queue({ ...IDLE, buyPlatformPressed: true, placePlatformPressed: true }); c.advance(1); expect(c.state.wallet).toBe(15); expect(c.state.platforms).toHaveLength(1); expect(c.state.inventory.platforms).toBe(0); });
it('ladder crosses a platform from below and walking off its boundary falls', () => { let s: GameState = { ...bank(), platforms: [{ x: 8, y: 5 }], ladders: [{ x: 8, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 6 }], player: { ...bank().player, position: { x: 272, y: 224 } } }; s = ticks(s, 70, { climbY: -1 }); expect(s.player.position.y).toBeLessThan(160); s = { ...s, player: { ...s.player, position: { x: 272, y: 160 }, velocity: { x: 0, y: 0 } } }; s = ticks(s, 20, { moveX: 1 }); expect(s.player.position.x).toBeGreaterThan(288); expect(s.ignoredPlatforms).toEqual([]); });

it('drop at a platform edge succeeds only when the collider clears the adjoining solid bank',()=>{
 const base={...bank(),platforms:[{x:8,y:5}]};
 const edge:GameState={...base,player:{...base.player,position:{x:278,y:160}}};
 expect(ticks(stepGame(edge,{...IDLE,downPressed:true,climbY:1}).state,30).player.position.y).toBeGreaterThan(160);
 const onBank:GameState={...base,player:{...base.player,position:{x:280,y:160}}};
 expect(ticks(stepGame(onBank,{...IDLE,downPressed:true,climbY:1}).state,30).player.position.y).toBe(160);
});
