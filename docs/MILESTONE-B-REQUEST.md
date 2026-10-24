# SHINY BURROWS — MILESTONE B
## Gold Discovery, Fog of War and Underground Exploration

You are continuing the existing Bonanza-inspired gameplay overhaul.

Milestone A and its ladder-mining hotfix are functionally implemented.

The latest report confirms:
- 141 passing unit tests.
- All functional browser tests passing.
- Three outstanding performance failures in software-rendered Chromium.
- Three-direction digging (Left, Right, Down).
- Climb-only Up.
- Correct ladder grip while horizontally mining.

Your task is to **implement Milestone B now**, not simply produce another proposal.

Read the existing:
- `docs/SDD-OVERHAUL.md`
- `docs/OVERHAUL-PLAN.md`
- `docs/bonanza-reverse-engineering.md`
- `docs/bonanza-mechanics-inventory.md`
- `docs/shiny-burrows-gap-analysis.md`
- `docs/youtube-playables-requirements.md`
- `IMPLEMENTATION_STATUS.md`

## 1. Fog of War

Implement deterministic underground discovery.

### Rules

- The player starts with only a small area around the starting position revealed.
- Undiscovered terrain remains visually concealed.
- Moving and excavating reveal nearby tiles.
- Reveal uses authoritative simulation state, never camera position.
- Discovered areas remain visible throughout the current level attempt.
- Previously discovered terrain must not become hidden when the player moves away.
- No arbitrary random reveal events.
- Solid terrain must block visibility beyond the defined reveal boundary.
- The mole, current tunnel and immediate collision hazards must always remain readable.

Use cell-level visibility states such as:

- Undiscovered
- Discovered

Avoid unnecessary complex visibility systems unless required by the existing architecture.

The fog must align exactly with the 32×32 logical tile grid and the approved 2.5D projection.

## 2. Gold Veins and Deposits

Modernize Bonanza's gold-discovery experience.

Implement:

- Small deposits
- Medium deposits
- Rich deposits
- Rare high-value deposits

Use original visual and gameplay interpretations.

Requirements:

- Gold remains embedded in complete soil blocks.
- No floating gold replacing terrain.
- Deposit value must be defined by gameplay data.
- Richer deposits should be visually distinguishable after discovery.
- Deposits must not be visible before their cells are revealed.
- Different deposit sizes should create meaningful route choices.
- Each reward must be credited exactly once.
- Collected deposits cannot regenerate or award gold repeatedly.
- Preserve the existing gold extra-hit requirement.

Use the existing ore identity and reward systems where possible.

Do not introduce a mandatory backpack or cash-out system in this milestone.

## 3. Nearby Gold Hints

Introduce subtle visual clues that encourage exploration.

Examples:
- Tiny gold particles embedded near a valuable vein.
- Slightly warmer soil around certain deposits.
- Small visible gold fragments exposed along a bordering dirt cell.

Requirements:

- Hints must originate from actual authored deposit data.
- Hints must not reveal exact hidden deposit locations automatically.
- No magical glow or supernatural visual language.
- Keep the existing warm, cute and readable 2.5D style.
- Avoid excessive particles, dynamic lights or visual clutter.
- Clues must be distinguishable from ordinary terrain on mobile screens.

Prefer deterministic tile-material variation instead of continuously animated effects.

## 4. Terrain and Strata

Preserve and refine existing terrain rules:

- Ordinary dirt: exactly 2 hits.
- Harder terrain: use the existing approved durability and upgrade formulas.
- Gold-bearing cells: one additional hit.
- Damage regeneration: existing 180-idle-tick behavior.
- Indestructible bedrock remains indestructible.
- Mining only Left, Right and Down.

Terrain types should become visually more distinct as the player reaches deeper areas.

Do not modify the perfect square grid or mole dimensions.

## 5. Exploration-Focused Level Design

Revise the opening Story Mode levels to support discovery.

### First Burrow

Introduce:
- An immediately understandable first gold discovery.
- One visible main route.
- One optional hidden gold pocket.
- A simple choice between two excavation directions.
- A guaranteed return route using existing ladders.

### Amber Hollow

Introduce:
- Greater variety of gold deposits.
- Multiple excavation routes.
- Richer deposits behind more difficult soil.
- A meaningful optional detour.

### Golden Depths

