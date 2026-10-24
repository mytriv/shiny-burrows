import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { stepGame } from '../../src/core/simulation';
import { IDLE } from '../../src/core/model';
import { sandbox } from '../fixtures/sandbox';
it('V3-A no jump input produces ascent; support remains stable', () => {
    let state = createState(sandbox);
    for (let i = 0; i < 120; i++)
        state = stepGame(state, { ...IDLE, ...{ jumpPressed: true } }).state;
    expect(state.player.position.y).toBe(160);
    expect(state.player.grounded).toBe(true);
});
it('V3-A unsupported mole falls and lands without input', () => {
    let state = createState({ ...sandbox, spawn: { x: 272, y: 160 } });
    state = stepGame(state, IDLE).state;
    expect(state.player.velocity.y).toBeGreaterThan(0);
    for (let i = 0; i < 120; i++)
        state = stepGame(state, IDLE).state;
    expect(state.player.position.y).toBe(288);
});
