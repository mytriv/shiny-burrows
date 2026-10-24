# Shiny Burrows — P1: Gameplay Refinement & Mining Experience

## Context

Shiny Burrows is a family-friendly 2D side-view digging adventure inspired by the gameplay principles of California Gold Rush (2009) and California Gold Rush: Bonanza.

The game features cute mole characters, a retro casual 2D visual style, destructible underground environments, collectible treasures, gravity, falling boulders, bridge construction, and resource management.

P0a–P0d have been implemented, with a deterministic 60 Hz TypeScript simulation and Phaser 3.90.0 presentation layer.

**The current problem:** Although the platforming and digging systems are implemented, the prototype still feels like a technical demonstration. Levels are too open, the camera does not adequately frame the active gameplay, and mining does not yet offer enough exploration, planning, or meaningful decision-making.

Your task is to implement P1, improving gameplay depth, level design, camera behavior, and usability without compromising the existing architecture.

## 1. Mandatory pre-implementation audit

Read:

- `docs/SDD-v0.2.md`
- `IMPLEMENTATION_STATUS.md`
- `docs/P0-PLAY-GUIDE.md`
- All current gameplay, physics, level, camera, and rendering modules.

Inspect the implementation before making changes.

Document which modules should be preserved, modified, or replaced.

Do not rewrite working systems unnecessarily.

Where this specification conflicts with earlier P0 design constraints, P1 takes precedence.

## 2. Camera and world presentation

Implement a proper side-scrolling camera following the player.

Requirements:

- Smooth horizontal and vertical camera tracking.
- Prioritize vertical visibility when descending.
- Camera bounds must respect the current level geometry.
- Keep the player within a comfortable screen-safe area.
- Do not expose large empty areas outside the level.
- Support dynamically sized portrait and landscape viewports.
- Maintain a readable tile size on mobile.
- The camera must not affect gameplay simulation or collision.
- Correctly transform pointer coordinates into world coordinates for digging and placement.
- Provide deterministic camera configuration and testable boundary calculations.

For desktop, avoid stretching the entire world to fill the screen. Use a well-framed gameplay viewport instead.

For mobile, maximize playable space without overlapping critical HUD elements.

## 3. Mining-focused level redesign

Replace the current overly open test level with a dense, handcrafted underground mining level.

Target approximately 70–80% solid terrain within the initial playable underground region. This is a level-design target, not a mandatory global constraint.

Level requirements:

- Surface entrance with the mole's home.
- Multiple underground layers.
- Destructible soil and valuable ore deposits.
- Indestructible stone forming structural obstacles.
- Naturally occurring small caverns.
- At least two different routes toward the primary treasure objective.
- One optional side tunnel.
- One secret chamber.
- One meaningful bridge-placement opportunity.
- One falling-boulder puzzle.
- A clear exit or return-to-surface objective.

Avoid artificially open corridors connecting every objective.

The player should create most routes through excavation.

Create a handcrafted, reproducible level rather than introducing procedural generation during P1.

## 4. Mining and treasure discovery

Improve the distinction between treasure collection and actual mining.

Implement:

- Gold deposits embedded in diggable terrain.
- Gold obtained when the corresponding ore block is successfully excavated.
- Visible and partially concealed ore deposits.
- Clear visual feedback when gold is extracted.
- Different visual treatment for ordinary soil, gold-bearing soil, and valuable gems.
- Simple proximity-based hints indicating nearby hidden treasure.

Treasure discovery should encourage exploration without revealing the entire solution.

Separate economic concepts:

- **Level treasure:** contributes to the completion objective and medal rating.
- **Wallet:** spendable currency used for tools and construction.

Define an explicit, documented rule for how extracted treasure contributes to both systems. Spending wallet currency must never subtract from the already collected level treasure score.

Avoid reward duplication through repeated digging, Restart, or simulation updates.

## 5. Gravity and platforming improvements

Preserve the fixed-timestep deterministic simulation.

Verify and refine:

- Player gravity when no solid ground exists below.
- Ground detection and collision near tile boundaries.
- Walking off ledges.
- Falling into excavated holes.
- Landing on bridges.
- Limited jump height.
- Collision with ceilings and walls.
- Stable behavior when terrain directly beneath the player is removed.
- Consistent collision behavior at different rendering frame rates.

The game must never allow the player to hover over unsupported empty space.

Keep the platforming approachable rather than requiring high-precision jumping.

## 6. Falling boulders and destructible terrain

Expand falling-boulder interactions into meaningful puzzles.

Requirements:

- Boulders remain stable while supported.
- Removing support causes deterministic falling.
- Falling boulders can destroy specifically designated fragile terrain.
- Falling boulders can open new routes or block existing routes.
- Chain reactions must resolve predictably.
- Collisions with the player must have a clear and recoverable outcome.
- Animated falling must visually correspond to the authoritative simulation.
- Avoid physics tunneling, duplicate impact events, and unstable oscillations.

Introduce a controlled set of interaction rules. Do not add realistic continuous rigid-body physics.

Create test fixtures for multi-block falls, fragile destruction, player collisions, and chained impacts.

## 7. One-tile bridges and strategic spending

