# Shiny Burrows — Spec-Driven Development (SDD)

**Version:** 0.1.0  
**Status:** Implementation-ready MVP specification  
**Audience:** Codex / implementers / reviewers  
**Target:** Browser-first, mobile-first, potentially YouTube Playables  
**Language:** TypeScript  
**Working title:** Shiny Burrows

## 0. Execution contract for Codex

Implement the MVP as described, in small vertical slices, with automated tests. Treat this specification as the source of truth. Do not silently invent or change gameplay rules. Where a rule is explicitly marked *deferred*, do not implement it. Maintain an `IMPLEMENTATION_STATUS.md` that tracks each milestone, acceptance test, decisions, and known limitations. Before editing dependencies or architecture, explain the reason in that file. Do not rely on remote services or downloaded runtime assets. Generate placeholder visuals locally using primitive drawing, then integrate licensed art as a later step.

**Definition of done:** application builds, typechecks, passes unit and browser smoke tests; starts without internet after assets are locally available; responds to keyboard, mouse, and touch; 10 curated levels are playable; gameplay is deterministic and undoable; save/load works; gameplay logic can run in Node without the renderer.

## 1. Product vision

A cozy, family-friendly 2D puzzle-adventure about a charming mole digging downward through handcrafted underground levels to collect as many shiny treasures as possible. Digging permanently changes the grid. Unstable rocks fall when their supporting cell is removed and can smash weak tiles, reveal secrets, collect or destroy access routes, or block treasure. Players plan excavation, anticipate gravity, explore optional side tunnels, and earn medals for efficient treasure collection.

**Hook:** *Dig smart. Find shiny secrets.*

**Not:** idle miner, endless runner, fully random sandbox, complex combat, survival simulator, resource grind, 3D game.

**Audience:** broad, family-friendly casual audience. Visuals may appeal to children, but do not assume classification as a made-for-kids product. Avoid monetization, personal data collection, user accounts, chats, ads, and manipulative retention in MVP. Product should be playable without reading large amounts of text.

## 2. Platform, technology, dependency policy

- TypeScript `strict: true`, ES modules, Vite for dev/build, package lock committed.
- **Chosen rendering adapter:** Phaser 3 stable or Phaser 4 stable, pinned to an exact release after checking official documentation. Do not mix major-version APIs. Prefer Phaser 3 if Phaser 4-specific features provide no value for MVP.
- **Engine-independent domain:** `src/core/**` may import only TypeScript internal modules; no Phaser, DOM, Canvas, React, browser globals, random global state, or wall-clock time.
- Phaser only for display, camera, animation, sound, and pointer/keyboard input mapping. Core simulation owns movement, collision, digging, falling, breakage, completion and scoring.
- No generic physics engine, no React, no backend, no global state-management framework.
- Core sim should also run headlessly under Node for tests and level validation.
- Use Canvas/WebGL as supported by Phaser. Bundle code/assets locally; no CDN at runtime.
- Browser platform adapter for development; later YouTube adapter behind same interface. YouTube integration MUST NOT block local play.
- Prefer minimal dependencies (TypeScript, Vite, test runner, Phaser, browser automation as development dependencies).
- Document all third-party assets and licenses in `ASSET_LICENSES.md`.

## 3. Visual and UX direction

**Updated visual direction (2026-10-20, user request):** Original retro casual 2D side-view tile adventure inspired by classic Java-era and early mobile digging games. Gameplay readability takes priority over decorative richness. Use flat, high-contrast color clusters, crisp square tiles, bright gems and gold, small cute cartoon moles, and a compact classic mobile HUD with large controls. Keep the atmosphere warm, nostalgic, friendly to children and a broad casual audience. Avoid painterly backgrounds, cinematic compositions, 3D-like rendering, AI-poster aesthetics, excessive glow and clutter. Every tile must have a distinct silhouette or pattern: heavy faceted boulders with instability warnings, visibly cracked fragile blocks, standout treasure, and recognizable secret passages. This update supersedes conflicting visual suggestions below; simulation and milestone scope remain unchanged.

