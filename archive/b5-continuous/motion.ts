import { platformSupports } from './platforms';
import { sameCell, ladderTops } from './ladders';
import { BALANCE } from './config';
import { ladderAt } from './ladders';
import { DT, GRAVITY, MAX_FALL, PLAYER_HEIGHT, PLAYER_WIDTH, SPEED, TILE_SIZE } from './constants';
import { type GameState, type InputIntent, type StepResult, type GameEvent, type Vec2 } from './model';
import { playerBox, overlaps, playerSolids } from './world';
export function movePlayer(state: GameState, input: InputIntent): StepResult {
    const events: GameEvent[] = [], p = state.player;
    let x = p.position.x, y = p.position.y;
    const path: Vec2[] = [{ x, y }];
    const tops=ladderTops(state);
    let vx = input.moveX * SPEED, vy = Math.min(MAX_FALL, p.velocity.y + GRAVITY * DT);
    let ignored = state.ignoredPlatforms.filter(b => y - PLAYER_HEIGHT <= b.y * TILE_SIZE);
    const dropping = input.downPressed ? state.platforms.filter(b => platformSupports(state, b)) : [];
    ignored = [...ignored, ...dropping.filter(b => !ignored.some(i => sameCell(i, b)))];
    // Keep an acquired grip when released; falling past a new rung does not grab it.
    const ladder = (p.climbing || input.climbY && !input.moveX) && !dropping.length && !ignored.length ? ladderAt(state) : undefined;
    let climbing = !!ladder;
    const floorX=Math.floor(x/32), floorY=Math.floor((y+.01)/32);
    const floor=state.tiles[floorY*state.level.width+floorX];
    if(input.climbY>0 && !input.moveX && p.grounded && !dropping.length && (floor?.maxIntegrity || floor?.kind==='empty') && !state.platforms.some(c=>c.x===floorX&&c.y===floorY)) {
        vx=Math.max(-SPEED,Math.min(SPEED,(floorX*32+16-x)/DT));
    }
    if (ladder) {
        const center = ladder.x * 32 + 16;
        vx = input.moveX ? input.moveX * SPEED : input.climbY ? Math.max(-96, Math.min(96, (center - x) / DT)) : 0;
        vy = input.moveX ? 0 : input.climbY * BALANCE.climbSpeed;
        if (vy < 0) {
            const highest = tops.find(l=>l.x===ladder.x)?.y ?? ladder.y;
            const top = highest * 32;
            vy = Math.max(vy, (top - y) / DT);
        }
    }
    let grounded = false;
    // Step off an existing shaft at bank height without inventing an upper rung.
    // Down bypasses this foothold; ordinary falls already below it are unaffected.
    const shaftTops = input.climbY > 0 || input.downPressed ? [] : tops;
    const count = Math.max(1, Math.ceil(Math.max(Math.abs(vx), Math.abs(vy)) * DT / 4));
    for (let i = 0; i < count; i++) {
        x += vx * DT / count;
        x = Math.max(PLAYER_WIDTH / 2, Math.min(state.level.width * TILE_SIZE - PLAYER_WIDTH / 2, x));
        let box = playerBox({ x, y });
        for (const solid of playerSolids(state, box))
            if (overlaps(box, solid)) {
                x = vx > 0 ? solid.left - PLAYER_WIDTH / 2 : solid.right + PLAYER_WIDTH / 2;
                vx = 0;
                box = playerBox({ x, y });
            }
        path.push({x,y});
        // Input is only intent: a wall or a small supported sidestep retains grip.
        // Resolve X first, then release only when the actual position loses support.
        if(climbing && input.moveX && !ladderAt({...state,player:{...p,position:{x,y}}})) {
            climbing=false;
            vy=Math.min(MAX_FALL,p.velocity.y+GRAVITY*DT);
        }
        const down = vy >= 0;
        const oldY = y;
        y += vy * DT / count;
        if (y < PLAYER_HEIGHT) {
            y = PLAYER_HEIGHT;
            vy = 0;
        }
        box = playerBox({ x, y });
        for (const solid of playerSolids(state, box))
            if (overlaps(box, solid)) {
                y = down ? solid.top : solid.bottom + PLAYER_HEIGHT;
                if (down)
                    grounded = true;
                vy = 0;
                box = playerBox({ x, y });
            }
        if (down)
            for (const bridge of [...state.platforms,...shaftTops]) {
                if (ignored.some(b => sameCell(b, bridge)))
                    continue;
                const top = bridge.y * TILE_SIZE;
                if (oldY <= top + 1e-7 && y >= top && x + PLAYER_WIDTH / 2 > bridge.x * TILE_SIZE && x - PLAYER_WIDTH / 2 < (bridge.x + 1) * TILE_SIZE) {
                    y = top;
                    vy = 0;
                    grounded = true;
                }
            }
        path.push({x,y});
    }
    if (grounded && !p.grounded)
        events.push({ type: 'Landed' });
    const failed = y - PLAYER_HEIGHT > state.level.killY;
    if (failed)
        events.push({ type: 'PlayerFell' });
    return { state: { ...state, ignoredPlatforms: ignored, player: { ...p, position: { x, y }, velocity: { x: vx, y: vy }, grounded, facing: input.moveX || p.facing, alive: !failed, climbing }, status: failed ? 'failed' : state.status }, events, motionPath: path };
}
