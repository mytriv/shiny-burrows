import { DT, GRAVITY, MAX_FALL, ROCK_WARNING_TICKS, TILE_SIZE } from './constants';
import { type Boulder, type GameEvent, type GameState, type StepResult } from './model';
import { overlaps, playerBox, rockBox, solidBoxes } from './world';
export function stepBoulders(state: GameState): StepResult {
    const rocks = state.boulders.map(b => ({ ...b, position: { ...b.position } }));
    const order = rocks.map((_, i) => i).sort((a, b) => {
        const aa = rocks[a], bb = rocks[b];
        if (!aa || !bb)
            return 0;
        return bb.position.y - aa.position.y || aa.position.x - bb.position.x || (aa.id < bb.id ? -1 : aa.id > bb.id ? 1 : 0);
    });
    const events: GameEvent[] = [];
    let tiles = state.tiles;
    const terrain = (box: ReturnType<typeof rockBox>) => solidBoxes({ level: state.level, tiles }, box);
    for (const index of order) {
        let rock = rocks[index];
        if (!rock)
            continue;
        const rockId = rock.id;
        const solids = (box: ReturnType<typeof rockBox>) => [...terrain(box), ...rocks.filter((_, i) => i !== index).map(r => rockBox(r.position)).filter(r => overlaps(r, box))];
        const shatter = (box: ReturnType<typeof rockBox>, distance: number): boolean => {
            if (distance <= 0)
                return false;
            let broken = false;
            for (const solid of terrain(box)) {
                if (!overlaps(solid, box))
                    continue;
                const cell = { x: solid.left / TILE_SIZE, y: solid.top / TILE_SIZE }, at = cell.y * state.level.width + cell.x;
                if (tiles[at]?.kind !== 'fragile')
                    continue;
                const copy = tiles.slice();
                copy[at] = { kind: 'empty' };
                tiles = copy;
                events.push({ type: 'BoulderImpact', id: rockId, at: { x: solid.left, y: solid.top } }, { type: 'TileBroken', cell, rockId });
                broken = true;
            }
            return broken;
        };
        const probe = rockBox({ x: rock.position.x, y: rock.position.y + 0.01 });
        if (shatter(probe, rock.fallDistance ?? 0)) {
            rocks[index] = rock;
            continue;
        }
        if (solids(probe).some(b => overlaps(b, probe))) {
            if (rock.falling)
                events.push({ type: 'BoulderImpact', id: rock.id, at: { x: rock.position.x, y: rock.position.y + TILE_SIZE } });
            rocks[index] = { ...rock, falling: false, warningTicks: 0, velocityY: 0, fallDistance: 0 };
            continue;
        }
        if (!rock.falling) {
            rock = { ...rock, falling: true, warningTicks: ROCK_WARNING_TICKS, fallDistance: 0 };
            events.push({ type: 'BoulderReleased', id: rock.id });
        }
        if (rock.warningTicks > 0) {
            rocks[index] = { ...rock, warningTicks: rock.warningTicks - 1 };
            continue;
        }
        let vy = Math.min(MAX_FALL, rock.velocityY + GRAVITY * DT), y = rock.position.y;
        const from = rock.position, count = Math.max(1, Math.ceil(vy * DT / 4));
        let landed = false;
        for (let i = 0; i < count; i++) {
            const previousY = y;
            y += vy * DT / count;
            let box = rockBox({ x: rock.position.x, y });
            if (shatter(box, (rock.fallDistance ?? 0) + y - from.y)) {
                y = previousY;
                break;
            }
            for (const solid of solids(box))
                if (overlaps(box, solid)) {
                    y = solid.top - TILE_SIZE;
                    vy = 0;
                    landed = true;
                    box = rockBox({ x: rock.position.x, y });
                }
            if (overlaps(box, playerBox(state.player.position))) {
                // Keep final colliders separate even on a failed frame.
                y = playerBox(state.player.position).top - TILE_SIZE;
                rocks[index] = { ...rock, position: { x: rock.position.x, y }, velocityY: 0 };
                events.push({ type: 'PlayerCrushed', id: rock.id });
                return { state: { ...state, tiles, boulders: rocks, status: 'failed', player: { ...state.player, alive: false } }, events };
            }
        }
        const updated: Boulder = { ...rock, position: { x: rock.position.x, y }, velocityY: vy, falling: !landed, fallDistance: landed ? 0 : (rock.fallDistance ?? 0) + y - from.y };
        rocks[index] = updated;
        if (y !== from.y)
            events.push({ type: 'BoulderMoved', id: rock.id, from, to: updated.position });
        if (landed)
            events.push({ type: 'BoulderImpact', id: rock.id, at: { x: rock.position.x, y: y + TILE_SIZE } });
    }
    return { state: { ...state, tiles, boulders: rocks }, events };
}