- Cozy retro adventure with friendly cartoon moles, warm brown soil and roots, bright resources and simple handcrafted underground tiles. Use a restrained flat palette and sparse decoration.
- Protagonist: expressive mole, miner helmet with lamp, small bag, scarf and digging tool. The mole is a game character, not a photorealistic animal.
- Game is a **side-view, tile-grid puzzle**, not freeform terrain sculpting.
- Square cells; use crisp low-resolution 2D tile art scaled with nearest-neighbor filtering. The prototype uses original procedural 24×24 sprites rendered at 48×48 logical pixels.
- Gameplay readability beats illustration complexity: unstable blocks have visible tremble/cracks and a distinct outline; collectibles, reinforced stone, diggable soil and empty cells must be instantly distinguishable.
- Support portrait and landscape with camera zoom/UI rearrangement; preserve accessible tap targets and avoid covering critical cells.
- Design mobile interactions first; keyboard on desktop. Avoid tiny UI text and rely on icons with textual labels in menus.
- Generate original prototype sprites procedurally. Any future tile sheets must preserve readable silhouettes, consistent pixel grids, transparency, licensing and the retro casual 2D direction.

## 4. MVP scope

### Included

1. Main menu with Play, Continue, Level Select, Sound toggle.
2. 10 handcrafted puzzle levels spanning 2 aesthetic biomes: Cozy Soil and Root Tunnels (biome visuals may be simple placeholders).
3. Orthogonal tile-grid movement and directional digging.
4. Dirt, gold-bearing dirt, immovable bedrock, empty space, collectible gems, unsupported falling boulders, breakable fragile floor, goal/exit, one secret side passage entrance.
5. Deterministic gravity/chain reactions with controlled breakage.
6. Undo (at least last 10 player actions), Restart, optional hint as a static per-level tip.
7. Goals: collect minimum treasure and reach exit; track optional additional treasure and secret.
8. Results: completion, % treasure collected, medal, action count, secrets found.
9. Persist unlocked levels and best medals/stats through a versioned platform adapter.
10. Keyboard/touch input, sound toggle, pause/resume, resize handling, no network requirement.

### Excluded until post-MVP

Procedural level generation; automatic miners; shop/upgrades; crafting; enemies; NPC dialogue and full quests; water/lava/complex fluids; dynamite; leaderboards; online features; cloud sync beyond an optional platform adapter; advertisements; in-app purchases; time-limited energy; multiplayer.

## 5. Grid and state model

Coordinates: `x` increases right, `y` increases down; cells are integer indexed. A level is a fixed-width/fixed-height rectangular grid (recommended starter size 12×16, adjustable per level). Tile state is **never inferred from sprite positions**.

```ts
type TileKind =
  | 'empty'
  | 'dirt'
  | 'gold_dirt'
  | 'bedrock'
  | 'gem'
  | 'boulder'
  | 'fragile'
  | 'exit'
  | 'secret_entrance';

type Vec2 = Readonly<{ x: number; y: number }>;

type Tile = Readonly<{
  kind: TileKind;
  // Used only when a tile requires metadata, such as remaining gold value.
  data?: Readonly<Record<string, string | number | boolean>>;
}>;

type LevelDefinition = Readonly<{
  id: string;
  name: string;
  biome: 'soil' | 'roots';
  width: number;
  height: number;
  cells: readonly Tile[]; // row major, width*height
  spawn: Vec2;
  exit: Vec2;
  treasureGoal: number;
  medalThresholds: Readonly<{ silver: number; gold: number }>;
  hint?: string;
}>;

type GameState = {
  levelId: string;
  cells: Tile[];
  player: Vec2;
  collectedValue: number;
  totalTreasureValue: number;
  steps: number;
  secretVisited: boolean;
  status: 'playing' | 'won' | 'stuck';
};
```

Implementation may improve types (e.g. discriminated unions) without changing semantics. Gems are represented as one-cell collectibles occupying their own cell; gold-bearing dirt awards value when dug and disappears. Exit and secret entrance are traversable special floor/cell markers, not physics objects. Use overlays if necessary rather than rewriting their tile type during entity movement.

## 6. Authoritative turn/physics rules

**Important:** The game is turn-based under the hood even if it animates continuously. One accepted player command => zero or one move/dig action => deterministic gravity resolution until stable => record a single undo snapshot. Animations must never affect the simulation outcome.

### 6.1 Input and movement

