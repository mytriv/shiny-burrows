# Shiny Burrows — SDD v0.3: Core Vision Correction

Status: implementation specification / design correction
Audience: Codex engineering agent
Supersedes: contradictory gameplay, camera, mining, bridge, ladder, economy, and visual-direction requirements in v0.1, v0.2 and P1. Retain compatible infrastructure, architectural boundaries and test requirements.

## 0. Vision and non-negotiable rules

Shiny Burrows is a simple, family-friendly, accessible side-view excavation game about a cute mole digging increasingly deep into the ground, collecting more valuable resources, and investing earnings into character upgrades. The challenge is to plan a route: where to dig, when to fall, how to get back up, and when a purchasable one-way platform is worth the cost. No mysterious lore, ancient civilization, magical fantasy, complex quest narrative, monsters, or unrelated meta systems in this iteration.

- Player only walks left/right and digs in the direction they face. No jump, manual free-form aiming, flying, attack, manual ladder-placement mode, or precision platforming.
- Gravity is always active when unsupported. The player falls through empty space. Vertical ascent is possible by climbing automatically created ladders, not by jumping.
- Digging occurs on a tile grid, in real time, against the targeted adjacent tile in the facing direction. Tiles have hardness/hit requirements.
- Partially damaged tiles heal automatically after an idle delay. Digging the same tile before healing preserves the damage.
- When excavating vertically downward, the game automatically creates traversable ladder segments as needed for a return path. This must be deterministic, understandable, and not allow ascent through solid tiles.
- Purchasable platforms occupy one cell and support the player from above, but do not act as solid walls: the player may intentionally drop through them. They are distinct from ladders and do not need the player to jump onto them.
- Levels form a descending progression with increasing rewards and hardness. Exploration is simple and treasure-driven; optional side shafts are allowed, but no mysticism/plot-heavy secrets.
- Art direction: bright stylized **volumetric-looking 2D** (2.5D treatment), with faux depth through painted facets, highlights, bevels, contact shadows and layered backgrounds. No actual 3D engine required; no flat monochrome debug squares; not glossy generic AI poster render. Screen readability and child-friendly clarity take precedence over effects.

## 1. Existing implementation and preservation

Audit current P0a–P0d / P1 work and `IMPLEMENTATION_STATUS.md` before editing. Preserve Phaser 3.90.0, Vite, TypeScript strict mode, testing tools and architecture: framework-free deterministic 60 Hz TypeScript authoritative core plus Phaser rendering/input/camera. Keep reusable world/ore/economy/boulder code when compatible. Do not rewrite infrastructure wholesale. Archive replaced rules/tests only after parity tests exist.

Write `docs/DECISIONS-v0.3.md` with conflicts found, removed features, migration plan and specific mechanics decisions before touching code. Explicitly remove or disable jump input, independent up/down dig aiming, manual ladder placement, and the old fully solid bridge collision semantics. Treat v0.3 as authoritative.

## 2. Movement and navigation

- Fixed timestep (60 Hz). Horizontal continuous movement via A/D, Left/Right and touch hold buttons, capped speed and acceleration appropriate to mobile; no jump button.
- Gravity and collision against fully solid terrain. Unsupported avatar falls; fall animation and landing feedback; no arbitrary hovering.
- A ladder permits vertical traversal when the avatar overlaps its column. Up/down inputs climb/downclimb on a ladder. Without a ladder, Down on a one-way platform initiates drop-through; otherwise Down must not levitate the avatar.
- No vertical teleportation, no climbing through unexcavated/solid blocks, no sideway clipping at corners. Ladders do not create support by themselves unless explicitly justified in code; gravity and ladder movement must be stable.
- On-screen controls: Left / Right / Up (when ladder) / Down (ladder or drop-through) / Dig / Platform / Pause. Hide or disable inapplicable actions; desktop keyboard and touch must work without precision tapping tiny tiles.
- Define clear facing, hold-to-dig cadence and proximity checks. Do not allow digging distant tiles.
- Falling off terrain must be useful as a navigation choice, not necessarily a death condition. Recoverability is primarily via ladders or alternate route. Provide Restart if a level becomes unsolvable.

## 3. Digging and tile hardness / regeneration

Each diggable terrain cell has stable `tileType`, `maxIntegrity` or `requiredHits`, `currentIntegrity`, `lastHitTick`, and suitable presentation events. Avoid floating-time stamps; track time using sim ticks.

