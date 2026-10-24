import { IDLE, type GameState, type InputIntent } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
export type RouteAction = Readonly<{
    kind: 'walk' | 'down' | 'buy' | 'place';
    value: number;
}>;
export function route(index: number, paid = false): readonly RouteAction[] {
    if (index === 0)
        return [{ kind: 'walk', value: 144 }, ...(paid ? [{ kind: 'buy' as const, value: 0 }, { kind: 'place' as const, value: 0 }, { kind: 'walk' as const, value: 400 }, { kind: 'down' as const, value: 288 }] : [{ kind: 'walk' as const, value: 176 }, { kind: 'down' as const, value: 288 }, { kind: 'walk' as const, value: 400 }]), { kind: 'down', value: 480 }, { kind: 'walk', value: 112 }, { kind: 'down', value: 672 }, { kind: 'walk', value: 368 }, { kind: 'down', value: 832 }, { kind: 'walk', value: 432 }];
    if (index === 1)
        return [{ kind: 'walk', value: 176 }, { kind: 'down', value: 288 }, { kind: 'walk', value: 144 }, { kind: 'down', value: 480 }, { kind: 'walk', value: 400 }, { kind: 'down', value: 672 }, { kind: 'walk', value: 144 }, { kind: 'down', value: 832 }, { kind: 'walk', value: 80 }];
    return [{ kind: 'walk', value: 368 }, { kind: 'down', value: 288 }, { kind: 'walk', value: 336 }, { kind: 'down', value: 480 }, { kind: 'walk', value: 176 }, { kind: 'down', value: 672 }, { kind: 'walk', value: 400 }, { kind: 'down', value: 832 }, { kind: 'walk', value: 432 }];
}
export function solve(initial: GameState, index: number, paid = false): GameState {
    let s = initial;
    const tick = (input: Partial<InputIntent>) => { s = stepGame(s, { ...IDLE, ...input }).state; };
    tick({});
    for (const action of route(index, paid)) {
        if (action.kind === 'buy') {
            tick({ buyPlatformPressed: true });
            continue;
        }
        if (action.kind === 'place') {
            tick({ placePlatformPressed: true });
            continue;
        }
        const sign = action.value < s.player.position.x ? -1 : 1;
        for (let guard = 0; guard < 3000; guard++) {
            const reached = action.kind === 'walk' ? (sign < 0 ? s.player.position.x <= action.value + 1 : s.player.position.x >= action.value - 1) : s.player.position.y >= action.value - .01 && s.player.grounded;
            if (reached || s.status === 'won')
                break;
            tick(action.kind === 'walk' ? { moveX: sign } : { climbY: 1 });
            if (s.status === 'failed' || guard === 2999)
                throw new Error('Route stuck ' + index + ' ' + JSON.stringify(action) + ' ' + JSON.stringify(s.player));
        }
    }
    return s;
}