- Accepted commands: `MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`, `Undo`, `Restart`, `Pause`.
- From an adjacent target: empty/exit/secret/gem is traversable; dirt/gold_dirt is dug into and the player occupies the cleared target as **one action**; bedrock/boulder/fragile are not directly traversable or diggable in MVP.
- Collecting gem by entering its cell awards its value (default gem = 3); digging gold_dirt awards 1. Values are authored per level or use documented defaults.
- Invalid movement into bedrock, boulder, fragile, out of bounds does not consume a turn and does not trigger physics.
- No free-fall or separate platformer physics for the player. The player moves exactly one adjacent cell per accepted directional action, including upward movement through empty space. This is an abstract puzzle rule, not a jumping/platforming system.
- The player must remain within the map boundaries. Input repeats must be throttled to a consistent cadence and must not bypass turn resolution.

### 6.2 Gravity

- **Only `boulder` tiles fall.** Other tile kinds never fall in MVP.
- A boulder is unsupported when the cell directly below is `empty` (or a traversable gem/exit/secret tile if the special rule below explicitly allows; MVP simplification: they are considered solid support). It moves down exactly one cell per gravity substep.
- Process boulders in deterministic order: bottom-to-top, then left-to-right for each substep; loop substeps until stable. Cap substeps to level height × number of boulders + safety factor; exceeding cap is a simulation error.
- Boulder falls through `empty` cells only. If directly below is `fragile`, it **smashes that tile only after having fallen at least one cell during the current gravity cascade**; the fragile cell becomes `empty`, then the boulder continues downward on the next substep.
- Boulder does not smash dirt, gold_dirt, bedrock, gems, exits, other boulders, or secrets.
- Boulder cannot roll diagonally in MVP. No random movement.
- If a falling boulder attempts to enter the player's cell: set `status='stuck'` and show a gentle retry screen, with no violent depiction. Do not move the boulder onto the player. `Undo` and `Restart` remain available.
- A boulder that starts directly above fragile without having fallen may rest safely; this ensures a player can intentionally release it by removing lower support elsewhere where geometry allows. If a level uses this behavior, validate it explicitly.
- Show visual warning for boulders that are about to fall, but only after the legal command is evaluated and before animation completes; no real-time countdown.

### 6.3 Cascade and conservation

- After each accepted movement/dig action, fully resolve gravity and fragile destruction before accepting the next command.
- No gold is generated or lost except as an explicitly collectible tile that has been dug/entered. Do not destroy treasure via physics in MVP.
- Every resolved state is a pure deterministic function of prior state + action. Repeat simulations produce bit-identical semantic state.
- Undo restores **all** player, tile, treasure, secret, status, and action counter state before the latest accepted command (including resulting gravity chain).

### 6.4 Completion

- A level is won only when `collectedValue >= treasureGoal` AND player enters exit.
- Reaching exit without enough treasure does not complete the level; display missing amount.
- Visiting an optional `secret_entrance` marks `secretVisited=true`; may lead to a bonus treasure alcove within the same map in MVP, not a separate level.
- A 'stuck' condition from boulder interaction is reversible via Undo or Restart. No permanent save of a stuck state.
- Do not attempt to auto-detect every unwinnable board in MVP; Undo and Restart address self-blocked routes.

## 7. Scoring and progression

- Mandatory collectible threshold is authored per level and must be <= total collectible value.
- For initial version: Bronze = level completed; Silver = completed with at least the level's `medalThresholds.silver` collected; Gold = at least `medalThresholds.gold` collected. Medal thresholds must satisfy `goal <= silver <= gold <= total`.
- Additional UI shows count of actions, secret found status, best previous medal and collected amount. Steps are informative, not an MVP fail condition.
- Unlock next level on first win; replay any unlocked level. Do not lock advancement behind perfect completion or secret discovery.
- Across chapters, lower/deeper levels are unlocked sequentially; side branches are optional secrets within authored levels for MVP.

## 8. Content and tutorial progression (10 levels)

All levels must be **fully authored and solvable** by the validation tool; these descriptions define required learning goals, not sufficient level layouts:

1. `01_first_dig`: movement, dig dirt, collect first gold, exit.
2. `02_shiny_detour`: obvious gold detour vs short path to exit; demonstrate collect goal.
3. `03_hidden_nook`: optional one-cell side tunnel with gem.
4. `04_wobbly_rock`: supported boulder visibly falls after soil removed, no unavoidable damage.
5. `05_rock_bridge`: falling boulder closes a shortcut; route order matters.
6. `06_crack_and_drop`: boulder gains fall distance then smashes fragile tile.
7. `07_underground_choice`: alternative routes; high-value gem requires planning.
8. `08_root_crossroads`: root biome, one secret entrance, blocked route possibility.
9. `09_chain_reaction`: multiple boulders and fragile blocks in a deterministic sequence.
10. `10_the_shiny_vault`: combines side secret, treasure threshold and carefully timed rock fall.

**Level validation:** each authored level should have an automated reachable winning command sequence recorded as a fixture; test simulates it. Level 4 onward should additionally demonstrate the intended unique mechanic. Add level 10 golden-medal solution or document why not feasible. Keep tutorial tips short and skippable.

## 9. Functional modules / proposed structure

```text
shiny-burrows/
  docs/
    SDD.md
    IMPLEMENTATION_STATUS.md
    DECISIONS.md
  public/
    assets/                     # initially locally generated placeholders
  src/
    core/
      model.ts                  # immutable/public types
      levels.ts                 # schema validation + loader
      reducer.ts                # applyAction pure transition
      gravity.ts                # deterministic cellular gravity
      scoring.ts                # win and medal calculations
      history.ts                # undo snapshot management
      serialization.ts          # versioned save model
    content/
      levels/                   # JSON/TS authored levels
    app/
      GameController.ts         # game state and command dispatch
      PlatformStore.ts          # persistence interface
      BrowserStore.ts
      YoutubeStore.ts           # optional later integration
    presentation/
      phaser/
        BootScene.ts
        MenuScene.ts
        LevelScene.ts
        HudScene.ts
        input.ts
        tiles.ts
        effects.ts
    main.ts
  tests/
    unit/
    levels/
    e2e/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

**Interfaces:**

```ts
interface GameCommandResult {
  accepted: boolean;
  state: GameState;
  events: readonly GameEvent[]; // e.g. TileDug, TreasureCollected, BoulderMoved, FragileSmashed, LevelWon
}

