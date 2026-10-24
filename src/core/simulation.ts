import { buyPlatform, placePlatform } from './platforms';
import { DT } from './constants';
import {discover} from './discovery';
import type { GameState, InputIntent, StepResult } from './model';
import { movePlayer } from './motion';
import { collectOverlays, contactDig, regenerate } from './mining';
import { traceLadders } from './ladders';
import { stepBoulders } from './boulders';
export function stepGame(state: GameState, input: InputIntent, dtSeconds = DT): StepResult {
    if (dtSeconds !== DT) throw new Error('Simulation requires fixed 1/60 second ticks');
    if (state.status !== 'playing') return { state, events: [] };
    const events: StepResult['events'][number][] = [];
    const apply = (r: StepResult): GameState => { events.push(...r.events); return r.state; };
    let next = { ...state, player: { ...state.player, facing: input.moveX || state.player.facing } };
    if (input.buyPlatformPressed) next = apply(buyPlatform(next));
    next = apply(regenerate(next));
    if (input.placePlatformPressed) next = apply(placePlatform(next));
    const moved=movePlayer(next,input);next=apply(moved);
    if(next.status==='playing') next=apply(contactDig(next,input));
    if (next.status === 'playing') next = apply(stepBoulders(next));
    if (next.status === 'playing') next = apply(collectOverlays(next));
    next=apply(traceLadders(next,moved.motionPath??[]));
    next=discover(next,state);
    if (state.levelGoldCollected < state.level.treasureQuota && next.levelGoldCollected >= state.level.treasureQuota) events.push({ type: 'QuotaReached' });
    return { state: { ...next, tick: state.tick + 1 }, events };
}
