# Shiny Burrows — SDD v0.2: Digging Platformer Pivot

**Status:** implementation-ready specification for Codex  
**Date:** 2026-10-20  
**Supersedes:** v0.1 sections concerning movement, gravity, actions, undo, MVP scope and gameplay progression. Unchanged M0 tooling/engineering standards remain in effect.  
**Reference:** California Gold Rush (Digital Chocolate, 2009) / California Gold Rush: Bonanza! as *design inspiration*, never copy code, art, layout, brand, sound or exact levels.  
**Priority:** playable platforming/digging vertical slice before visual polish or bulk level creation.

## 0. Execution contract

1. **Inspect the actual repository first.** Read `docs/SDD.md`, `IMPLEMENTATION_STATUS.md`, sources and tests. Identify and document reusable components vs systems that need replacement. Do not assume project paths in this document exactly match the repo.
2. **Preserve M0:** exact Phaser **3.90.0**, strict TypeScript, Vite, existing lint/test/browser smoke infrastructure, pinned dependencies, license notices, responsive layout, keyboard/touch controls and offline bundle. No new runtime dependencies unless technically unavoidable and justified in writing before installation.
3. **Implement a focused gameplay pivot, not M2–M4 content.** Build and validate a new one-level playable vertical slice with movement, jumping, gravity, mining, gaps, bridge purchase/placement, treasure, energy, exit, reset and camera. Include a small optional branch and at least one falling boulder in that slice; support and explosives are future capabilities with interfaces only, not essential for this slice.
4. Keep **simulation authoritative and renderer independent**: `src/core` must not import Phaser, DOM, Canvas, performance clocks or browser globals. Phaser provides draw/input/audio and interpolates snapshots, not gameplay collisions or rules.
5. **Replace incompatible systems rather than accumulating two competing game modes.** Keep legacy M1 grid reducer/tests in an archived, explicitly excluded area only if valuable; remove old runtime calls to orthogonal turn reducer and turn-based gravity. Do not silently leave unused code/controls as if they were active gameplay.
6. Record all changes, trade-offs, tests and blockers in `IMPLEMENTATION_STATUS.md`, with a new *SDD v0.2 pivot* section. Don't claim a test was run if it wasn't. Provide a short migration summary at completion.

## 1. High concept and player experience

A family-friendly **2D side-view digging adventure with platform movement and light route-planning puzzles**. A small cartoon mole explores deeper underground mines, digs dirt, collects shiny gold and gems, spends earned currency on limited tools, installs one-cell wooden bridges over gaps, survives falling hazards and uncovers optional lateral secret passages. Levels form a descending sequence, with side tunnels as optional branches and quests.

**Central decision:** *Should I dig toward the visible treasure, spend money to cross this hole, or find a longer free route?* Digging changes traversability and may create an irreversible drop until a bridge or alternative route is found.

**Not** a board game where each arrow command teleports exactly one cell and levitates over empty space. **Not** a full physics sandbox, endless procedural world, hardcore platformer, grind/idle miner, shop simulator or imitation of copyrighted California Gold Rush material.

**Audience:** broad casual/family audience. Cute retro mobile/Java-era inspired hand-crafted 2D art, readable tiles, no cinematic 3D/AI-rendered look. Avoid positioning or designing monetization specifically for under-13 users; no external purchases, advertisements, personal data collection or retention mechanics in this slice.

## 2. Scope & acceptance priorities

### P0: required in the first vertical slice