Preserve the existing bridge mechanic and two-bridge route.

Improve bridge placement so that:

- Bridges occupy exactly one grid cell.
- Bridges provide reliable collision support.
- Players cannot place bridges inside solid terrain.
- Players cannot place bridges overlapping the character.
- Placement is clearly previewed before confirmation.
- Invalid placement displays understandable feedback.
- Purchases and construction remain separate, explicitly documented actions.
- Currency is deducted only when a valid purchase succeeds.
- Construction does not duplicate or consume the wrong inventory item.

The level must offer:

1. A shorter route requiring purchased bridges.
2. A longer route requiring no bridge purchases.
3. Different advantages for each route.

Both routes must be completable from the same initial level configuration.

Ensure the player cannot bypass the intended route decisions through unintended jumps or collision exploits.

## 8. Energy, exploration, and softlocks

Keep the energy system understandable and non-punitive.

Requirements:

- Digging consumes energy according to documented rules.
- Walking, jumping, and tool switching must have clearly defined costs.
- Energy values must be visible and consistent.
- No hidden costs or unexpected double consumption.
- The primary completion path must be feasible with available resources.

A player may make inefficient decisions or block access to optional treasure. However, unavoidable permanent softlocks must be prevented.

Provide a clear Restart option and recoverable failure state.

Document whether energy depletion triggers failure, limits further digging, or allows another recovery mechanism. Implement one consistent policy.

## 9. UI and controls

Redesign the technical HUD into a compact retro-casual interface.

Show:

- Current level.
- Collected gold and required amount.
- Wallet currency.
- Remaining energy.
- Selected tool.
- Secret discovery indicator.
- Pause/restart controls.

Use readable icons and concise labels.

For mouse and touch:

- Allow intuitive movement and digging.
- Highlight the currently targeted block.
- Show valid and invalid bridge placement.
- Ensure UI controls do not cover critical gameplay areas.
- Handle simultaneous touch input reliably.

For keyboard:

- Preserve existing movement, jump, dig, tool switching, and placement controls.
- Avoid conflicting key bindings.
- Ensure held inputs stop correctly when focus is lost.

Do not introduce final artwork during this milestone.

Retain the original retro casual 2D style inspired by Java-era mobile adventure games, with clear tiles and an approachable mole character.

## 10. Gameplay feedback

Implement lightweight procedural feedback for:

- Digging and soil removal.
- Gold collection.
- Boulder movement and impact.
- Fragile block destruction.
- Bridge placement.
- Invalid actions.
- Reaching the gold requirement.
- Discovering a secret.
- Completing the level.

Use simple sprites, particles, short animations, and temporary indicators.

Do not introduce external asset dependencies or large effects libraries.

## 11. Automated validation

Extend unit tests to cover:

- Fixed timestep determinism.
- Gravity and ledge falling.
- Terrain collision boundaries.
- Digging beneath the player.
- Jump limitations.
- Ore extraction and reward accounting.
- Preventing repeated rewards.
- Boulder support detection.
- Boulder collisions and fragile destruction.
- Chain reactions.
- Bridge placement validation.
- Correct purchase/inventory accounting.
- Energy depletion behavior.
- Completion conditions.
- Camera bounds.
- Restart consistency.

Create scripted gameplay scenarios verifying both intended routes.

For each scenario, assert actual state outcomes rather than merely checking that commands were accepted.

Extend Playwright tests to cover desktop and mobile interaction, camera following, pointer target mapping, and restart after an unsuccessful run.

## 12. Acceptance criteria

P1 is complete only when:

- The player can explore a dense underground level by excavating terrain.
- The camera follows vertical progression without showing excessive unused space.
- The character reliably falls when unsupported.
- Ore extraction is rewarding and correctly accounted for.
- Falling boulders can meaningfully change the route.
- Bridges provide a strategic alternative to excavation.
- The paid and free routes are both verified.
- UI and controls are understandable without developer documentation.
- Existing P0 features have not regressed.
- Automated tests, typecheck, lint, and production build pass.
- Browser tests pass at 390×844, 844×390, and 1920×1080.
- No runtime network requests or new unnecessary dependencies are introduced.

## 13. Scope restrictions

Do not implement:

- Procedural world generation.
- Additional campaign levels.
- Final AI-generated art.
- Audio or music.
- Complex NPCs or enemy AI.
- Crafting.
- Persistent progression.
- YouTube Playables SDK integration.
- Advertising or monetization.
- Additional runtime frameworks.

Focus exclusively on making the existing playable level engaging, polished, and representative of the intended mining-platformer experience.

## 14. Completion report

After implementation:

1. Run all automated tests.
2. Run TypeScript checks and ESLint.
3. Produce a production build.
4. Run Playwright browser tests.
5. Inspect screenshots at the three required resolutions.
6. Document actual validation results.
7. Update `IMPLEMENTATION_STATUS.md`.
8. Record significant architectural decisions.
9. List remaining bugs, limitations, and deferred work.

Do not claim completion based solely on passing tests. Confirm that the new mining interactions, camera, bridges, and falling hazards are actually playable in the browser.

Do not proceed to M3 or M4 without further instructions.