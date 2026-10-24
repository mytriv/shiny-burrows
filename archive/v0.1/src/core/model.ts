export type TileKind = 'empty' | 'dirt' | 'gold_dirt' | 'bedrock' | 'gem' | 'boulder' | 'fragile' | 'exit' | 'secret_entrance';
export type Vec2 = Readonly<{ x: number; y: number }>;
export type Tile = Readonly<{ kind: TileKind; data?: Readonly<Record<string, string | number | boolean>> }>;
export type LevelDefinition = Readonly<{
  id: string; name: string; biome: 'soil' | 'roots'; width: number; height: number;
  cells: readonly Tile[]; spawn: Vec2; exit: Vec2; treasureGoal: number;
  medalThresholds: Readonly<{ silver: number; gold: number }>; hint?: string;
}>;
export type GameState = Readonly<{
  levelId: string; level: LevelDefinition; cells: readonly Tile[]; player: Vec2;
  collectedValue: number; totalTreasureValue: number; steps: number; secretVisited: boolean;
  status: 'playing' | 'won' | 'stuck';
}>;
export type Move = 'MoveUp' | 'MoveDown' | 'MoveLeft' | 'MoveRight';
export type Command = Move | 'Undo' | 'Restart' | 'Pause';
export type GameEvent =
  | { type: 'PlayerMoved'; from: Vec2; to: Vec2 }
  | { type: 'TileDug'; at: Vec2 }
  | { type: 'TreasureCollected'; at: Vec2; value: number }
  | { type: 'BoulderWarning'; at: Vec2 }
  | { type: 'BoulderMoved'; from: Vec2; to: Vec2 }
  | { type: 'FragileSmashed'; at: Vec2 }
  | { type: 'PlayerStuck'; at: Vec2 }
  | { type: 'SecretVisited' }
  | { type: 'ExitLocked'; missing: number }
  | { type: 'LevelWon' };
export interface GameCommandResult { accepted: boolean; state: GameState; events: readonly GameEvent[] }
export const indexOf = (width: number, p: Vec2): number => p.y * width + p.x;
export const treasureValue = (tile: Tile): number => tile.kind === 'gem' || tile.kind === 'gold_dirt'
  ? (typeof tile.data?.value === 'number' ? tile.data.value : tile.kind === 'gem' ? 3 : 1) : 0;
