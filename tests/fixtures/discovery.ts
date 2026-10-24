import type {GameState} from '../../src/core/model';
/** Isolate existing geometry tests from exploration. Never shipped to production. */
export function revealAll(s:GameState):GameState{return {...s,discovered:s.discovered.map(()=>0xffffffff)};}
