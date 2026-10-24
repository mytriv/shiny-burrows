import { type GameEvent, type GameState, type Vec2, indexOf } from './model';

export function resolveGravity(state: GameState): { state: GameState; events: GameEvent[] } {
  const { width, height } = state.level;
  const cells = state.cells.slice();
  const events: GameEvent[] = [];
  const fallen = new Set<number>();
  const boulders = cells.filter(t => t.kind === 'boulder').length;
  const cap = height * boulders + height + 1;
  for (let step = 0; step < cap; step++) {
    let changed = false;
    for (let y = height - 2; y >= 0; y--) for (let x = 0; x < width; x++) {
      const from: Vec2 = { x, y }, to: Vec2 = { x, y: y + 1 };
      const at = indexOf(width, from), below = at + width;
      if (cells[at]?.kind !== 'boulder') continue;
      const target = cells[below]?.kind;
      if (target === 'fragile' && fallen.has(at)) {
        cells[below] = { kind: 'empty' };
        events.push({ type: 'FragileSmashed', at: to });
        changed = true;
      } else if (target === 'empty') {
        if (!fallen.has(at)) events.push({ type: 'BoulderWarning', at: from });
        if (to.x === state.player.x && to.y === state.player.y) {
          events.push({ type: 'PlayerStuck', at: to });
          return { state: { ...state, cells, status: 'stuck' }, events };
        }
        const rock = cells[at];
        if (!rock) throw new Error('Missing boulder');
        cells[below] = rock; cells[at] = { kind: 'empty' };
        fallen.delete(at); fallen.add(below);
        events.push({ type: 'BoulderMoved', from, to }); changed = true;
      }
    }
    if (!changed) return { state: { ...state, cells }, events };
  }
  throw new Error('Gravity failed to stabilize within safety cap');
}