- Side-view continuous horizontal movement using `left/right` held inputs; character has pixel/world position, velocity and collision bounds, not integer-only cell position.
- Gravity every simulation tick; walking off a ledge triggers a fall. Stable grounded detection, landing, head collisions and world bounds.
- **Jump** with explicit rules: while grounded, limited-height jump; no automatic infinite climbing of walls. Jump helps navigate **small** gaps but cannot trivialize all bridge puzzles.
- Dig **adjacent tiles** within a defined range from current position; direction selected by keyboard pointer/touch controls; dig only legal terrain, not bedrock. Mining must change collision immediately on the authoritative tick and yield loot deterministically.
- Collect gold/gems; earn coins; separate *current level value*, *wallet*, *spent coins* and *treasure quota*. Never conflate objective progress with purchase balance.
- Wooden bridge **one-tile span**, bought for coins and placed into legal empty tile position at character height, with solid top surface allowing walking across a single-tile gap. One purchase consumes its price exactly once on successful placement; invalid attempts are free and have feedback.
- One authored level with a meaningful gap, a paid bridge route, a longer alternate route requiring digging, minimum treasure quota, reachable exit, optional secret branch and a safely demonstrated falling boulder.
- Energy/stamina cost for **successful mining and tool actions**, optionally walking through time or distance later. No penalty for idle time; avoid hunger timers. Runs can fail when no practical energy/route remains; offer restart.
- Camera follows mole while respecting bounds; consistent user-space coordinates; viewport changes do not change gameplay physics.
- Keyboard and mobile on-screen controls; touch tool selector/place action must be easy to use and must not obstruct the level. Pause/reset.
- Automated tests for physics, digging, gap falls, bridge placement/payment, invariants, completion and browser smoke.

### P1: follow-up after P0 approval

- Falling boulder cascades with breaking fragile terrain and support placement.
- Explosives, maps/hints, shop expansions, multiple levels/biomes, NPC side quests, versioned persistence, audio/final retro art, medals/leaderboards. Existing falling-boulder code may be adapted in P0 but must obey realtime tick semantics and never break base gravity.
- Undo can be **checkpoint/restart**, not the old per-turn 50-snapshot Undo; a real-time frame-by-frame undo is specifically *not required*.

## 3. Technology and architecture

- Keep Phaser 3.90.0 as rendering/input framework. Use **custom deterministic lightweight AABB/tile collision physics**, not Phaser Arcade/Matter for domain decisions. Reason: the game rules, mining and bridges should remain testable under Node and portable to a future renderer.
- `src/core`: immutable/static level definitions, mutable internal runtime state as explicitly controlled, world/tile queries, collision solver, entity motion, dig, bridge, loot, stamina, objectives and hazards. Import no browser APIs.
- `src/app`: fixed timestep orchestration, input queue/intent, pause, session lifecycle, save/platform abstractions.
- `src/render` / scenes: Phaser sprites/primitive placeholders, smooth interpolation, camera, HUD, tool previews, animations.
- No dependency on sprites for tile occupation: ground/wall/top bridge collider derives from tile model.
- Level coordinates: integer cell `(col,row)` with positive y downward; continuous entity coordinates in **world pixels**; `TILE_SIZE = 32` logical pixels; tile and entity coordinate conversion helpers unit tested.
- Fixed simulation time step **1/60 seconds**. Accumulator with capped catch-up after tab backgrounding (e.g. at most 5 steps/frame), clamp very long elapsed frames; never make gameplay depend on display FPS. Pause stops simulation entirely.
- Determinism contract: identical level seed/config + identical **tick-indexed input intents** produce same core state/events. Define deterministic tie order where multiple tiles/objects are updated. No `Math.random` in simulation; if needed use seeded RNG.

### Proposed core API (adapt names if repo conventions differ)

```ts
export type InputIntent = Readonly<{
  moveX: -1 | 0 | 1;
  jumpPressed: boolean;     // edge-triggered
  digPressed: boolean;      // edge-triggered or explicit repeat controlled in app
  digDirection?: 'left' | 'right' | 'up' | 'down';
  placeBridgePressed: boolean;
  targetCell?: { x: number; y: number };
}>;

export function stepGame(state: GameState, input: InputIntent, dtSeconds: number): StepResult;
// StepResult = { state, events } with ordered immutable view of emitted events.
```

A specific internal design is free, but use a fixed `dtSeconds` in production and tests; `stepGame` must not accept Phaser sprites or read wall-clock time. Separate edge-trigger actions from held horizontal movement.

## 4. Platform motion and collision — canonical rules

Use tunable constants held in one source file. These **starter values are testable defaults** and can be tuned after playtesting without changing rules:

| Parameter | Initial value | Constraint |
| --- | ---: | --- |
| Tile size | 32 world px | stable geometry |
| Simulation rate | 60 Hz | fixed timestep |
| Horizontal speed | 96 px/s | ~3 cells/s |
| Gravity | 560 px/s² | positive y down |
| Jump initial speed | -200 px/s | upward impulse |
| Max fall speed | 360 px/s | terminal velocity |
| Player collider | 20×26 px | bottom-centered on feet |
| Ground grace / coyote time | 80 ms | optional but recommended, consistently tested |
| Dig reach | nearest 4-neighbor tile touching body / center within 1 tile | no digging remote walls |
| Dig cooldown | 0.15 s | edge/repeat policy consistent across controls |
| Bridge cost | 5 coins | configure via level/tool config |
| Initial energy | 30 units | tune per level |
| Dirt dig cost | 1 energy | no cost on rejected action |

- **No tile-stepping / grid snapping** for character movement. Collider resolves against all solid tiles with swept or sufficiently sub-stepped axis-aligned collision to avoid tunneling. Resolve X then Y consistently; do not phase through 1-tile floors even at terminal speed. Do not allow diagonal corner penetration.
- Standing needs physical support by a solid tile or bridge top. **If the feet have no collision surface, the mole must fall automatically** without directional input. Do not allow walking in midair. Horizontal air control is allowed at same speed in P0; tune later.
- Cannot move upward except by jumping or a later explicit ladder mechanic. Jump permitted only grounded (or grace window), cannot double jump. Jump height must be less than a selected designed obstacle threshold; ensure the authored puzzle gap cannot be bypassed with a jump.
- Diggable tile removed only after legal contact/range check and cooldown/energy check; physics collision updates in same tick so excavation directly under player causes a fall.
- Bedrock immutable; ground tile and bridge solidity consistent. Collected treasure should not become a floating solid wall unless explicitly embedded in a diggable tile.
- Player death/failure if crushed by boulder or falls beyond a kill boundary; show short failure feedback and allow fast restart. For a vertical descending mine, falling into an intended lower chamber is **not death** simply because fall distance is large; use a separately defined hazard/kill plane, not arbitrary fall-distance death.

## 5. Terrain, digging and collectibles

Starter tile types:

```text
empty           passable
soil            solid, diggable, 1 energy
ore_soil        solid, diggable, 1 energy, yields configured gold
stone           solid, nondiggable with starter claws
bedrock         solid, never diggable
fragile         solid, can shatter from boulder impact (P1 optional in first slice)
boulder         gravity-driven hazard/entity, NOT static terrain
bridge          one-cell player support, not diggable by default
exit            non-solid interaction region
secret          non-solid collectible/trigger
```

- Tiles have stable authored metadata (`lootValue`, `secretId`, etc.). Distinguish collectible overlay from solid substrate. Each loot source may pay out **once only**. Use integer coins/currency, no floating-point accounting.
- Dig direction from input faces adjacent reachable block. If the proposed cell intersects the player's current collider, reject to avoid trapping the player inside solids. Provide visual dig targeting highlight; rejected action emits descriptive event (`outOfRange`, `indestructible`, `insufficientEnergy`).
- HUD clearly distinguishes `Gold collected this level`, `Quota`, `Wallet`, `Energy`, selected tool, optional Secret. Collecting quota unlocks exit but doesn't auto-teleport the player.
- For performance avoid reconstructing tile sprites per frame: update only changed cells; chunking not required in one small level.

## 6. Bridges and player economy — normative behavior

**Design goal:** user may spend money to cross a single-cell hole, or take a longer free route. Both are legitimate solutions.

Bridge rules:

1. Bridge occupies exactly **one tile-width** and provides a one-way solid top at the cell's upper boundary. It is not a full vertical wall: player can pass beneath where space allows. It is not extendable across unlimited empty space unless purchased per cell.
2. Valid position is an **empty target cell** directly left or right of the player's current standing cell at foot/ground level, within one tile of the player; no remote placement.
3. Starting bank tile must be grounded or itself supported. Placement is allowed above a gap. Target must be within level bounds and must not overlap bedrock, soil, existing bridge, boulder, exit-critical collider or player body.
4. Before purchase show a ghost/preview colored valid/invalid, cost, and available wallet. Explicit click/tap/key confirms. Every successful placement deducts 5 coins **exactly once** and creates one persistent bridge. Insufficient funds do not mutate state.
5. Bridge supports mole from above, not other boulders in P0; whether it supports falling rocks is deferred. For determinism, boulders ignore bridge collisions until explicitly implemented.
6. The level must contain a path where the bridge saves effort and a separate free path through excavatable terrain. Never make a bridge obligatory if initial player wallet cannot afford it.
7. Wallet is earned during the level. For P0 reset wallet to authored start value on restart. Persisting money across levels belongs to later progression and requires explicit balance specification.

