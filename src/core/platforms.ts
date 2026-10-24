import { BALANCE } from './config';
import type { GameState, Rejection, StepResult, Vec2 } from './model';
import { cellBox, overlaps, playerBox, playerSolids, rockBox } from './world';
import { sameCell } from './ladders';
export function platformTarget(s: GameState): Vec2 { return { x: Math.floor(s.player.position.x / 32) + s.player.facing, y: Math.round(s.player.position.y / 32) }; }
export function platformSupports(s: GameState, p: Vec2, x = s.player.position.x, y = s.player.position.y): boolean { return !s.ignoredPlatforms.some(i => sameCell(i, p)) && Math.abs(p.y * 32 - y) < .02 && x + 10 > p.x * 32 + 1e-7 && x - 10 < (p.x + 1) * 32 - 1e-7; }
export function validatePlatform(s: GameState, p = platformTarget(s)): Rejection | null {
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0 || p.x >= s.level.width || p.y >= s.level.height)
        return 'outOfBounds';
    const support = playerBox({ x: s.player.position.x, y: s.player.position.y + .01 });
    if (!s.player.grounded || !(playerSolids(s, support).some(b => overlaps(b, support)) || s.platforms.some(p => platformSupports(s, p))))
        return 'notGrounded';
    const intended = platformTarget(s);
    if (!sameCell(intended, p) || Math.abs(p.y * 32 - s.player.position.y) > .02)
        return 'outOfRange';
    if (overlaps(playerBox(s.player.position), cellBox(p)))
        return 'playerOverlap';
    if (s.tiles[p.y * s.level.width + p.x]?.kind !== 'empty' || s.platforms.some(b => sameCell(b, p)) || s.level.overlays.some(o => sameCell(o.cell, p)) || s.boulders.some(b => overlaps(rockBox(b.position), cellBox(p))))
        return 'occupied';
    if (s.inventory.platforms < 1)
        return 'noPlatform';
    return null;
}
export function buyPlatform(s: GameState): StepResult {
    if (s.wallet < BALANCE.platformPrice)
        return { state: s, events: [{ type: 'ActionRejected', reason: 'insufficientFunds' }] };
    return { state: { ...s, wallet: s.wallet - BALANCE.platformPrice, spentCoins: s.spentCoins + BALANCE.platformPrice, inventory: { platforms: s.inventory.platforms + 1 } }, events: [{ type: 'PlatformBought', cost: BALANCE.platformPrice }] };
}
export function placePlatform(s: GameState): StepResult {
    const cell = platformTarget(s), reason = validatePlatform(s, cell);
    if (reason)
        return { state: s, events: [{ type: 'ActionRejected', reason }] };
    return { state: { ...s, platforms: [...s.platforms, cell], inventory: { platforms: s.inventory.platforms - 1 } }, events: [{ type: 'PlatformPlaced', cell }] };
}
