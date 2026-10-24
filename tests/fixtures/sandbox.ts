import { type LevelDefinition, type Tile } from '../../src/core/model';
const width = 22, height = 14;
const tiles: Tile[] = Array.from({ length: width * height }, (_, i) => {
    const x = i % width, y = Math.floor(i / width);
    return { kind: x === 0 || x === width - 1 || y === height - 1 || (y === 5 && x !== 8) || (x === 15 && y >= 2 && y < 5) || (y === 9 && x >= 7 && x <= 10) ? 'bedrock' : 'empty' };
});
export const sandbox: LevelDefinition = { id: 'motion-sandbox', name: 'Motion Sandbox', width, height, tiles, spawn: { x: 80, y: 160 }, killY: 480, depth: 0, startWallet: 0, treasureQuota: 0, overlays: [], boulders: [] };
