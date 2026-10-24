import { type GameState, type LevelDefinition, type Tile, indexOf, treasureValue } from './model';

const kinds = new Set(['empty', 'dirt', 'gold_dirt', 'bedrock', 'gem', 'boulder', 'fragile', 'exit', 'secret_entrance']);
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
export function parseLevel(input: unknown): LevelDefinition {
  if (!record(input)) throw new Error('Level must be an object');
  const { width, height, cells, spawn, exit, medalThresholds: medals, treasureGoal } = input;
  if (!integer(width) || !integer(height) || width < 1 || height < 1 || width * height > 65536) throw new Error('Invalid dimensions');
  if (typeof input.id !== 'string' || !input.id || typeof input.name !== 'string' || !input.name || !['soil', 'roots'].includes(String(input.biome))) throw new Error('Invalid level metadata');
  if (input.hint !== undefined && typeof input.hint !== 'string') throw new Error('Invalid hint');
  if (!Array.isArray(cells) || cells.length !== width * height) throw new Error('Invalid cell count');
  for (const cell of cells as unknown[]) {
    if (!record(cell) || typeof cell.kind !== 'string' || !kinds.has(cell.kind)) throw new Error('Invalid tile kind');
    if (cell.data !== undefined && (!record(cell.data) || Object.values(cell.data).some(v => !['string', 'number', 'boolean'].includes(typeof v) || (typeof v === 'number' && !Number.isFinite(v))))) throw new Error('Invalid tile data');
    if (record(cell.data) && cell.data.value !== undefined && (!integer(cell.data.value) || cell.data.value < 0)) throw new Error('Invalid treasure value');
  }
  for (const point of [spawn, exit]) {
    if (!record(point) || !integer(point.x) || !integer(point.y) || point.x < 0 || point.y < 0 || point.x >= width || point.y >= height) throw new Error('Invalid coordinates');
  }
  const level = input as unknown as LevelDefinition;
  if (level.cells[indexOf(width, level.spawn)]?.kind !== 'empty') throw new Error('Spawn must be empty');
  if (level.cells[indexOf(width, level.exit)]?.kind !== 'exit' || cells.filter((t: Tile) => t.kind === 'exit').length !== 1) throw new Error('Exactly one matching exit required');
  const total = level.cells.reduce((n, t) => n + treasureValue(t), 0);
  if (!integer(treasureGoal) || !record(medals) || !integer(medals.silver) || !integer(medals.gold) || treasureGoal < 0 || treasureGoal > medals.silver || medals.silver > medals.gold || medals.gold > total) throw new Error('Invalid treasure thresholds');
  return { ...level, spawn: { ...level.spawn }, exit: { ...level.exit }, medalThresholds: { ...level.medalThresholds }, cells: level.cells.map(t => t.data ? { kind: t.kind, data: { ...t.data } } : { kind: t.kind }) };
}
export function createState(input: LevelDefinition): GameState {
  const level = parseLevel(input);
  return { levelId: level.id, level, cells: level.cells.slice(), player: { ...level.spawn }, collectedValue: 0,
    totalTreasureValue: level.cells.reduce((n, t) => n + treasureValue(t), 0), steps: 0, secretVisited: false, status: 'playing' };
}
