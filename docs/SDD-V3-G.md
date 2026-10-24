# Shiny Burrows — V3-G: Omnidirectional Auto-Digging & Automatic Ladder Placement

## Objective

Fix the incomplete V3-F implementation.

The player must automatically dig in all four directions using movement input alone. No separate Dig key or button should be necessary.

Additionally, descending through empty vertical space, including falling, must automatically create ladder segments so the player can return upward.

Preserve all existing visual assets, levels, upgrades, economy, platforms and deterministic physics unless a change is strictly required by these mechanics.

## 1. Automatic digging in all directions

Implement a unified directional mining system.

### Horizontal

- Hold Left to walk or dig left.
- Hold Right to walk or dig right.
- When blocked by destructible terrain, automatically mine the adjacent tile.
- After destruction, continue moving automatically.
- Release input to stop movement and further mining.

Preserve the existing V3-F horizontal behavior.

### Downward

- Hold Down while standing on destructible terrain to automatically mine the block underneath.
- No separate Dig input is required.
- When the block is destroyed, gravity moves the player downward.
- Continuing to hold Down automatically mines subsequent blocks as they become reachable.
- Automatically create ladder segments along the excavated vertical shaft.
- If there is empty space underneath, Down initiates or continues descent rather than mining empty space.

### Upward

- Hold Up while standing inside or adjacent to a valid ladder to climb.
- If destructible terrain blocks upward movement, automatically mine that block.
- Continue climbing after the obstruction is destroyed.
- Never allow upward mining of unreachable blocks through intervening solid terrain.
- If no ladder exists and the player cannot physically reach the target, Up must not permit flying or mining remotely.

All mining actions must obey the same timing, damage and regeneration rules.

## 2. Two-hit minimum

Keep the V3-F mining requirements:

- Standard soil: exactly 2 hits.
- Harder terrain: 3 or more base hits.
- Upgrades never reduce required hits below 2.
- First hit immediately on valid contact.
- Subsequent hits use the existing 24-tick / 400ms cadence.
- Releasing or changing direction interrupts the pending strike.
- Partial damage regenerates after the existing idle period.

The rules must be identical for horizontal, downward and upward mining.

A brief accidental directional input must not destroy an intact standard tile.

Blocks with gold should always have +1 hit

## 3. Automatic ladder generation during vertical descent

Automatically create ladder segments whenever the player moves downward into a new vertical grid cell.

This includes:

- Digging downward.
- Walking off a ledge and falling into a vertical shaft.
- Dropping through a purchased platform.
- Descending through an existing empty vertical tunnel.
- Falling several cells in a single uninterrupted descent.

### Placement rules

- Each traversed vertical cell should receive a ladder segment if it does not already contain one.
- Ladder placement must not overwrite solid terrain, treasure or platform structures.
- Ladder segments are free and do not consume wallet currency.
- Ladder placement must be based on authoritative player movement in the TypeScript Core.
- Never generate duplicate segments.
- Never create ladder segments in cells the player has not actually traversed.
- Do not create horizontal ladders.
- Ensure that ladder segments form a continuous climbable path to the upper part of the shaft whenever the terrain geometry permits it.

Ladders are non-solid and must not interrupt gravity.

## 4. Automatic ladders during upward excavation

When the player climbs and digs upward:

- Preserve existing ladder segments.
- Extend the connected ladder shaft upward as newly excavated cells become accessible.
- The player must be able to resume climbing through the new segment.
- Do not create unsupported remote ladder segments.

## 5. Ladder and platform interaction

Keep purchased platforms as one-way supporting surfaces.

Rules:

- Walking onto a platform supports the player.
- Pressing Down allows intentional drop-through.
- Dropping through automatically creates ladder segments along the vertical descent.
- Existing ladders must not cancel an intentional platform drop.
- Climbing Up should work again once the drop-through suppression has ended.
- Avoid snapping the player back onto a platform during descent.
- Preserve platform purchases, prices and placement validation.

## 6. Input simplification

Remove manual Dig controls from active gameplay.

### Keyboard

- A / ArrowLeft: move or dig left.
- D / ArrowRight: move or dig right.
- S / ArrowDown: descend or dig down.
- W / ArrowUp: climb or dig upward when reachable.
- B: buy platform.
- E: place platform.
- Escape: pause.
- R: restart.

Use `KeyboardEvent.code` for physical, layout-independent key bindings.

### Mouse and touch

- Four directional controls: Left, Right, Up, Down.
- Holding a direction performs its contextual movement/digging action.
- Remove the separate Dig ↓ button.
- Preserve Buy and Platform placement controls.
- Preserve simultaneous touch interactions and correct cancellation behavior.

Update all help text, hints and documentation accordingly.

## 7. Deterministic simulation

Maintain the independent TypeScript Core and 60Hz fixed-step simulation.

Important:

- Mining must depend on contact or validated reachable targets.
- Ladder placement must be tied to actual vertical displacement, not input intent alone.
- Falling over multiple grid cells must create every necessary ladder segment, even if velocity is high.
- Resolve movement, digging, ladders, platform drop-through and collision in a documented deterministic order.
- Pause must freeze mining, falling and ladder generation.
- Rendering and Phaser animations must never determine authoritative gameplay outcomes.

## 8. Automated regression tests

Add tests covering:

1. Automatic downward digging without Dig.
2. Automatic upward digging while climbing.
3. Horizontal automatic digging remains functional.
4. Two-hit minimum in every direction.
5. Mining cancellation and damage regeneration.
6. Continuous downward excavation through several tiles.
7. Automatic ladder creation after digging downward.
8. Automatic ladder creation after falling through empty space.
9. Automatic ladder creation after dropping through a platform.
10. Continuous ladder connectivity after multi-cell falls.
11. Returning to the surface using automatically generated ladders.
12. No duplicate ladder segments.
13. No ladder placement inside solid terrain.
14. Upward mining requires physical reachability.
15. No hovering or flying when pressing Up away from ladders.
16. One-way platform collision and drop behavior.
17. Existing upgrade and economy regression tests.
18. Keyboard layout independence.
19. Touch and mouse directional input.
20. Determinism at different rendering frame rates.

Include an actual browser scenario in which the mole falls several cells into a shaft, ladders appear automatically, and the player climbs back to the starting elevation without restarting.

## 9. Acceptance criteria

V3-G is complete when:

- All four directional inputs perform context-sensitive movement and digging.
- No separate Dig button is required anywhere in normal gameplay.
- Standard soil always needs two hits.
- The player can fall into a previously empty shaft and automatically create a continuous ladder route.
- The player can climb back up that route.
- Upward mining works from a valid climbing position.
- No ladder or digging exploit permits flying or tunneling through unreachable cells.
- Existing platforms, upgrades, economy and level progression remain functional.
- The current dimensional cartoon art style is unchanged.
- Typecheck, lint, build, unit tests and Playwright tests all pass.

Test 390×844, 844×390 and 1920×1080 viewports.

Update `IMPLEMENTATION_STATUS.md` with actual verification results, new mechanics and known limitations.

Do not begin unrelated features or introduce additional runtime dependencies.