**No paid currency or actual-money transactions.** All purchases use in-level fictional coins only.

## 7. Falling boulders and cave hazards

This section preserves the game's signature mining danger, but must **not** impede implementation of core platforming. For P0 implement at least one boulder dropping when support is dug away; fragile-block crushing cascade is P1 unless already straightforward and tested.

- A boulder has stable ID, continuous position or cell-based occupancy with deterministic per-tick advancement, and clear collision bounds; it becomes unstable when support below is removed.
- Gravity or controlled step-by-step descent must be consistent with player motion and visible animation. Never update visual position independently from authoritative state. Use ordered events for `BoulderReleased`, `BoulderMoved`, `TileBroken`, `PlayerCrushed`.
- When a boulder lands on player, show failure; when it collides with stable terrain, stop. Explicitly document whether rocks are solid to player from sides in P0 (recommend yes).
- Chain reactions must not allow duplicated loot, out-of-bounds writes or infinite loops. If first slice omits chain breakage, add tests marking the omission as deliberate; do not imply it is complete.

## 8. Level design, secrets and completion

### One-level vertical slice: `First Burrow`

Author a compact horizontal-and-vertical layout (recommended 18–28 columns by 12–18 rows) that can scroll in a portrait viewport. Gameplay must prove:

1. Start at or near a cozy surface entrance with enough safe floor to learn movement/dig.
2. A visible gold pocket containing at least 5 coins **before** the key gap.
3. A one-cell gap across which placing a **5-coin bridge** is faster than going around. Design the geometry so jump range does not trivialize this decision (e.g. nearby low ceiling, altered gap span, or sufficiently wide section requiring more than one bridge); validate in tests and browser gameplay. **If geometry requires >1 bridge, rename the explicit test scenario appropriately; do not claim one tile bridges a two-cell gap.**
4. A longer no-purchase route that is physically possible through soil.
5. One optional side chamber / hidden tunnel with bonus treasure or secret marker.
6. One safe-to-observe boulder released by mining a supporting tile (position it so P0 players can anticipate it and avoid unavoidable death).
7. An exit region unlocked once `goldCollectedValue >= quota`, reached by physically moving into exit trigger; bonus treasure and secret not required to win.
8. Multiple tested routes: purchase bridge, use free alternate, collect secret, and replay after failed run.

**Level evaluation:** report collected gold value, optional secret, wallet remaining and energy used. Stars/medals may be simple placeholders in P0. The core design goal is route choice and excavation planning, not an arbitrary action-count minimization.

Long-term campaign model (not part of P0): descending mine chapters, linked levels, side galleries with optional quests, increasing terrain complexity and themed biomes; content hand-authored before procedural generation.

## 9. Input mapping, camera and UX

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move | A/D, left/right arrows (held) | left/right held controls |
| Jump | Space or W/up (pressed) | jump button |
| Dig | J or X + direction / point at adjacent tile | tap or drag-select adjacent tile + dig button |
| Tool selector | 1 = claws, 2 = bridge | toolbar icons |
| Place bridge | E or tool confirm with valid target | tap target + confirm |
| Pause | Esc | pause button |
| Restart | R or pause menu | restart button |

