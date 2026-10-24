import { type Command, type LevelDefinition } from '../core/model';
import { createState } from '../core/levels';
import { dispatch, type Session } from '../core/history';
export class GameController {
  session: Session;
  paused = false;
  constructor(level: LevelDefinition) { this.session = { state: createState(level), past: [] }; }
  command(command: Command) {
    if (command === 'Pause') { this.paused = !this.paused; return null; }
    if (this.paused && command !== 'Restart') return null;
    if (command === 'Restart') this.paused = false;
    const result = dispatch(this.session, command);
    this.session = result.session;
    return result;
  }
}
