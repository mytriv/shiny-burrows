import { BALANCE } from './config';
import { PLAYER_HEIGHT } from './constants';
import type { GameState, StepResult, Vec2, GameEvent } from './model';
import { cellBox, overlaps, rockBox } from './world';
export const sameCell = (a: Vec2, b: Vec2): boolean => a.x === b.x && a.y === b.y;
/** The top of an existing shaft is a one-way foothold for stepping onto its bank. */
export function ladderTops(state: GameState): readonly Vec2[] {
    const tops=new Map<number,Vec2>();
    for(const cell of state.ladders){const top=tops.get(cell.x);if(!top || cell.y<top.y)tops.set(cell.x,cell);}
    const platforms=new Set(state.platforms.map(c=>c.x+','+c.y));
    return [...tops.values()].map(cell=>{let y=cell.y;while(platforms.has(cell.x+','+(y-1)))y--;return {x:cell.x,y};});
}
export function ladderAt(state: GameState): Vec2 | undefined {
    const p = state.player.position;
    const near = (c: Vec2) => Math.abs(p.x - (c.x * 32 + 16)) <= BALANCE.ladderTolerance && p.y >= c.y * 32 - 1e-7 && p.y - PLAYER_HEIGHT < (c.y + 1) * 32 - 1e-7;
    const actual = state.ladders.find(near);
    if (actual) return actual;
    // A one-way platform is a traversable connector, never overwritten by a rung.
    const tops=ladderTops(state);
    return state.platforms.find(c => near(c) && (
        state.ladders.some(l => l.x === c.x && l.y === c.y - 1) && state.ladders.some(l => l.x === c.x && l.y === c.y + 1) ||
        tops.some(t=>t.x===c.x && t.y<=c.y) && state.ladders.some(l=>l.x===c.x && l.y>c.y) && !state.ladders.some(l=>l.x===c.x && l.y<c.y)
    ));
}
export function addLadders(state: GameState, cells: readonly Vec2[]): StepResult {
    const ladders = [...state.ladders], events: GameEvent[] = [];
    for (const cell of cells) {
        if (cell.x < 0 || cell.y < 0 || cell.x >= state.level.width || cell.y >= state.level.height || state.tiles[cell.y * state.level.width + cell.x]?.kind !== 'empty' || state.platforms.some(p => sameCell(p, cell)) || state.level.overlays.some(o => sameCell(o.cell,cell) && !state.collectedLootIds.includes(o.id)) || state.boulders.some(b => overlaps(rockBox(b.position), cellBox(cell))) || ladders.some(l => sameCell(l, cell))) continue;
        ladders.push(cell); events.push({ type: 'LadderAdded', cell });
    }
    return { state: events.length ? { ...state, ladders } : state, events };
}
/** Only actual downward row crossings authorize newly entered cells; no body backfill. */
export function traceLadders(state: GameState, path: readonly Vec2[]): StepResult {
    let next = state; const events: GameEvent[] = [], processed = [...state.ladderProcessedCells];
    for(let i=1;i<path.length;i++) {
        const from=path[i-1], to=path[i]; if(!from || !to) continue;
        if(to.y <= from.y + 1e-7) continue;
        const first=Math.floor((from.y-1e-7)/32)+1,last=Math.floor((to.y-1e-7)/32);
        for(let y=first;y<=last;y++) {
            const t=Math.max(0,Math.min(1,(y*32-from.y)/(to.y-from.y)));
            const cell={x:Math.floor((from.x+(to.x-from.x)*t)/32),y};
            if(cell.x<0 || cell.x>=state.level.width || y<0 || y>=state.level.height || processed.some(c=>sameCell(c,cell)))continue;
            processed.push(cell);
            const r=addLadders(next,[cell]);next=r.state;events.push(...r.events);
        }
    }
    if(processed.length!==state.ladderProcessedCells.length) next={...next,ladderProcessedCells:processed};
    return {state:next,events};
}
