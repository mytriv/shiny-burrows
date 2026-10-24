import { IDLE, type GameState, type InputIntent } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
export function ticks(s: GameState, n: number, input: Partial<InputIntent> = {}): GameState { for (let i = 0; i < n; i++)
    s = stepGame(s, { ...IDLE, ...input }).state; return s; }
