export type Vec2 = Readonly<{
    x: number;
    y: number;
}>;
export type TileKind = 'empty' | 'soil' | 'compacted' | 'gravel' | 'hard' | 'ore_soil' | 'stone' | 'bedrock' | 'fragile';
export type Tile = Readonly<{
    kind: TileKind;
    lootId?: string;
    lootValue?: number;
    hardness?: number;
    oreStratum?: 'soil' | 'compacted' | 'gravel' | 'hard';
    maxIntegrity?: number;
    currentIntegrity?: number;
    lastHitTick?: number;
}>;
export type Overlay = Readonly<{
    id: string;
    cell: Vec2;
    kind: 'gem' | 'exit';
    value: number;
}>;
export type Boulder = Readonly<{
    id: string;
    position: Vec2;
    velocityY: number;
    falling: boolean;
    warningTicks: number;
    fallDistance?: number;
    nextFallTick?: number;
    fallFrom?: Vec2;
}>;
export type LevelDefinition = Readonly<{
    id: string;
    name: string;
    depth: number;
    width: number;
    height: number;
    tiles: readonly Tile[];
    spawn: Vec2;
    killY: number;
    startWallet: number;
    treasureQuota: number;
    overlays: readonly Overlay[];
    boulders: readonly Readonly<{
        id: string;
        cell: Vec2;
    }>[];
    goldHints?: readonly Readonly<{cell: Vec2; depositId: string}>[];
}>;
export type PlayerState = Readonly<{
    position: Vec2;
    velocity: Vec2;
    grounded: boolean;
    facing: -1 | 1;
    alive: boolean;
    climbing: boolean;
}>;
export type DigDirection = 'left' | 'right' | 'up' | 'down';
export type GameState = Readonly<{
    tick: number;
    /** Row-major packed unsigned 32-bit discovery words; JSON serializable. */
    discovered: readonly number[];
    level: LevelDefinition;
    tiles: readonly Tile[];
    player: PlayerState;
    traversal: Readonly<{from:Vec2;startedTick:number;ticks:number;kind:'walk'|'climb'|'fall';dropRequested?:boolean}>|null;
    status: 'playing' | 'won' | 'failed';
    wallet: number;
    levelGoldCollected: number;
    spentCoins: number;
    collectedLootIds: readonly string[];
    nextDigTick: number;
    miningContact: Readonly<{ cell: Vec2; direction: Exclude<DigDirection, 'up'> }> | null;
    platforms: readonly Vec2[];
    ignoredPlatforms: readonly Vec2[];
    boulders: readonly Boulder[];
    inventory: Readonly<{
        platforms: number;
    }>;
    ladders: readonly Vec2[];
    ladderProcessedCells: readonly Vec2[];
    pickaxePower: number;
}>;
export type InputIntent = Readonly<{
    moveX: -1 | 0 | 1;
    climbY: -1 | 0 | 1;
    downPressed?: boolean;
    placePlatformPressed?: boolean;
    buyPlatformPressed?: boolean;
}>;
export const IDLE: InputIntent = { moveX: 0, climbY: 0 };
export type Rejection = 'outOfRange' | 'indestructible' | 'cooldown' | 'playerOverlap' | 'outOfBounds' | 'notGrounded' | 'occupied' | 'insufficientFunds' | 'noPlatform';
export type GameEvent = Readonly<{
    type: 'Landed' | 'PlayerFell' | 'LevelWon' | 'QuotaReached';
}> | Readonly<{
    type: 'PlatformBought';
    cost: number;
}> | Readonly<{
    type: 'TileBroken';
    cell: Vec2;
    rockId: string;
}> | Readonly<{
    type: 'BoulderImpact';
    id: string;
    at: Vec2;
}> | Readonly<{
    type: 'ActionRejected';
    reason: Rejection;
}> | Readonly<{
    type: 'TileDug' | 'TileRegenerated' | 'LadderAdded' | 'SolidBlocked';
    cell: Vec2;
}> | Readonly<{
    type: 'TileHit';
    cell: Vec2;
    integrity: number;
    maxIntegrity: number;
    damage: number;
    crackStage: number;
}> | Readonly<{
    type: 'PlatformPlaced';
    cell: Vec2;
}> | Readonly<{
    type: 'TreasureCollected';
    id: string;
    value: number;
}> | Readonly<{
    type: 'BoulderReleased' | 'PlayerCrushed';
    id: string;
}> | Readonly<{
    type: 'BoulderMoved';
    id: string;
    from: Vec2;
    to: Vec2;
}>;
export type StepResult = Readonly<{
    state: GameState;
    events: readonly GameEvent[];
    motionPath?: readonly Vec2[];
}>;
