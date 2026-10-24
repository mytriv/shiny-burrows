import { BRIDGE_COST, TILE_SIZE, TOOL_ENERGY } from './constants';
import { type GameState, type InputIntent, type Rejection, type StepResult, type Vec2 } from './model';
import { cellBox, overlaps, playerBox, playerSolids, rockBox } from './world';
export { BRIDGE_COST } from './constants';
export function bridgeTarget(state: GameState, input: InputIntent): Vec2 {
  return input.targetCell ?? { x: Math.floor(state.player.position.x / TILE_SIZE) + state.player.facing, y: Math.round(state.player.position.y / TILE_SIZE) };
}
export function validateBridge(state: GameState, target: Vec2): Rejection | null {
  if (!Number.isInteger(target.x) || !Number.isInteger(target.y) || target.x < 0 || target.y < 0 || target.x >= state.level.width || target.y >= state.level.height) return 'outOfBounds';
  const p = state.player;
  const support = playerBox({ x: p.position.x, y: p.position.y + 0.01 });
  if (!p.grounded || !(playerSolids(state, support).some(box => overlaps(box, support)) || bridgeSupports(state, p.position.x, p.position.y))) return 'notGrounded';
  const col = Math.floor(p.position.x / TILE_SIZE);
  if (Math.abs(target.x - col) !== 1 || Math.abs(target.y * TILE_SIZE - p.position.y) > 0.01) return 'outOfRange';
  if (overlaps(playerBox(p.position), cellBox(target))) return 'playerOverlap';
  if (state.tiles[target.y * state.level.width + target.x]?.kind !== 'empty' || state.bridges.some(b => b.x === target.x && b.y === target.y) || state.level.overlays.some(o => o.cell.x === target.x && o.cell.y === target.y) || state.boulders.some(b => overlaps(rockBox(b.position), cellBox(target)))) return 'occupied';
  if (state.bridgeInventory < 1) return 'noBridgeKit';
  if (p.energy < TOOL_ENERGY) return 'insufficientEnergy';
  return null;
}
export function placeBridge(state: GameState, input: InputIntent): StepResult {
  const cell = bridgeTarget(state, input), reason = validateBridge(state, cell);
  if (reason) return { state, events: [{ type: 'ActionRejected', reason }] };
  return { state: { ...state, bridges: [...state.bridges, { ...cell }], bridgeInventory: state.bridgeInventory - 1, player: { ...state.player, energy: state.player.energy - TOOL_ENERGY } }, events: [{ type: 'BridgePlaced', cell, cost: 0 }] };
}
export function buyBridge(state: GameState): StepResult {
  if (state.wallet < BRIDGE_COST) return { state, events: [{ type: 'ActionRejected', reason: 'insufficientFunds' }] };
  return { state: { ...state, wallet: state.wallet - BRIDGE_COST, spentCoins: state.spentCoins + BRIDGE_COST, bridgeInventory: state.bridgeInventory + 1 }, events: [{ type: 'BridgeBought', cost: BRIDGE_COST }] };
}
export function bridgeSupports(state: GameState, x: number, feet: number): boolean {
  return state.bridges.some(b => Math.abs(b.y * TILE_SIZE - feet) < 0.02 && x + 10 > b.x * TILE_SIZE && x - 10 < (b.x + 1) * TILE_SIZE);
}
