import type { Tile } from './model';
export const BALANCE = {
    integrity: { soil: 2, ore_soil: 2, compacted: 3, gravel: 3, hard: 5, fragile: 3 },
    regenTicks: 180, digTicks: 24, climbSpeed: 72, ladderTolerance: 12,
    platformPrice: 5, upgradePrices: [8, 20] as readonly number[], pickaxePowers: [1, 2, 3] as readonly number[],
} as const;
export function integrity(tile: Tile): number {
    if (!(tile.kind in BALANCE.integrity)) return 0;
    return Math.max(2, tile.hardness ?? BALANCE.integrity[tile.kind as keyof typeof BALANCE.integrity]) + (tile.kind === 'ore_soil' ? 1 : 0);
}
