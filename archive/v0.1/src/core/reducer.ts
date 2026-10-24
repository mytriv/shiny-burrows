import { type GameCommandResult, type GameEvent, type GameState, type Move, indexOf, treasureValue } from './model';
import { resolveGravity } from './gravity';
const directions = { MoveUp: [0, -1], MoveDown: [0, 1], MoveLeft: [-1, 0], MoveRight: [1, 0] } as const;
export function applyAction(state: GameState, action: Move): GameCommandResult {
  const reject = { accepted: false, state, events: [] };
  if (state.status !== 'playing') return reject;
  const [dx, dy] = directions[action];
  const to = { x: state.player.x + dx, y: state.player.y + dy };
  if (to.x < 0 || to.y < 0 || to.x >= state.level.width || to.y >= state.level.height) return reject;
  const at = indexOf(state.level.width, to), tile = state.cells[at];
  if (!tile || ['bedrock', 'boulder', 'fragile'].includes(tile.kind)) return reject;
  const cells = state.cells.slice(), events: GameEvent[] = [];
  if (tile.kind === 'dirt' || tile.kind === 'gold_dirt') events.push({ type: 'TileDug', at: to });
  const value = treasureValue(tile);
  if (tile.kind === 'gem' || tile.kind === 'gold_dirt') events.push({ type: 'TreasureCollected', at: to, value });
  if (['dirt', 'gold_dirt', 'gem'].includes(tile.kind)) cells[at] = { kind: 'empty' };
  events.push({ type: 'PlayerMoved', from: state.player, to });
  if (tile.kind === 'secret_entrance' && !state.secretVisited) events.push({ type: 'SecretVisited' });
  const gravity = resolveGravity({ ...state, cells, player: to, collectedValue: state.collectedValue + value,
    steps: state.steps + 1, secretVisited: state.secretVisited || tile.kind === 'secret_entrance' });
  let next = gravity.state;
  events.push(...gravity.events);
  if (next.status === 'playing' && tile.kind === 'exit') {
    if (next.collectedValue >= next.level.treasureGoal) { next = { ...next, status: 'won' }; events.push({ type: 'LevelWon' }); }
    else events.push({ type: 'ExitLocked', missing: next.level.treasureGoal - next.collectedValue });
  }
  return { accepted: true, state: next, events };
}
