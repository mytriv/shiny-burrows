import { expect, it } from 'vitest';
import { createState } from '../../src/core/levels';
import { sandbox } from '../fixtures/sandbox';
import { stepGame } from '../../src/core/simulation';
import { IDLE, type GameState, type GameEvent } from '../../src/core/model';
function fixture(stacked = false): GameState { return createState({ ...sandbox, tiles: sandbox.tiles.map((t, i) => i % 22 === 4 && [4, 5, 6].includes(Math.floor(i / 22)) ? { kind: 'fragile' } : t), boulders: [{ id: 'bottom', cell: { x: 4, y: 2 } }, ...(stacked ? [{ id: 'top', cell: { x: 4, y: 1 } }] : [])] }); }
function cascade(initial: GameState) { let state = initial; const events: GameEvent[] = []; for (let i = 0; i < 300; i++) {
    const r = stepGame(state, IDLE);
    state = r.state;
    events.push(...r.events);
} return { state, events }; }
it('positive falls smash multiple fragile tiles exactly once and settle without oscillation', () => { const r = cascade(fixture()); expect(r.events.filter(e => e.type === 'TileBroken').map(e => e.cell)).toEqual([{ x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }]); expect(r.state.boulders[0]?.position.y).toBe(384); expect(r.state.levelGoldCollected).toBe(0); expect(r.events.filter(e => e.type === 'BoulderImpact')).toHaveLength(4); const stable = stepGame(r.state, IDLE); expect(stable.events.filter(e => ['TileBroken', 'BoulderImpact', 'BoulderReleased'].includes(e.type))).toEqual([]); });
it('stacked rocks follow a deterministic chain and cannot pass through each other', () => { const initial = fixture(true); const a = cascade(initial), b = cascade(initial); expect(a).toEqual(b); const bottom = a.state.boulders.find(r => r.id === 'bottom'), top = a.state.boulders.find(r => r.id === 'top'); expect(bottom?.position.y).toBe(384); expect(top?.position.y).toBe(352); expect(a.events.filter(e => e.type === 'TileBroken')).toHaveLength(3); expect(a.events.filter(e => e.type === 'BoulderReleased')).toHaveLength(2); expect(a.events.filter(e => e.type === 'BoulderImpact')).toHaveLength(5); });
it('rock initially resting directly on fragile has no impact momentum and does not smash it', () => { const state = fixture(); const r = cascade({ ...state, boulders: state.boulders.map(b => ({ ...b, position: { x: 128, y: 96 } })) }); expect(r.state.tiles[92]?.kind).toBe('fragile'); expect(r.events.filter(e => e.type === 'TileBroken')).toEqual([]); });
it('ore, soil and bedrock stop rocks without loss or generated rewards', () => { for (const kind of ['ore_soil', 'soil', 'bedrock'] as const) {
    const initial = fixture();
    const tiles = initial.tiles.map((t, i) => i === 4 * 22 + 4 ? { kind, ...(kind === 'ore_soil' ? { lootId: 'protected', lootValue: 8 } : {}) } : t);
    const r = cascade({ ...initial, tiles });
    expect(r.state.tiles[92]?.kind).toBe(kind);
    expect(r.state.boulders[0]?.position.y).toBe(96);
    expect(r.state.wallet).toBe(0);
} });
