# Shiny Burrows — V3-F: Automatic Digging & Universal Keyboard Controls

## Goal

Improve the existing gameplay controls without changing the established visual style, level design, progression, economy, gravity, or platform mechanics.

The player should automatically dig when continuously moving against a destructible block.

Keyboard controls must work regardless of the user's active keyboard layout.

## 1. Automatic horizontal digging

Remove the requirement to press a separate Dig button for ordinary horizontal excavation.

### Required behavior

- Holding Left or Right moves the mole in that direction.
- When the mole encounters a destructible block, it stops moving and automatically begins digging.
- The player must continue holding the movement direction for digging to proceed.
- Once the block is destroyed, the mole automatically continues walking in the same direction.
- If another destructible block is encountered, digging continues automatically.
- Releasing the movement button immediately stops further digging.
- Changing direction interrupts the current digging action and moves or digs in the new direction.
- Indestructible blocks stop movement without consuming mining actions.
- Digging must never occur through solid walls or outside the player's valid interaction range.

The behavior must work identically with keyboard, mouse, and touch movement controls.

## 2. Minimum two-hit protection

Ordinary destructible blocks must require at least two distinct digging hits.

This is intentional game design: the first hit gives players time to correct an accidental movement direction.

### Rules

- Standard soil: exactly 2 hits.
- Harder soil and stone: 3 or more hits according to their existing hardness values.
- Upgrades must not reduce any destructible block below 2 required hits.
- Indestructible blocks remain indestructible.
- Each hit must produce visible damage feedback.
- The first hit must never immediately remove an ordinary block.
- Digging must have a readable interval between consecutive hits.

Keep the existing block-integrity regeneration mechanic.

If the player stops digging before a block is destroyed, its partial damage must recover according to the existing regeneration rules.

Do not reset damage instantly when the player changes direction unless the documented regeneration timing requires it.

### Mining upgrades

Preserve the existing upgrade system, but enforce the two-hit minimum.

Upgrades may improve mining speed or reduce the required hits for harder blocks, provided the minimum two-hit rule is respected.

## 3. Automatic digging timing

Digging should feel responsive but must not accidentally destroy multiple blocks from a brief directional input.

Implement a deterministic, configurable hit interval.

Suggested starting values:

- First hit: immediately after contacting a destructible block.
- Second hit: after approximately 350–450 ms of continuous directional input.
- Subsequent hits: same configurable cadence.
- Cancelling or releasing movement stops future hits immediately.

The timing must be derived from the fixed-step gameplay simulation, not Phaser animation timing or browser key-repeat events.

Do not apply multiple hits during the same simulation tick.

Verify behavior at different browser rendering frame rates.

## 4. Layout-independent keyboard controls

Fix movement and action controls so they work with non-English keyboard layouts.

### Requirements

Use `KeyboardEvent.code` for physical key bindings rather than relying exclusively on `KeyboardEvent.key`.

Examples:

- `KeyA` — move left, regardless of whether the active layout produces A or another character.
- `KeyD` — move right.
- `KeyW` — climb up.
- `KeyS` — climb down.
- `ArrowLeft` / `ArrowRight` — horizontal movement.
- `ArrowUp` / `ArrowDown` — climbing and contextual vertical actions.
- `Escape` — pause.
- `KeyR` — restart.

Existing tool and platform controls must also use physical key codes.

Handle keydown and keyup consistently, including when layouts change while the game is running.

### Input safety

- Prevent browser scrolling when gameplay arrow keys are used.
- Ignore OS key-repeat events as separate actions.
- Clear all held inputs on window blur, document visibility changes, and pause.
- Do not leave movement or digging stuck after the game loses focus.
- Preserve mouse and touch controls.
- Preserve simultaneous touch input for movement and other actions.
- Avoid relying on character case, locale, or translated key labels.

## 5. Vertical digging

Preserve the current vertical excavation system and automatic ladder placement.

Keep Down + Dig as the existing vertical excavation command for now.

Do not introduce new automatic downward digging behavior in this task.

Ensure the horizontal auto-digging implementation does not accidentally trigger vertical mining, bridge placement, or ladder creation.

## 6. UI changes

- Remove or de-emphasize the separate horizontal Dig button if it is no longer necessary.
- Keep a clearly labeled vertical digging control for mobile.
- Update tutorials and control hints to explain that walking into soil automatically digs it.
- Show a distinct visual reaction when the mole hits a solid block.
- Keep the existing dimensional cartoon visual style unchanged.
- Do not redesign the HUD, tiles, player graphics, or background.

## 7. Automated tests

Add regression tests proving:

1. Continuous movement toward soil automatically triggers digging.
2. A short accidental directional press cannot destroy a standard block.
3. Standard soil always requires two distinct hits.
4. Hard blocks still require three or more hits where configured.
5. Mining upgrades never reduce hardness below two hits.
6. Movement resumes automatically after block destruction.
7. Releasing movement immediately interrupts mining.
8. Changing direction cancels the pending hit sequence.
9. Partial block damage regenerates after the configured delay.
10. Indestructible blocks cannot be damaged.
11. No duplicate mining actions occur during frame-rate changes.
12. Physical keyboard controls work with alternate keyboard layouts.
13. Keyboard focus loss does not leave movement or mining active.
14. Mouse and touch controls behave consistently with keyboard movement.
15. Vertical digging, ladders, platforms, and gravity continue working.

## 8. Acceptance criteria

The task is complete when:

- The mole can walk continuously into destructible terrain and automatically dig through it.
- A normal block cannot be destroyed by a single accidental directional input.
- Harder blocks retain their higher mining difficulty.
- No separate Dig button is required for horizontal excavation.
- Keyboard behavior is independent of the active language layout.
- Existing vertical digging, gravity, ladders, platforms, economy, and progression remain functional.
- Existing visual style remains unchanged.
- Unit tests, typecheck, lint, production build, and browser tests pass.

Use Playwright to validate keyboard, mouse, and touch input.

Test desktop and mobile viewport layouts.

Update `IMPLEMENTATION_STATUS.md` with implementation details, tests, and any remaining limitations.

Do not start additional gameplay milestones or introduce new dependencies.