Introduce:
- Deeper strata.
- Higher-value ore.
- More strategic route choices.
- Opportunities to benefit from existing claw upgrades.

All three levels must:
- Remain completable without purchasing optional tools.
- Avoid softlocks.
- Respect the three-direction digging restriction.
- Preserve correct ladder creation and traversal.
- Have sufficient available gold to meet quotas.
- Support keyboard, mouse and touch.

Do not add enemies, lava, gas, explosives or additional environmental systems yet. These belong to Milestone C.

## 6. Rendering Requirements

Preserve the approved original 2.5D visual direction.

- Perfect 32×32 square logical grid.
- Slight orthographic viewing angle.
- Equal projected horizontal and vertical tile dimensions.
- One-cell mole.
- Rounded rock visuals.
- Warm stylized soil materials.
- Gold nuggets visibly embedded in terrain.
- No decorative crystals, mystical effects or unnecessary props.

Fog rendering should be efficient.

Prefer existing batching and instancing systems.

Update only affected visibility/terrain chunks rather than rebuilding the entire mine every frame.

Do not add a full-screen postprocessing pipeline.

## 7. Architecture

Preserve:
- Pure TypeScript gameplay Core
- Phaser 3.90.0
- Three.js 0.180.0
- Fixed-step 60Hz simulation
- Existing movement/collision architecture
- Existing input adapters
- Existing deterministic test infrastructure

Add a dedicated discovery system within Core.

The renderer must only consume discovery state.

Do not let graphics determine whether gold exists, can be collected, or has been discovered.

Plan for future:
- Story Mode progress saves
- Endless Mode procedural exploration
- YouTube Playables cloud persistence

Implement compact, serializable visibility state and stable deposit identities.

Do not introduce SDK or network dependencies in Core.

## 8. Performance

The existing Chromium software-rendering tests report approximately 50ms median frame intervals.

Before adding visual complexity:

1. Record the unchanged Milestone A rendering baseline.
2. Profile the fog rendering implementation.
3. Measure visible instance counts, draw calls, triangle counts, CPU submission and frame intervals.
4. Prevent unnecessary geometry rebuilding.
5. Investigate whether the existing failures originate from software rendering, scheduling, resource pressure or project code.

Do not disable, weaken or silently exclude failed performance tests.

Do not reduce approved visual quality simply to satisfy a synthetic benchmark.

Record verified findings separately from unresolved hypotheses.

## 9. Automated Testing

Implement deterministic tests for:

- Initial discovery state.
- Reveal during horizontal mining.
- Reveal during downward excavation.
- Solid-terrain visibility boundaries.
- Re-entering already discovered areas.
- No duplicate gold rewards.
- Rich-deposit value handling.
- Ore hidden before reveal.
- Correct visual reveal after excavation.
- Fog persistence within an attempt.
- Restart behavior.
- Ladder mining while suspended.
- No unwanted horizontal ladder creation.
- Upward digging remains impossible.
- Hard terrain integrity and regeneration.
- Campaign completion at all claw tiers.
- Deterministic replay.
- Different input frame rates.
- Camera movement and window resizing.

Browser tests must verify actual gameplay using physical-keyboard, mouse and touchscreen input.

Inspect screenshots at:
- 390×844
- 844×390
- 1920×1080

## 10. Acceptance Criteria

Milestone B is functionally complete only when:

1. Undiscovered gold is concealed.
2. Excavation reveals terrain and nearby deposits correctly.
3. Gold hints correspond to genuine hidden deposits.
4. Richer deposits have meaningful gameplay value.
5. All three Story levels remain completable.
6. The mole never becomes hidden or displaced by fog.
7. Square grid geometry remains mathematically identical.
8. Existing ladder fixes remain intact.
9. All new functional tests pass.
10. Production build, typecheck and lint succeed.
11. Performance results are reported without hiding existing failures.

Do not claim complete YouTube certification, persistent cloud saves or Milestone C features.

## 11. Deliverables

Implement the actual source changes and provide:

- Updated discovery system.
- Updated gold/terrain representation.
- Efficient fog renderer.
- Gold proximity hints.
- Improved opening campaign levels.
- New regression tests.
- Browser screenshots.
- Performance comparison.
- Updated implementation status.

Document meaningful changes and remaining limitations.

**Begin implementation immediately. Do not stop after writing planning documents.**