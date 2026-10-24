import { integrity } from '../../core/config';
import type { LevelDefinition, Tile, TileKind } from '../../core/model';
function authored(id: string, name: string, depth: number, rows: readonly string[], ores: readonly [
    number,
    number,
    number
][], exit: readonly [
    number,
    number
], quota: number, hints: readonly [number,number,number,number][]=[]): LevelDefinition {
    const width = 16, height = rows.length;
    const kinds: Record<string, TileKind> = { '#': 'bedrock', '.': 'empty', s: 'soil', c: 'compacted', g: 'gravel', h: 'hard', f: 'fragile' };
    const tiles: Tile[] = rows.flatMap(row => { if (row.length !== width)
        throw new Error('Authored row width'); return [...row].map(k => ({ kind: kinds[k] ?? 'soil' })); });
    for (const [x, y, value] of ores) {
        const i = y * width + x, t = tiles[i];
        if (!t)
            throw new Error('Ore bounds');
        tiles[i] = { kind: 'ore_soil', hardness: integrity(t), oreStratum: t.kind === 'hard' ? 'hard' : t.kind === 'gravel' ? 'gravel' : t.kind === 'compacted' ? 'compacted' : 'soil', lootId: id + '-' + x + '-' + y, lootValue: value };
    }
    return { id, name, depth, width, height, tiles, goldHints:hints.map(([x,y,gx,gy])=>({cell:{x,y},depositId:id+'-'+gx+'-'+gy})), spawn: { x: 80, y: 128 }, killY: height * 32, startWallet: 0, treasureQuota: quota, overlays: [{ id: id + '-exit', kind: 'exit', value: 0, cell: { x: exit[0], y: exit[1] } }], boulders: [] };
}
export const firstBurrow = authored('first-burrow', 'First Burrow', 0, [
    '################',
    '#..............#',
    '#..............#',
    '#..s....s......#',
    '#ssss.sssssssss#',
    '#ssss.sssssssss#',
    '#ssss.sssssssss#',
    '#ssss.sssssssss#',
    '#..............#',
    '#ssssssssssssss#',
    '#ssssssssssssss#',
    '#ssssssssssssss#',
    '#ssssssssssssss#',
    '#..............#',
    '#..............#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#..............#',
    '#..............#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#..............#',
    '################',
], [[3, 3, 10], [8, 3, 6], [12, 10, 5], [3, 16, 7], [11, 23, 8], [6, 18, 9], [3, 6, 14], [7, 6, 22]], [13, 25], 20, [[4,5,3,6],[6,5,7,6]]);
export const amberHollow = authored('amber-hollow', 'Amber Hollow', 30, [
    '################',
    '#..............#',
    '#..............#',
    '#..c...........#',
    '#cccccccccccccc#',
    '#cccccccccccccc#',
    '#cc...ccccccccc#',
    '#cc...ccccccccc#',
    '#..............#',
    '#ggggggggghgggg#',
    '#ggggggggghgggg#',
    '#ggggggggghgggg#',
    '#gggggggggggggg#',
    '#..............#',
    '#..............#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#..............#',
    '#..............#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#..............#',
    '################',
], [[3, 3, 14], [5, 5, 12], [4, 10, 12], [12, 16, 15], [4, 23, 18], [9, 18, 24], [10, 10, 36]], [2, 25], 45, [[8,10,10,10],[9,16,9,18]]);
export const goldenDepths = authored('golden-depths', 'Golden Depths', 60, [
    '################',
    '#..............#',
    '#..............#',
    '#..g...........#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#gggggggggggggg#',
    '#..............#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#..............#',
    '#..............#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#..............#',
    '#..............#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhh#',
    '#..............#',
    '################',
], [[3, 3, 20], [11, 6, 18], [10, 10, 20], [5, 16, 24], [12, 23, 40], [2, 18, 32], [7, 12, 28]], [13, 25], 70, [[8,11,7,12],[4,18,2,18]]);
export const adventureLevels = [firstBurrow, amberHollow, goldenDepths] as const;
