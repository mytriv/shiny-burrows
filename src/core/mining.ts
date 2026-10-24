import { BALANCE } from './config';
import {traversing,playerCell} from './traversal';
import type { GameState, InputIntent, Rejection, StepResult, Vec2, GameEvent, DigDirection } from './model';
import { cellBox, overlaps, playerBox, worldToCell } from './world';
const UP_REACH = 8.01;
export function miningDirection(input: InputIntent): Exclude<DigDirection, 'up'> | null {
    if(input.moveX) return input.moveX < 0 ? 'left' : 'right';
    return input.climbY > 0 ? 'down' : null;
}
export function digTarget(state: GameState, input: InputIntent): Vec2 {
    const p=state.player.position, direction=miningDirection(input);
    if(direction==='down') return worldToCell({x:p.x,y:p.y+.01});
    const cell=worldToCell({x:p.x,y:p.y-13});
    const target={x:cell.x+(direction==='left'?-1:direction==='right'?1:state.player.facing),y:cell.y};
    if(state.player.climbing && input.moveX && state.tiles[target.y*state.level.width+target.x]?.kind==='empty') {
        const body=playerBox(p),edge=input.moveX>0?body.right:body.left;
        for(let y=Math.floor(body.top/32);y<=Math.floor((body.bottom-1e-7)/32);y++) {
            const tile=target.x>=0 && target.x<state.level.width && y>=0 && y<state.level.height ? state.tiles[y*state.level.width+target.x] : undefined;
            if(tile && tile.kind!=='empty' && Math.abs(edge-(input.moveX>0?target.x*32:(target.x+1)*32))<1e-6)return {x:target.x,y};
        }
    }
    return target;
}
export function validateDig(state: GameState, cell: Vec2): Rejection | null {
    if (!Number.isInteger(cell.x) || !Number.isInteger(cell.y) || cell.x < 0 || cell.y < 0 || cell.x >= state.level.width || cell.y >= state.level.height)
        return 'outOfBounds';
    const body = playerBox(state.player.position), target = cellBox(cell);
    if (overlaps(body, target))
        return 'playerOverlap';
    if (!overlaps({ left: body.left - 8.01, right: body.right + 8.01, top: body.top - UP_REACH - .01, bottom: body.bottom + 1 }, target))
        return 'outOfRange';
    if (!state.tiles[cell.y * state.level.width + cell.x]?.maxIntegrity)
        return 'indestructible';
    if (state.tick < state.nextDigTick)
        return 'cooldown';
    return null;
}
export function claimLoot(state: GameState, id: string, value: number): StepResult {
    if (state.collectedLootIds.includes(id))
        return { state, events: [] };
    return { state: { ...state, collectedLootIds: [...state.collectedLootIds, id], wallet: state.wallet + value, levelGoldCollected: state.levelGoldCollected + value }, events: [{ type: 'TreasureCollected', id, value }] };
}
export function regenerate(state: GameState): StepResult {
    const events: GameEvent[] = [];
    const tiles = state.tiles.map((t, i) => {
        if (t.maxIntegrity && (t.currentIntegrity ?? t.maxIntegrity) < t.maxIntegrity && t.lastHitTick !== undefined && state.tick - t.lastHitTick >= BALANCE.regenTicks) {
            events.push({ type: 'TileRegenerated', cell: { x: i % state.level.width, y: Math.floor(i / state.level.width) } });
            return { ...t, currentIntegrity: t.maxIntegrity };
        }
        return t;
    });
    return { state: events.length ? { ...state, tiles } : state, events };
}
export function dig(state: GameState, input: InputIntent): StepResult {
    if(input.climbY < 0 && !input.moveX) return {state,events:[]};
    const cell = digTarget(state, input), reason = validateDig(state, cell);
    if (reason)
        return { state, events: reason === 'cooldown' || reason === 'indestructible' || reason === 'playerOverlap' || reason === 'outOfRange' ? [] : [{ type: 'ActionRejected', reason }] };
    const index = cell.y * state.level.width + cell.x, tile = state.tiles[index];
    if (!tile?.maxIntegrity)
        return { state, events: [] };
    const max = tile.maxIntegrity, current = tile.currentIntegrity ?? max;
    const gold = tile.kind === 'ore_soil';
    const base = max - (gold ? 1 : 0);
    // Even the strongest pickaxe must leave a visible first-hit correction window.
    const remaining = gold && current === max ? base : Math.max(current === base ? 1 : 0, current - state.pickaxePower);
    const tiles = state.tiles.slice();
    tiles[index] = remaining ? { ...tile, currentIntegrity: remaining, lastHitTick: state.tick } : { kind: 'empty' };
    let next: GameState = { ...state, tiles, nextDigTick: state.tick + BALANCE.digTicks };
    const events: GameEvent[] = [{ type: 'TileHit', cell, integrity: remaining, maxIntegrity: max, damage: current - remaining, crackStage: Math.ceil((1 - remaining / max) * 3) }];
    if (!remaining) {
        events.push({ type: 'TileDug', cell });
        if (tile.lootId) {
            const r = claimLoot(next, tile.lootId, tile.lootValue ?? 0);
            next = r.state;
            events.push(...r.events);
        }
    }
    return { state: next, events };
}
export function collectOverlays(state: GameState): StepResult {
    let next = state;
    const events: GameEvent[] = [];
    for (const o of state.level.overlays) {
        if (!overlaps(playerBox(next.player.position), cellBox(o.cell)))
            continue;
        if (o.kind === 'exit') {
            if (next.levelGoldCollected >= next.level.treasureQuota && next.status === 'playing') {
                next = { ...next, status: 'won' };
                events.push({ type: 'LevelWon' });
            }
        }
        else {
            const r = claimLoot(next, o.id, o.value);
            next = r.state;
            events.push(...r.events);
        }
    }
    return { state: next, events };
}

/** One directional contact strike, with identical cadence/cancellation on every axis. */
export function contactDig(state: GameState, input: InputIntent): StepResult {
    if(traversing(state))return {state:{...state,miningContact:null},events:[]};
    const direction=miningDirection(input);
    if(!direction) return {state:{...state,miningContact:null},events:[]};
    const cell=digTarget(state,input),box=playerBox(state.player.position),target=cellBox(cell);
    let touching=false;
    if(direction==='down') touching=state.player.grounded && Math.abs(box.bottom-target.top)<.02;
    else {const current=playerCell(state);touching=cell.y===current.y&&Math.abs(cell.x-current.x)===1;}
    const tile=cell.x>=0 && cell.x<state.level.width && cell.y>=0 && cell.y<state.level.height ? state.tiles[cell.y*state.level.width+cell.x] : undefined;
    if(!touching || !tile || tile.kind==='empty') return {state:{...state,miningContact:null},events:[]};
    const prior=state.miningContact, continuing=prior?.cell.x===cell.x && prior.cell.y===cell.y && prior.direction===direction;
    if(!tile.maxIntegrity) return {state:{...state,miningContact:{cell,direction}},events:continuing?[]:[{type:'SolidBlocked',cell}]};
    const damaged=(tile.currentIntegrity??tile.maxIntegrity)<tile.maxIntegrity;
    const ready=continuing?state.nextDigTick:state.tick+(damaged?BALANCE.digTicks:0);
    return dig({...state,miningContact:{cell,direction},nextDigTick:ready},input);
}
