import { type GameCommandResult, type GameState, type Move } from './model';
import { createState } from './levels';
import { applyAction } from './reducer';
export type Session = Readonly<{ state: GameState; past: readonly GameState[] }>;
export function dispatch(session: Session, command: Move | 'Undo' | 'Restart'): GameCommandResult & { session: Session } {
  if (command === 'Restart') {
    const state = createState(session.state.level);
    return { accepted: true, state, events: [], session: { state, past: [] } };
  }
  if (command === 'Undo') {
    const state = session.past.at(-1);
    if (!state) return { accepted: false, state: session.state, events: [], session };
    return { accepted: true, state, events: [], session: { state, past: session.past.slice(0, -1) } };
  }
  const result = applyAction(session.state, command);
  return { ...result, session: result.accepted ? { state: result.state, past: [...session.past.slice(-49), session.state] } : session };
}
