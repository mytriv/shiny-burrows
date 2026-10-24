import { integrity } from './config';
import {discover} from './discovery';
import { type GameState, type LevelDefinition, type TileKind } from './model';
import { cellBox, overlaps, playerBox, solidBoxes } from './world';
export function validateLevel(level: LevelDefinition): LevelDefinition {
    if (!Number.isInteger(level.width) || !Number.isInteger(level.height) || level.width < 1 || level.height < 1 || level.width * level.height > 65536 || level.tiles.length !== level.width * level.height)
        throw new Error('Invalid grid dimensions');
    if (!level.id || !level.name || !Number.isFinite(level.spawn.x) || !Number.isFinite(level.spawn.y) || !Number.isFinite(level.killY) || level.killY < level.height * 32)
        throw new Error('Invalid level metadata');
    const kinds: TileKind[] = ['empty', 'soil', 'ore_soil', 'stone', 'bedrock', 'fragile', 'compacted', 'gravel', 'hard'];
    if (level.tiles.some(t => !kinds.includes(t.kind) || (t.hardness !== undefined && (!Number.isSafeInteger(t.hardness) || t.hardness < 1 || !integrity({ kind: t.kind }))) || (t.kind !== 'ore_soil' && (t.lootId !== undefined || t.lootValue !== undefined))))
        throw new Error('Invalid tile kind');
    if (![level.startWallet, level.treasureQuota].every(v => Number.isSafeInteger(v) && v >= 0))
        throw new Error('Invalid economy');
    const ids = new Set<string>();
    let total = 0;
    for (const tile of level.tiles)
        if (tile.kind === 'ore_soil') {
            if (!tile.lootId || ids.has(tile.lootId) || !Number.isSafeInteger(tile.lootValue) || (tile.lootValue ?? -1) < 0)
                throw new Error('Invalid ore loot');
            ids.add(tile.lootId);
            total += tile.lootValue ?? 0;
        }
    for (const overlay of level.overlays) {
        if (!overlay.id || ids.has(overlay.id) || !['gem', 'exit'].includes(overlay.kind) || !Number.isSafeInteger(overlay.value) || overlay.value < 0 || !Number.isInteger(overlay.cell.x) || !Number.isInteger(overlay.cell.y) || overlay.cell.x < 0 || overlay.cell.y < 0 || overlay.cell.x >= level.width || overlay.cell.y >= level.height || level.tiles[overlay.cell.y * level.width + overlay.cell.x]?.kind !== 'empty')
            throw new Error('Invalid overlay');
        ids.add(overlay.id);
        if (overlay.kind !== 'exit')
            total += overlay.value;
    }
    if (!Number.isSafeInteger(total) || total < level.treasureQuota)
        throw new Error('Quota exceeds collectible value');
    const rockCells = new Set<string>();
    const hintCells=new Set<number>();
    for(const hint of level.goldHints??[]){
        const {x,y}=hint.cell,index=y*level.width+x,source=level.tiles.findIndex(t=>t.lootId===hint.depositId),distance=Math.abs(source%level.width-x)+Math.abs(Math.floor(source/level.width)-y);
        if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=level.width||y<0||y>=level.height||hintCells.has(index)||!['soil','compacted','gravel','hard'].includes(level.tiles[index]?.kind??'')||source<0||distance<2||distance>3)throw new Error('Invalid gold hint');
        hintCells.add(index);
    }
    for (const rock of level.boulders) {
        const key = `${rock.cell.x},${rock.cell.y}`;
        if (!rock.id || ids.has(rock.id) || rockCells.has(key) || !Number.isInteger(rock.cell.x) || !Number.isInteger(rock.cell.y) || rock.cell.x < 0 || rock.cell.x >= level.width || rock.cell.y < 0 || rock.cell.y >= level.height || level.tiles[rock.cell.y * level.width + rock.cell.x]?.kind !== 'empty' || overlaps(cellBox(rock.cell), playerBox(level.spawn)))
            throw new Error('Invalid boulder');
        ids.add(rock.id);
        rockCells.add(key);
    }
    if(level.spawn.x%32!==16||level.spawn.y%32!==0)throw new Error('Spawn must align to grid');
    const box = playerBox(level.spawn);
    if (box.left < 0 || box.right > level.width * 32 || box.top < 0 || box.bottom > level.height * 32)
        throw new Error('Spawn out of bounds');
    if (solidBoxes({ level, tiles: level.tiles }, box).some(b => overlaps(b, box)))
        throw new Error('Spawn overlaps terrain');
    return level;
}
export function createState(input: LevelDefinition, wallet = input.startWallet, pickaxePower = 1): GameState {
    if (!Number.isSafeInteger(wallet) || wallet < 0 || !Number.isSafeInteger(pickaxePower) || pickaxePower < 1)
        throw new Error('Invalid entry economy');
    const level = validateLevel(input);
    return discover({ tick: 0, traversal:null, discovered:Array<number>(Math.ceil(level.width*level.height/32)).fill(0), level, tiles: level.tiles.map(tile => { const max = integrity(tile); return max ? { ...tile, maxIntegrity: max, currentIntegrity: max } : { ...tile }; }), player: { position: { ...level.spawn }, velocity: { x: 0, y: 0 }, grounded: false, facing: 1, alive: true, climbing: false }, status: 'playing', wallet, pickaxePower, levelGoldCollected: 0, spentCoins: 0, collectedLootIds: [], nextDigTick: 0, miningContact: null, platforms: [], ignoredPlatforms: [], inventory: { platforms: 0 }, ladders: [], ladderProcessedCells: [], boulders: level.boulders.map(b => ({ id: b.id, position: { x: b.cell.x * 32, y: b.cell.y * 32 }, velocityY: 0, falling: false, warningTicks: 0 })) });
}