- Dig targets the immediately adjacent diggable terrain cell along facing direction when the player holds Dig. The core resolves digging and player movement separately. If the adjacent cell is empty, Dig has no effect. On narrow passages, define unambiguous targeting rules.
- A soft soil block requires 1 hit. Higher strata introduce e.g. compacted soil (2 hits), stone-like diggable soil (3 hits), hard rock (5 hits). These are initial balance defaults, externally configurable; no grindy 20+ hit blocks early on.
- Upgrade tiers reduce required mining time / hits or increase digging power via explicit, tested formula. An upgrade must not invalidate level solvability.
- Every successful hit produces a damage/crack stage event with audible/visual-ready metadata. Upon reaching zero integrity, remove the block, award its contents exactly once, update terrain, reveal passage and possibly trigger a rock cascade.
- If the tile is left partially damaged, reset to full integrity after a configurable idle delay (default proposed 3 seconds = 180 simulation ticks). Damage does not reset while the tile is actively being mined; no permanent partial damage across Restarts.
- Regeneration means **restore durability of remaining terrain blocks, NOT regrow destroyed blocks**. An already removed tile stays empty; never duplicate gold/resources.
- Energy: remove legacy per-action energy cost unless there is a clear approved design reason. v0.3's primary loop is free walking/digging plus currency upgrades; no compulsory stamina timer in this milestone. UI must not show a misleading energy meter.
- Define the downward excavation action precisely: **automatic downward digging is a context action, not a separate aiming control**. When standing on a diggable floor, Down+Dig targets the cell immediately below, and automatically creates ladder segments after successfully removing it. This is the only directional exception to facing-based horizontal digging and is required to realize downward descent without a separate aim tool. Down alone never excavates. If this exception conflicts with user intent, surface it as an explicit decision before implementation rather than silently inventing another mechanic.

## 4. Automatic ladders

- Upon successful excavation of a tile immediately beneath the player via Down+Dig, install one ladder segment in the newly emptied tile at no cost. Ladder exists as an occupancy/overlay separate from terrain.
- When descending through consecutive excavated cells in that shaft, extend ladder segments reliably so the player can climb back up from a lower safe floor. Clarify what happens when the player enters an already open vertical shaft: for MVP, automatically extend ladder on descent only through the active shaft and only if adjacent to an established ladder/anchor, and test all situations; avoid conjuring long free ladders in unrelated natural caverns.
- Ladder creation cannot replace solid terrain or a bridge. Render ladder behind the avatar and distinct from soil/ore. It must not obstruct horizontal walking or falling.
- Ladder ascent and descent must be smooth, with robust snap tolerances so mobile players do not need pixel-perfect alignment.
- Test multi-cell excavation/extension, interrupted dig, alternate routes, ladder at edge of platform, bridging a gap across a ladder, and reentry after a fall.

## 5. Purchasable one-way platforms (not solid bridges)

- One purchase grants one placeable platform occupying exactly a tile-width horizontal span. Separate `inventory.platforms` from money (`wallet`). Price is tunable (P0 had 5 coins; may retain 5 if balanced).
- The platform can be placed at a valid nearby empty cell, using a simple placement preview (keyboard/onscreen contextual action) without demanding precise cursor targeting; invalid placement must not charge money or consume inventory.
- Collides only when landing onto its upper surface while falling; it is non-solid from beneath and from the sides. Player can intentionally press Down (plus optional dedicated drop action) to pass through it; briefly suppress that platform's top collision until fully below to avoid snap-back.
- A platform is persistent until level restart and can bridge gaps / stage a controlled drop to lower strata. It should not create a universal shortcut to ascend vertically without ladders.
- Verify behavior for high fall speed, stacked platforms, walking off edges, standing on boundary, dropping while near ladder, and touching the platform from below.
- Platform cost must create a meaningful strategic trade-off: one route spends currency for convenience/access; another route is reachable by digging or falling and conserving currency. No required spend that is impossible to afford at level start.

## 6. Economy and upgrades

- Descending to later levels gives richer resource deposits and harder soil. Common gold is the principal reward. Keep gems optional and readable. No detailed lore/quests.
- `levelGoldCollected` is a non-spendable measure of performance/goal progress. `wallet` is spendable money; mining a deposit increments both once (according to an explicit payout mapping). Spending never reduces `levelGoldCollected`.
- Add an MVP surface upgrade station/menu between levels (or before entering the next level) with **Pickaxe Power** (dig faster/harder strata) and optionally **Movement Speed** (modest boost). Further upgrades (platform inventory/capacity) are deferred. Costs/benefits are displayed before purchase; transactions atomic and tested.
- Persist upgrades and wallet across level transitions in memory first, without platform SDK integration or backend. Do not make level 1 depend on future-level currency.
- Showcase a progression example with 3 short handcrafted descending levels, each deeper, harder and more lucrative. Do not generate a massive campaign in this milestone.
- Explicitly test affordability, negative wallet prevention, balance after Restart, and reward farming exploits (retrying same treasure for unlimited persistent money). Define replay rewards to prevent exploit or deliberately scope progress until level completion.

## 7. Simplified approachable level design

- Goals should be concrete: dig down, collect enough gold, reach exit/next shaft. Minimal text; tutorial by play.
- Show the amount of gold needed for the level and visible depth/progress. Optional side shafts contain extra gold, not lore-heavy quests.
- Three short handcrafted vertical levels with varied hardness and one meaningful falling route and platform trade-off. Tune to approximate 1–3 minute level sessions, subject to testing.
- Keep natural hazards/falling rocks only if readable and predictable; no enemies, combat, lava biomes, supernatural portals or scripted dramatic narrative.
- If no-jump movement makes some level impossible, fix geometry rather than adding jump back silently.

