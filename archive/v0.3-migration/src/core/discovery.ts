import { type GameState, type Vec2 } from './model';
import { worldToCell } from './world';
export function oreExposed(state: GameState, cell: Vec2): boolean {
  const tile = state.tiles[cell.y * state.level.width + cell.x];
  if (!tile?.concealed) return true;
  const p = worldToCell(state.player.position);
  if (Math.abs(p.x - cell.x) + Math.abs(p.y - cell.y) <= 2) return true;
  return [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx = 0, dy = 0]) => {
    const x = cell.x + dx, y = cell.y + dy;
    return x >= 0 && y >= 0 && x < state.level.width && y < state.level.height && state.tiles[y * state.level.width + x]?.kind === 'empty';
  });
}
export function treasureHint(state: GameState): boolean {
  const p = worldToCell({ x: state.player.position.x, y: state.player.position.y - 13 });
  return state.tiles.some((tile, i) => tile.kind === 'ore_soil' && tile.concealed && Math.abs(i % state.level.width - p.x) + Math.abs(Math.floor(i / state.level.width) - p.y) <= 3);
}
export function medal(state: GameState): 'bronze' | 'silver' | 'gold' | null {
  if (state.status !== 'won') return null;
  return state.goldCollectedValue >= state.level.treasureQuota + 9 ? 'gold' : state.goldCollectedValue >= state.level.treasureQuota + 3 ? 'silver' : 'bronze';
}
