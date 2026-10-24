import { describe, expect, it } from 'vitest';
import { createState, parseLevel } from '../../src/core/levels';
import { applyAction } from '../../src/core/reducer';
import { resolveGravity } from '../../src/core/gravity';
import { dispatch, type Session } from '../../src/core/history';
import { medal, treasurePercent } from '../../src/core/scoring';
import { type GameState, type TileKind } from '../../src/core/model';
import { GameController } from '../../src/app/GameController';

const legend: Record<string, TileKind> = { '.': 'empty', '#': 'bedrock', d: 'dirt', g: 'gold_dirt', G: 'gem', B: 'boulder', F: 'fragile', E: 'exit', S: 'secret_entrance' };
function board(rows = ['.....', '...gE', '#####'], spawn = { x: 0, y: 1 }, goal = 1): GameState {
  const cells = rows.flatMap(row => [...row].map(c => ({ kind: legend[c] ?? 'empty' })));
  const exit = cells.findIndex(t => t.kind === 'exit');
  return createState(parseLevel({ id: 'test', name: 'Test', biome: 'soil', width: rows[0]?.length, height: rows.length, cells, spawn,
    exit: { x: exit % (rows[0]?.length ?? 1), y: Math.floor(exit / (rows[0]?.length ?? 1)) }, treasureGoal: goal, medalThresholds: { silver: goal, gold: goal } }));
}
const session = (state: GameState): Session => ({ state, past: [] });
describe('movement and collection', () => {
  it('digs dirt and occupies it in one action', () => { const r = applyAction(board(['.....', '.d.gE', '#####']), 'MoveRight'); expect(r.accepted).toBe(true); expect(r.state.player).toEqual({ x: 1, y: 1 }); expect(r.state.cells[6]?.kind).toBe('empty'); expect(r.state.steps).toBe(1); });
  it('collects gold only once', () => { let s = board(['.....', '.g..E', '#####']); s = applyAction(s, 'MoveRight').state; s = applyAction(s, 'MoveLeft').state; s = applyAction(s, 'MoveRight').state; expect(s.collectedValue).toBe(1); });
  it('collects a default gem worth three', () => { expect(applyAction(board(['.....', '.G.gE', '#####']), 'MoveRight').state.collectedValue).toBe(3); });
  it('honors authored treasure values', () => { const l = board().level; const cells = l.cells.map(t => t.kind === 'gold_dirt' ? { ...t, data: { value: 5 } } : t); const s = createState({ ...l, cells, spawn: { x: 2, y: 1 } }); expect(applyAction(s, 'MoveRight').state.collectedValue).toBe(5); });
  it.each(['#', 'B', 'F'])('rejects solid %s with no steps or events', symbol => { const s = board(['.....', `.${symbol}.gE`, '#####']); const r = applyAction(s, 'MoveRight'); expect(r).toEqual({ accepted: false, state: s, events: [] }); expect(r.state).toBe(s); });
  it('rejects out-of-bounds movement', () => { const s = board(); expect(applyAction(s, 'MoveLeft').accepted).toBe(false); });
  it('does not trigger gravity for invalid movement', () => { const s = board(['..B..', '.#.gE', '.....', '#####']); expect(applyAction(s, 'MoveRight').state.cells).toEqual(s.cells); });
  it('permits upward movement without platform physics', () => { expect(applyAction(board(), 'MoveUp').state.player).toEqual({ x: 0, y: 0 }); });
  it('keeps input state immutable', () => { const s = board(); const old = JSON.stringify(s); applyAction(s, 'MoveRight'); expect(JSON.stringify(s)).toBe(old); });
  it('records a secret permanently while retaining marker', () => { let s = applyAction(board(['.....', '.S.gE', '#####']), 'MoveRight').state; expect(s.cells[6]?.kind).toBe('secret_entrance'); s = applyAction(s, 'MoveLeft').state; expect(s.secretVisited).toBe(true); });
  it('does not win below target and reports missing amount', () => { const s = board(['.....', '.E.g.', '#####']); const r = applyAction(s, 'MoveRight'); expect(r.state.status).toBe('playing'); expect(r.events).toContainEqual({ type: 'ExitLocked', missing: 1 }); });
  it('wins only upon exit entry with enough treasure', () => { let s = board(['.....', '.gE..', '#####']); s = applyAction(s, 'MoveRight').state; expect(s.status).toBe('playing'); const r = applyAction(s, 'MoveRight'); expect(r.state.status).toBe('won'); expect(r.events.at(-1)).toEqual({ type: 'LevelWon' }); expect(r.state.cells[7]?.kind).toBe('exit'); });
  it('rejects movement after completion', () => { const s = { ...board(), status: 'won' as const }; expect(applyAction(s, 'MoveRight').accepted).toBe(false); });
});
describe('gravity cascades', () => {
  it('falls through empty cells until supported', () => { const r = resolveGravity(board(['..B..', '...gE', '.....', '#####'])); expect(r.state.cells[12]?.kind).toBe('boulder'); expect(r.events.filter(e => e.type === 'BoulderMoved')).toHaveLength(2); });
  it.each(['#', 'd', 'g', 'G', 'E', 'S', 'B', 'F'])('rests on solid support %s without diagonal rolling', symbol => {
    const rows = symbol === 'E' ? ['..B..', '..E.g', '#####'] : ['..B..', `..${symbol}gE`, '#####'];
    const r = resolveGravity(board(rows)); expect(r.state.cells[2]?.kind).toBe('boulder');
  });
  it('never applies gravity to collectibles or dirt', () => { const s = board(['dGg..', '....E', '.....', '#####']); expect(resolveGravity(s).state.cells).toEqual(s.cells); });
  it('smashes fragile only after falling then moves in a later substep', () => { const r = resolveGravity(board(['..B..', '...gE', '..F..', '.....', '#####'])); expect(r.events.map(e => e.type)).toEqual(['BoulderWarning', 'BoulderMoved', 'FragileSmashed', 'BoulderMoved', 'BoulderMoved']); expect(r.state.cells[17]?.kind).toBe('boulder'); });
  it('processes bottom-to-top then left-to-right', () => {
    const r = resolveGravity(board(['.B.B.', '.....', '..B..', '...gE', '#####']));
    expect(r.events.filter(e => e.type === 'BoulderMoved').slice(0, 3)).toEqual([
      { type: 'BoulderMoved', from: { x: 2, y: 2 }, to: { x: 2, y: 3 } },
      { type: 'BoulderMoved', from: { x: 1, y: 0 }, to: { x: 1, y: 1 } },
      { type: 'BoulderMoved', from: { x: 3, y: 0 }, to: { x: 3, y: 1 } },
    ]);
  });
  it('moves stacked boulders once per substep without losing identity', () => { const r = resolveGravity(board(['..B..', '..B..', '...gE', '.....', '#####'])); expect(r.state.cells[12]?.kind).toBe('boulder'); expect(r.state.cells[17]?.kind).toBe('boulder'); expect(r.state.cells.filter(t => t.kind === 'boulder')).toHaveLength(2); });
  it('does not move onto the player when colliding', () => { const s = board(['..B..', '...gE', '.....', '#####'], { x: 2, y: 1 }); const r = resolveGravity(s); expect(r.state.status).toBe('stuck'); expect(r.state.cells[2]?.kind).toBe('boulder'); expect(r.state.cells[7]?.kind).toBe('empty'); expect(r.events.at(-1)?.type).toBe('PlayerStuck'); });
  it('resets fall distance between cascades', () => { const s = board(['..B..', '...gE', '..F..', '#####']); const first = resolveGravity(s); expect(resolveGravity(first.state).events).toEqual([]); });
  it('gives bit-identical states and events on repeated transitions', () => { const s = board(['..B..', '...gE', '..F..', '.....', '#####']); expect(JSON.stringify(applyAction(s, 'MoveRight'))).toBe(JSON.stringify(applyAction(s, 'MoveRight'))); });
  it('preserves treasure and boulder counts across cascade', () => { const s = board(['..BB.', '...gE', '..F..', 'G....', '#####']); const r = resolveGravity(s); expect(r.state.totalTreasureValue).toBe(4); expect(r.state.cells.filter(t => t.kind === 'boulder')).toHaveLength(2); expect(r.state.cells.filter(t => t.kind === 'gem')).toHaveLength(1); });
  it('stabilizes tall multiple fragile chains within cap', () => { const s = board(['..B..', '...gE', '..F..', '..F..', '..F..', '.....', '#####']); expect(resolveGravity(s).state.cells[27]?.kind).toBe('boulder'); });
});
describe('history and application boundary', () => {
  it('undo restores gold, replay awards once again', () => { const s = session(board(['.....', '.g..E', '#####'])); const move = dispatch(s, 'MoveRight'); const undo = dispatch(move.session, 'Undo'); expect(undo.state).toEqual(s.state); expect(dispatch(undo.session, 'MoveRight').state.collectedValue).toBe(1); });
  it('undo restores an entire fragile chain, treasure and step count', () => { const s = session(board(['..B..', '.g..E', '..F..', '.....', '#####'])); const r = dispatch(s, 'MoveRight'); expect(r.events.some(e => e.type === 'FragileSmashed')).toBe(true); expect(dispatch(r.session, 'Undo').state).toEqual(s.state); });
  it('collision is reversible and restart works from stuck', () => { const s = session(board(['..B..', '...gE', '#####'], { x: 1, y: 1 })); const r = dispatch(s, 'MoveRight'); expect(r.state.status).toBe('stuck'); expect(dispatch(r.session, 'Undo').state).toEqual(s.state); expect(dispatch(r.session, 'Restart').state).toEqual(s.state); expect(dispatch(r.session, 'MoveLeft').accepted).toBe(false); });
  it('invalid movement never records history', () => { const s = session(board()); expect(dispatch(s, 'MoveLeft').session).toBe(s); expect(dispatch(s, 'Undo').accepted).toBe(false); });
  it('retains at least ten actions and caps at fifty', () => { let s = session(board()); for (let i = 0; i < 60; i++) s = dispatch(s, i % 2 ? 'MoveLeft' : 'MoveRight').session; expect(s.past).toHaveLength(50); for (let i = 0; i < 10; i++) s = dispatch(s, 'Undo').session; expect(s.state.steps).toBe(50); });
  it('restart clears history and restores initial metadata', () => { const s = session(board()); const r = dispatch(dispatch(s, 'MoveRight').session, 'Restart'); expect(r.state).toEqual(s.state); expect(r.session.past).toEqual([]); });
  it('undo restores secret and won status', () => { const s = session(board(['.....', '.SEg.', '#####'], { x: 0, y: 1 }, 0)); const one = dispatch(s, 'MoveRight'); const two = dispatch(one.session, 'MoveRight'); expect(two.state.status).toBe('won'); expect(dispatch(two.session, 'Undo').state).toEqual(one.state); expect(dispatch(one.session, 'Undo').state.secretVisited).toBe(false); });
  it('pause blocks movement without altering domain state', () => { const c = new GameController(board().level); const before = c.session; c.command('Pause'); c.command('MoveRight'); expect(c.session).toBe(before); c.command('Pause'); c.command('MoveRight'); expect(c.session.state.steps).toBe(1); });
});
describe('schema and scoring', () => {
  it.each([null, {}, { ...board().level, width: 0 }, { ...board().level, cells: [] }, { ...board().level, biome: 'ice' }, { ...board().level, spawn: { x: -1, y: 0 } }, { ...board().level, treasureGoal: 100 }, { ...board().level, medalThresholds: { silver: 0, gold: 0 } }, { ...board().level, exit: { x: 0, y: 0 } }])('rejects malformed level %#', input => { expect(() => parseLevel(input)).toThrow(); });
  it('rejects unknown tile kinds', () => { const l = board().level; expect(() => parseLevel({ ...l, cells: l.cells.map((t, i) => i === 0 ? { kind: 'lava' } : t) })).toThrow(); });
  it('rejects invalid metadata and fractional treasure', () => { const l = board().level; for (const value of [-1, 0.5, Infinity, '5']) expect(() => parseLevel({ ...l, cells: l.cells.map(t => t.kind === 'gold_dirt' ? { ...t, data: { value } } : t) })).toThrow(); });
  it('rejects occupied spawn and duplicate exit', () => { const l = board().level; expect(() => parseLevel({ ...l, spawn: l.exit })).toThrow(); expect(() => parseLevel({ ...l, cells: l.cells.map((t, i) => i === 0 ? { kind: 'exit' } : t) })).toThrow(); });
  it('copies authored input to isolate later source mutations', () => { const l = board().level; const input = { ...l, cells: [...l.cells] }; const s = createState(input); input.cells[0] = { kind: 'bedrock' }; expect(s.cells[0]?.kind).toBe('empty'); });
  it('awards bronze, silver, gold only for completion', () => { const s = board(['.....', '.gG.E', '#####']); const level = { ...s.level, medalThresholds: { silver: 2, gold: 4 } }; expect(medal(s)).toBeNull(); expect(medal({ ...s, level, status: 'won', collectedValue: 1 })).toBe('bronze'); expect(medal({ ...s, level, status: 'won', collectedValue: 2 })).toBe('silver'); expect(medal({ ...s, level, status: 'won', collectedValue: 4 })).toBe('gold'); });
  it('handles zero total treasure and percentage', () => { expect(treasurePercent({ ...board(), totalTreasureValue: 0 })).toBe(100); expect(treasurePercent({ ...board(), totalTreasureValue: 4, collectedValue: 3 })).toBe(75); });
});