## 8. Visual direction: dimensional cartoon, not flat pixels and not 3D gameplay

Use a side-on orthographic tile world with stylized cartoon volume:
- Ground tiles have subtle bevel highlights, recessed cracks, warm ambient occlusion cues, edge variations and slight painted shading.
- Gold ore is integrated into rock, with large high-contrast nuggets and restrained sparkle; hardness tiers are immediately distinguishable by shape as well as color.
- Mole is rounded with clear head, snout, paws and expressive eyes, with 4–8 frame loops for walking and digging; silhouette must work at mobile size. Initial art can be procedural/hand-authored, but all production assets must be legally usable, original, cohesive, and packed locally.
- Foreground/background layers provide faux depth without competing with tiles. Gentle parallax if performance allows. Clear neutral lighting and minimal bloom. Optimized for small displays.
- UI: compact, readable, attractive cartoon beveled panels; show level/depth, gold, wallet, pickaxe level, selected platform count and contextual controls. Remove obsolete Jump/Aim/Energy UI. No long instructional text occupying the top.
- Avoid photorealism, overly glossy AI-render look, generic shiny clay 3D, heavy voxel effects, noisy overtextured tilemaps, pure flat diagnostic squares, and mandatory pixel-art-only style.

## 9. Architecture and API boundaries

- Core remains DOM/Phaser/browser-independent, deterministic at 60Hz. All authoritative movement/collision/mining/currency/ladder/platform state belongs in core.
- Phaser handles rendering, interpolation, camera, touch input mapping and animations only. No Phaser Arcade/Matter as source of gameplay truth.
- Data-driven config for hit requirements, regen ticks, platform price, upgrade prices/power and level ore rewards.
- Add versioned save schema for campaign state only if needed for cross-level flow; full persistence and YouTube integration deferred. Never introduce runtime external network calls or new application dependencies without justification.

## 10. Implementation milestones with gates

**V3-A: Audit / contracts**: describe incompatibilities and acceptance tests first; define input mappings and fixed-tick damage/regen semantics. Gate: tests specify no jump and stable free fall.

**V3-B: Movement, digging, ladders**: remove jump, implement facing dig, Down+Dig floor excavation, multi-hit/hardness, regen, auto ladders and climbing. Gate: deterministic headless tests and a playable shaft scenario.

**V3-C: One-way platforms**: purchase, preview, placement, landing, drop-through, no-snapback. Gate: scripted crossing/drop and no-spend route pass.

**V3-D: Rewards and upgrades**: level gold, wallet, simple upgrade menu, 3 small depth-based levels; no replay exploit. Gate: scripted level progression + money tests.

**V3-E: Visual/readability pass**: stylized volume without final massive asset production; HUD/control cleanup; camera/viewport. Gate: screenshots inspected at 390×844, 844×390, 1920×1080 and real interaction verified.

Do not progress to next milestone unless the previous gate is met. Do not implement unrelated P1 feature backlog that contradicts v0.3.

## 11. Critical acceptance scenarios

1. Mole walks off solid edge and falls; cannot jump or hover; can land on ground or platform.
2. Mole holds Dig facing compacted soil: 1 hit produces visible damage, more hits break it; pausing long enough before final hit restores full integrity.
3. A destroyed soil cell never reappears and cannot pay gold twice.
4. Mole uses Down+Dig to descend three layers; ladder appears in the excavated vertical shaft; the mole climbs back to surface via Up without flying through solid tiles.
5. Mole buys/places a one-cell platform, walks on it, intentionally drops through it and lands below; no bounce-back or accidental extra purchase.
6. A level can be completed by a paid platform route and an alternative free route; validate reachability without jump.
7. Level 2 has tougher soil and more valuable gold than level 1; upgrading the pickaxe reduces excavation effort; wallet bookkeeping is correct.
8. Mobile touch controls support walking, digging, ladder climbing and platform placement; no tiny precision-target requirement.
9. Fixed-seed deterministic simulation and render-FPS-independent result; tests cover collisions, ladders, save/retry and cost invariants.
10. Tests, typecheck, lint, production build, Playwright desktop/portrait/landscape passes, no unexpected network calls or console errors.

## 12. Deliverables and reporting

- Updated v0.3 specification stored in repo as `docs/SDD-v0.3.md` and migration decisions.
- Working browser prototype; no downloaded assets at runtime.
- Tests for new mechanics and negative cases, updated browser smoke flows, selected screenshots.
- Updated `IMPLEMENTATION_STATUS.md` with exact controls, milestones passed, asset/license notices, actual test counts and remaining known limitations.
- If gameplay interpretation is ambiguous, state the decision and rationale in `docs/DECISIONS-v0.3.md` before coding. Do not claim tests or browser validation that was not run.