- On desktop, dig direction must be obvious and consistent. Define default facing direction for dig key when no explicit target is supplied. Avoid keyboard overlaps between `up` and jump and directional dig; select a deterministic priority.
- On mobile, left/right/jump and dig controls must permit simultaneous running and action without UI overlap; use pointer IDs/multitouch or equivalent. UI buttons should have large tappable areas (aim >=44 CSS px) and visual depressed state.
- **No on-screen Undo button in P0** unless a real-time-safe implementation exists. Old `Steps` counter is replaced by Gold/Quota/Wallet/Energy. Keep button placement compact and avoid huge blank margins.
- Camera follows player horizontally/vertically with smooth interpolation but clamps to world bounds; reset snaps to spawn without camera drifting; don't leak old camera state across level restarts.
- Use a consistent canvas scale, adapt to 390×844, 844×390, 1920×1080; prioritize grid/characters over overly large HUD boxes. Maintain obvious level context with surface decorations and underground layers. No downloaded runtime assets.
- Retro casual 2D aesthetic inspired by late Java-era mobile games: simple crisp tile textures, warm soil, cartoon mole sprites, distinct precious gems, direct readable UI. **No glossy AI-cinematic lighting**. Placeholder procedural pixel-style tiles acceptable for this pivot.
- Reduce-motion: transition/particle effects reduced without changing simulated movement speed, jump height or game rules.

## 10. Simulation state & invariants

Use explicit data contracts; suggested state:

```ts
type PlayerState = {
  position: { x: number; y: number }; // world px
  velocity: { x: number; y: number }; // world px/s
  grounded: boolean;
  facing: -1 | 1;
  energy: number;
  alive: boolean;
};
type GameState = {
  tick: number;
  levelId: string;
  tiles: TileGrid;
  player: PlayerState;
  boulders: BoulderState[];
  wallet: number;
  goldCollectedValue: number;
  treasureQuota: number;
  collectedLootIds: Set<string> | readonly string[];
  bridges: readonly GridCell[];
  discoveredSecrets: readonly string[];
  status: 'playing' | 'won' | 'failed';
};
```

Choose a safely serializable internal representation; `Set` can be internal only if snapshots/persistence serialize explicitly. Separate definition/static data from runtime modifications to avoid megabyte-scale copies each frame.

**Invariants:** finite numeric physics state; no negative wallet/energy; one payout per unique deposit; one charge per bridge; no overlapping player-solid at end of collision resolve; no walking unsupported; no digging out of range; level objective stable across purchases; pausing doesn't advance `tick`; deterministic replay of identical input sequence; reset reproduces initial state. A failed purchase/dig must not deduct energy or money.

## 11. Acceptance tests — mandatory

### Headless core tests

- `[P-MOVE-01]` Held right/left input advances continuous world position, not one tile per key press.
- `[P-FALL-01]` Mole on supported floor stays grounded and y is stable for >=120 ticks.
- `[P-FALL-02]` Dig tile directly below grounded mole; on subsequent ticks player falls and lands on lower solid surface.
- `[P-FALL-03]` Walking across a one-cell unsupported gap without jump/bridge initiates falling; cannot hover.
- `[P-COLL-01]` Cannot pass through bedrock wall, soil floor, ceiling or world bounds at max allowed speed.
- `[P-JUMP-01]` Can jump only on ground/grace; jump reaches documented bounded height; no unlimited jump; release/repress policy tested.
- `[P-DIG-01]` Adjacent soil digging deducts 1 energy; far-away dig, stone/bedrock, insufficient energy and cooldown violations do not mutate tile or cost.
- `[P-GOLD-01]` Mining ore yields exactly once; `wallet`, `goldCollectedValue`, quota and spend counters remain independent.
- `[P-BRIDGE-01]` Valid bridge placement costs exactly 5 coins, places exactly one one-way support tile, permits walking across a one-cell gap.
- `[P-BRIDGE-02]` Insufficient funds, occupied tile, remote placement or duplicate placement have no wallet/terrain effects.
- `[P-BRIDGE-03]` Bridge route and alternate no-purchase route each complete authored level.
- `[P-ROCK-01]` Removing support releases boulder; it falls; hit player triggers failure; landing on terrain stops it.
- `[P-EXIT-01]` Entering exit below quota doesn't win; reaching quota alone doesn't win; moving into exit after quota wins.
- `[P-RESET-01]` Restart returns terrain, wallet, gold, energy, boulders, player position and secrets to initial state.
- `[P-DET-01]` Same scripted 60 Hz input stream gives same state/event digest over 1,000 ticks in two independent runs.
- `[P-PAUSE-01]` Pause prevents simulation ticks and motion; resume doesn't cause giant physics jumps.
- `[P-SECRET-01]` Optional side tunnel can be discovered and its reward only claimed once.

