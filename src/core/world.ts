import { PLAYER_HEIGHT, PLAYER_WIDTH, TILE_SIZE } from './constants';
import { type GameState, type Vec2 } from './model';
export type AABB = Readonly<{
    left: number;
    top: number;
    right: number;
    bottom: number;
}>;
export const worldToCell = (p: Vec2): Vec2 => ({ x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) });
export const cellCenter = (p: Vec2): Vec2 => ({ x: p.x * TILE_SIZE + TILE_SIZE / 2, y: p.y * TILE_SIZE + TILE_SIZE / 2 });
export const playerBox = (p: Vec2): AABB => ({ left: p.x - PLAYER_WIDTH / 2, right: p.x + PLAYER_WIDTH / 2, top: p.y - PLAYER_HEIGHT, bottom: p.y });
export const cellBox = (p: Vec2): AABB => ({ left: p.x * TILE_SIZE, right: (p.x + 1) * TILE_SIZE, top: p.y * TILE_SIZE, bottom: (p.y + 1) * TILE_SIZE });
export const overlaps = (a: AABB, b: AABB): boolean => a.left < b.right - 1e-7 && a.right > b.left + 1e-7 && a.top < b.bottom - 1e-7 && a.bottom > b.top + 1e-7;
export const rockBox = (p: Vec2): AABB => ({ left: p.x, right: p.x + TILE_SIZE, top: p.y, bottom: p.y + TILE_SIZE });
export function solidBoxes(state: Pick<GameState, 'level' | 'tiles'>, box: AABB): AABB[] {
    const result: AABB[] = [], w = state.level.width, h = state.level.height;
    for (let y = Math.max(0, Math.floor(box.top / TILE_SIZE)); y <= Math.min(h - 1, Math.floor((box.bottom - 1e-7) / TILE_SIZE)); y++) {
        for (let x = Math.max(0, Math.floor(box.left / TILE_SIZE)); x <= Math.min(w - 1, Math.floor((box.right - 1e-7) / TILE_SIZE)); x++) {
            if (state.tiles[y * w + x]?.kind !== 'empty')
                result.push(cellBox({ x, y }));
        }
    }
    return result;
}
export function playerSolids(state: GameState, box: AABB): AABB[] {
    return [...solidBoxes(state, box), ...state.boulders.map(rock => rockBox(rock.position)).filter(rock => overlaps(rock, box))];
}
