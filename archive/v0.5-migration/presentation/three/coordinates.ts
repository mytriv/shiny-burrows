import { TILE_SIZE, PLAYER_HEIGHT, PLAYER_WIDTH } from '../../core/constants';
import type { Vec2 } from '../../core/model';

/** Single gameplay-to-render convention: logical Y down, render Y up, Z decoration. */
export function renderPoint(p: Vec2, z = 0): readonly [number, number, number] { return [p.x, -p.y, z]; }
export function cellPoint(cell: Vec2, z = 0): readonly [number, number, number] {
    return renderPoint({ x: (cell.x + .5) * TILE_SIZE, y: (cell.y + .5) * TILE_SIZE }, z);
}
export function molePoint(feet: Vec2): readonly [number, number, number] {
    return renderPoint({ x: feet.x, y: feet.y - PLAYER_HEIGHT / 2 }, 20);
}
export const VISUAL = { tile: TILE_SIZE, playerWidth: PLAYER_WIDTH, playerHeight: PLAYER_HEIGHT, depth: 8, particleLimit: 48, pixelRatioLimit: 1.5 } as const;