### Browser tests

- Desktop keyboard playthrough, actual jump and fall, dig, bridge placement, win, failure/restart.
- Touch playthrough with simultaneous left/right+jump or dig, no stuck held inputs after pointer cancel/blur.
- Portrait 390×844, landscape 844×390, desktop 1920×1080 screenshots inspected; HUD/controls don't cover playable terrain.
- Resize during fall/airborne motion does not alter physics or teleport mole.
- Production build serves locally, no external asset requests, no browser errors.
- Existing green tests must either stay green or be deliberately rewritten when superseded, with documented mapping from old tests to new ones. Deleting tests to get green CI is not allowed.

## 12. Migration plan from current M0/M1

### Audit first

Produce a short migration table in `IMPLEMENTATION_STATUS.md`:

| Existing feature | Expected treatment |
| --- | --- |
| Phaser setup, Vite, lint, Vitest, Playwright | Reuse |
| Level grid/tiles/schema and asset notices | Reuse/extend with colliders and metadata |
| `applyAction` and turn-based orthogonal movement | Replace in runtime with tick-based `stepGame` |
| Turn-triggered rock gravity and ordered events | Adapt to fixed-timestep if feasible; do not reuse unmodified |
| M1 full-turn Undo/history | Retire from P0 UI; use restart/checkpoints later |
| Gold quota, secret, goal, restart | Reuse concept; update accounting/triggers |
| Procedural visual placeholders | Refine for platforming readability |
| Touch/keyboard single-command input | Refactor to held directional inputs and independent action edges |

### Milestones

**P0a — new movement sandbox**
- Continuous x/y player coordinates, held movement, jump, gravity, grounded, collision, renderer interpolation. One simple hole. Tests for support, fall, wall, jump and 3 viewports. **Gate:** an unsupported mole visibly falls; can't float or phase through walls.

**P0b — excavation & rewards**
- Adjacent dig, energy, solid tile changes, ore extraction, secret marker, quota/exit HUD. Tests for action validation and once-only rewards. **Gate:** dig floor -> fall, and loot doesn't duplicate.

**P0c — bridge economy & branching level**
- In-level wallet and five-coin one-cell bridge, legal preview/placement, a faster paid route and longer free route. Author `First Burrow`, solve both routes with automated scripts. **Gate:** both paths are genuinely playable; no jumping around intended decision.

**P0d — falling rock, UX, QA**
- One deterministic falling-boulder hazard, input/camera polish, quick restart, smoke tests, 3 screenshot layouts. **Gate:** all tests/build/lint green; no external requests; user can play end to end with mouse, touch, keyboard.

**STOP after P0d.** Request feedback before adding support items, multiple levels, final artwork, complex boulder-breakage chains, persistence, dynamic shop, or YouTube SDK.

## 13. User-facing completion report (required)

Codex must report:

1. Reused, removed and rewritten modules; all substantive deviations from spec with reasons.
2. Exact controls (including mobile placement interaction).
3. How to run dev server and tests.
4. Test totals + typecheck/lint/build and Playwright output (actual observations).
5. Two verified solution paths for `First Burrow` and whether bridge is optional.
6. Known limits, e.g. no continuous collisions for rocks, optional systems deferred.
7. Screenshot paths for portrait and landscape, and visual accessibility notes.

## 14. References and IP boundary

Research inspiration only (not instructions to replicate level design):

- California Gold Rush review (Pocket Gamer, 2009): https://www.pocketgamer.com/california-gold-rush/review/
- California Gold Rush: Bonanza! review (Pocket Gamer): https://www.pocketgamer.com/california-gold-rush-bonanza/review/
- California Gold Rush (MobyGames): https://www.mobygames.com/game/57945/california-gold-rush/

Shiny Burrows must have original character (mole), levels, tiles, dialogue, sound, visuals and systems. Use reference only to understand diggable side-view level design, exploration/resource efficiency and support-tool decision-making.