interface SaveStore {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
}
```

- `applyAction(state, action)` must be pure; it may return a new state + events. Never render or play audio in core.
- Presentation reads `GameState` and event list; animates events in chronological order; dispatches next action only when sequence finishes (or skips animations instantly in test mode).
- Include versioned save migration or safe reset strategy; corrupted save must not crash startup.
- BrowserStore can use localStorage in regular browser builds. **YouTube adapter must use the official Playables SDK for game data and respect relevant certification rules; do not assume BrowserStore is compliant inside YouTube.**
- For YouTube build load the official SDK before game code as required and implement lifecycle callbacks such as first frame/game ready, pause/resume and audio status using official docs. Do not invent API signatures; consult current Google reference when implementing integration.

## 10. Input and UI

- Desktop: arrow keys/WASD to move/dig; Z or Ctrl+Z for Undo; R for Restart; Escape for pause.
- Touch: tap one of four large on-screen directional buttons; optionally swipe one tile direction (must be configurable/discoverable). No gestures requiring multi-touch.
- Mouse: click on directional controls; optionally click directly adjacent tile to move/dig.
- UI: level title, collected/target count, Undo, Restart, Pause, sound toggle. On completion show medal, collected/total, secret marker, Next Level, Replay.
- Ensure tapping UI cannot accidentally dispatch a dig command. Avoid double actions from both pointer and touch events.
- Preserve state on resize, orientation change, tab blur, and game pause. Graphics must be responsive even if viewport is initially zero width/height.

## 11. Performance and accessibility

- Target a responsive first interactive scene quickly; aim for 60 FPS on common mobile devices, degrade effects before logic.
- Lazy-load heavy level art; use texture atlases; avoid allocating arrays every animation frame.
- Core turns should complete in a few milliseconds on MVP maps, tested with realistic mobile simulation sizes.
- Limit animation queue duration; allow fast-forward/skip for multi-boulder cascades.
- No essential mechanic conveyed by color alone. Respect browser reduced-motion preferences where feasible, support mute, retain readable UI at small viewports.
- No network dependency during gameplay. Avoid collecting personal data.
- Treat Playables certification details as separately verified at deployment time, not hardcoded assumptions.

## 12. Automated testing / acceptance criteria

### Core

- Digging a dirt tile moves the player into it in exactly one accepted action.
- Gold-bearing dirt awards value once only; Undo restores it; replay awards again from restored state only.
- Invalid movement consumes no steps, creates no gravity event, and does not record Undo history.
- Boulders fall predictably in bottom-to-top, left-to-right order; identical state/action => identical result.
- Boulder above empty falls vertically; boulder above solid does not; no diagonal roll.
- Boulder destroys fragile floor only after positive fall distance in current cascade; cannot break bedrock or dirt.
- Boulder-player collision enters reversible `stuck` state with appropriate event.
- Undo after chain reaction restores exact prior state and all collectibles.
- Exiting below treasureGoal does not win; entering exit with enough treasure wins.
- Secret visit correctly records even when player leaves area.
- All 10 level layouts pass schema checks and have tested legal win sequences.

### Integration

- App starts in Chrome, Safari and Firefox recent versions with no console errors.
- Portrait and landscape maintain a usable view and accessible on-screen controls.
- Touch and keyboard produce same simulation results for equivalent commands.
- Saving and reloading retains unlocks and best medals, without depending on renderer state.
- Offline run works from built local assets after initial delivery.
- Build does not contain remote font/image/audio URLs.
- Crash-safe fallback when malformed save exists.

## 13. Implementation milestones

**M0 — Project skeleton**: Vite/TS/Phaser pinned, strict lint/typecheck, test runner, app boots and scales, procedural placeholder tiles, docs and status ledger.

**M1 — Headless puzzle engine**: grid model, movement/digging, treasure collection, pure gravity, fragile breakage, events, Undo/Restart, unit tests. No polished graphics.

**M2 — Playable vertical slice**: render grid, mole placeholder, camera/animation, input desktop/mobile, UI/HUD, 3 levels and browser smoke test.

**M3 — Content & progression**: all 10 tested authored levels, secret branches, medal, level-select, local persistence, tutorials.

**M4 — Polish & platform readiness**: original/cohesive sprites and animation, sound, optimizations, accessibility, browser QA, deployable zip and documentation. YouTube SDK integration is a dedicated follow-on adapter task unless dev access/test requirements are available.

Each milestone requires running typecheck/tests/build and recording the results. Do not proceed after a known failing test without explaining why.

## 14. Key design decisions and non-goals

- **Puzzle-first over grind-first.** No idle automation or upgrade-shop in MVP.
- **Handcrafted levels over procedural chaos.** Solvability and intended decision-making matter most.
- **Deterministic grid gravity over rigid-body engine.** Physics must be transparent to players and testable.
- **No forced reset for mistakes.** Undo and Restart protect casual players from frustration.
- **Family-friendly visuals, broad audience.** This is not a declaration that the game is specifically directed to children; platform policy classification is a separate review.
- **No lock-in.** Domain logic has zero Phaser dependencies; render and platform integrations are replaceable.

## 15. What Codex should implement first

Begin with M0 and M1. In the first PR / batch:

1. Scaffold TypeScript + Vite + Phaser (pin versions, include license notices).
2. Create exact core model and reducer signatures and implement level parsing/validation.
3. Implement move/dig/collect, gravity, fragile breakage and events as pure functions.
4. Add Undo/Restart and at least 25 meaningful core tests for edge cases.
5. Ship an ugly but functional browser playable screen with **one complete sample level**.
6. Update `IMPLEMENTATION_STATUS.md` with passing commands, known open questions, and exact next steps.

Do not spend this first batch on elaborate AI graphics, story, menus, monetization, or YouTube SDK. Do not introduce unnecessary libraries.

---

**Useful references:**
- Phaser license: https://phaser.io/download/license
- Phaser documentation: https://docs.phaser.io/
- YouTube Playables overview: https://developers.google.com/youtube/gaming/playables
- YouTube Playables SDK: https://developers.google.com/youtube/gaming/playables/reference/getting_started
- YouTube certification: https://developers.google.com/youtube/gaming/playables/certification/requirements
