# SHINY BURROWS — SDD v0.5
## Concept-Matched Visual Overhaul

### Objective

Upgrade the existing Shiny Burrows game to closely match the **second user-provided reference image**, which is the authoritative visual target.

The first image represents the current implementation and demonstrates the visual problems that must be fixed.

This is a major visual quality pass, not a gameplay rewrite.

Do not consider this task complete merely because the game uses 3D geometry, has lighting, or passes existing automated tests. The actual rendered appearance must closely resemble the target concept.

## 1. Art direction — highest priority

The final game must look like a polished, premium, cute casual mobile mining game.

Target characteristics:

- Rich, detailed, rounded 3D terrain tiles.
- Warm orange and reddish-brown earth.
- Sculpted rock fragments, pebbles and surface imperfections.
- Clearly visible upper block surfaces.
- Deep, dark underground tunnel backgrounds.
- Large, expressive gold nuggets with a warm glow.
- Rounded, colorful, tactile interface panels.
- A cute animated mole with clearly readable movement.
- Soft shadows, ambient occlusion and subtle material highlights.

Avoid the current minimalistic prototype appearance.

**The target is the supplied concept image, not simply generic 2.5D graphics.**

## 2. Camera and terrain projection

The current camera is too frontal.

Increase the apparent camera elevation so the player can clearly see the top surfaces of blocks, particularly the blocks beneath the mole.

The result should create the impression that the mole stands on a physical layer of ground rather than in front of flat squares.

Requirements:

1. Preserve the traditional side-view gameplay composition.
2. Keep grid columns and rows aligned.
3. Show a noticeable top surface on exposed blocks.
4. Preserve consistent square tile gameplay footprints.
5. Avoid a full isometric appearance.
6. Do not expose a second navigable movement axis.
7. Keep all visual geometry independent of physics.

Use a carefully calibrated orthographic camera with increased elevation, and adjust geometry or projection so that front-facing tile regions remain approximately square.

A useful starting point is testing camera elevations around 15–25 degrees, but choose the final angle through visual comparison rather than treating these values as mandatory.

The concept image may use artistic projection rather than physically exact camera geometry. Matching its readable appearance takes priority over reproducing a particular camera equation.

### Surface visibility

When the mole stands on dirt, the upper surface of that dirt must be visible.

The character's feet must visually contact the tile top.

Ensure that rendering order, depth testing, and the mole's visual position produce convincing grounding.

Do not change the Core collision coordinates to accomplish this.

## 3. Terrain blocks — significant detail increase

The current blocks look too smooth, flat and repetitive.

Replace their visual construction with richly detailed stylized low-poly terrain.

Every tile should contain a combination of:

- Rounded primary mass.
- Sculpted beveled edges.
- Uneven surface color.
- Embedded small stones.
- Pebbles and occasional larger rocks.
- Small pits and depressions.
- Shallow cracks.
- Subtle material variation.
- Soft shadowing between blocks.

### 3.1 Procedural variation

Use deterministic seeded variation based on tile coordinates and material type.

Adjacent blocks must not look like identical duplicated cubes.

Create several distinct variations of each material.

Variation can affect:

- Pebble position.
- Rock sizes.
- Surface roughness.
- Crack arrangements.
- Color tint.
- Decorative features.

Keep every decoration confined to its parent gameplay tile's permitted visual bounds.

Do not distort the overall square grid.

### 3.2 Material definitions

**Ordinary soil**

Warm terracotta/orange-brown, moderately detailed, soft and rounded.

**Compacted soil**

Darker and denser, with more compressed surface features.

**Stone**

Muted purple-gray material with large rounded rock forms and fractured details.

**Hard rock**

Solid-looking, angular, reinforced stone with clearly recognizable increased hardness.

**Gold-bearing soil**

A dark, recessed square containing bright, faceted 3D gold nuggets and subtle warm illumination.

### 3.3 Damage states

Terrain damage must become visible and convincing.

First hit:

- Visible cracks appear.
- Minor debris is emitted.
- Tile remains intact.

Subsequent hits:

- Cracks deepen and branch.
- Small fragments become displaced.
- The block eventually breaks into particles.

The existing exact-hit and regeneration rules remain unchanged.

Visual damage must correspond to authoritative simulation state.

## 4. Underground depth and separation

Current empty areas are too flat and visually uninteresting.

Introduce a clear distinction between:

- Solid foreground terrain.
- Exposed tile surfaces.
- Excavated empty cells.
- Dark underground background.

Use a dark, warm brown tunnel backing with a small amount of subtle variation.

Empty cells should feel like carved-out cavities behind the physical terrain.

Use soft contact shadows around the edges of excavated areas.

Avoid excessive blur and heavy vignettes that reduce readability.

## 5. Mole character — model and animation redesign

The player must remain a cute, expressive, volumetric mole.

Keep the model within one logical cell.

Improve:

- Head-to-body proportions.
- Eyes and expression.
- Nose and whiskers.
- Digging claws.
- Feet and short legs.
- Surface shading.
- Ground contact.

The mole must be sufficiently large within its cell to remain readable.

### 5.1 Walking animation — mandatory

The current implementation lacks sufficiently visible left/right walking animation.

Implement a clearly recognizable walk cycle with:

- Alternating left/right leg motion.
- Visible body bobbing.
- Subtle body rotation.
- Opposing arm movement.
- Slight head movement.
- Appropriate directional facing.

Walking left and right must visibly animate throughout movement.

Do not merely slide the idle model horizontally.

Verify animation through several consecutive rendered frames, not only by checking animation state flags.

### 5.2 Digging animation — mandatory

The mole digs using its natural claws.

**Do not add a pickaxe to the mole.** The pickaxe in the concept is a visual reference for action and presentation, not a request to change the character's equipment.

Implement clear directional digging animations:

- Dig left.
- Dig right.
- Dig upward.
- Dig downward.

Each digging sequence should include:

1. Anticipation and body preparation.
2. Distinct claw movement toward the target.
3. A readable impact pose.
4. Brief body recoil.
5. Return or continuation into the next strike.

The animation must be synchronized with actual mining-hit events.

Damage particles should originate from the claw/block contact point.

A simple body tilt or a small claw wiggle is insufficient.

### 5.3 Other animations

Retain and improve:

- Idle breathing.
- Ladder climbing.
- Falling.
- Landing.
- Resource collection.

Animation transitions must be smooth.

Prevent the character from appearing frozen while moving.

### 5.4 Technical implementation

Use skeletal animation, articulated transforms, or an equivalent lightweight procedural animation system suitable for Three.js.

Do not rely exclusively on translating the entire character mesh.

Animate limbs using independently controlled pivots or joints.

All animation must remain inside the one-cell visual-size constraint.

## 6. UI — match the concept

The existing textual green HUD is not acceptable as the final user interface.

Redesign the interface to closely resemble the supplied concept.

### 6.1 Visual language

Use:

- Dark brown or burgundy rounded panels.
- Soft gradients.
- Beveled edges.
- Subtle inset highlights.
- Warm shadows.
- Large readable white typography.
- Gold resource accents.
- Rounded icon buttons.
- Consistent spacing and visual hierarchy.

The interface must feel like part of the same high-quality casual mobile game.

### 6.2 Top HUD

Replace the current text-heavy header with a compact visual status bar.

Desired composition:

**Left**

- Large gold nugget icon.
- Current gold or wallet amount.
- Optional small action icon if functional.

**Center**

- Current depth in meters.

**Right**

- Progression or upgrade indicator using a suitable tool/claw icon.
- Progress bar only if corresponding meaningful data exists.
- Settings button.

The reference includes a pickaxe icon, but the game uses claws. Use a claw-related icon for the actual mechanic, unless it represents a distinct established upgrade.

### 6.3 Accuracy constraints

Do not invent gameplay systems merely to reproduce concept UI.

The current game has no energy model or XP-level progress bar.

Do not add fake energy, levels, XP or other nonfunctional indicators.

Use existing Core values such as:

- Wallet.
- Gold collected.
- Depth.
- Claw power.
- Platform inventory.
- Level progress.

Use the reference's layout and visual style without misrepresenting actual gameplay.

### 6.4 Bottom controls

Redesign the existing movement, platform, purchase, pause and restart controls to match the new art direction.

Touch controls should be:

- Rounded.
- Clearly interactive.
- Visually consistent.
- At least 44 CSS pixels in touch target size.
- Suitable for portrait and landscape layouts.

Do not permanently cover the central gameplay area with oversized controls.

Desktop gameplay may use a more compact control presentation.

### 6.5 Remove prototype presentation

Replace the current raw developer-like text labels and explanatory strings with appropriate player-facing UI.

Keep necessary guidance accessible through contextual hints or a help/settings panel.

Avoid a plain green background with small white text.

## 7. Gold and lighting

Gold must become a strong visual reward.

Create faceted, stylized, volumetric gold nuggets.

Use:

- Saturated warm yellow/gold.
- Strong but controlled highlights.
- Dark recessed background.
- Warm orange edge lighting.
- Small sparkles during collection.

Gold should stand out immediately from the surrounding dirt.

Avoid excessive bloom that makes the image blurry.

### Environment lighting

Use ambient illumination, soft directional light and restrained contact shading.

The scene should have richer contrast than the current implementation while remaining readable on mobile screens.

## 8. Preserve gameplay

Do not modify the TypeScript Core unless a proven visual-integration defect requires it.

Preserve:

- Square-cell logical grid.
- 32px simulation tiles.
- One-cell player size.
- Existing 20×26 collision envelope.
- Physics and gravity.
- Automatic digging in four directions.
- Two-hit minimum for ordinary soil.
- Gold's additional hit rule.
- Three-second partial-damage regeneration.
- Automatic ladder generation during real vertical traversal.
- Ladder grip and climbing behavior.
- Existing economy and upgrades.
- Platforms and purchase/placement.
- Input handling and keyboard layout independence.
- Three existing levels.
- Campaign and restart behavior.

Rendering must adapt to gameplay, not vice versa.

## 9. Performance

Preserve optimization features from v0.4:

- Instanced geometry.
- Shared materials where appropriate.
- Chunked terrain rendering.
- Geometry reuse.
- Culling.
- Limited particle counts.
- Device pixel ratio limits.
- A single Three.js renderer and WebGL context.

Increased detail must not require an excessive number of unique draw calls.

Use geometry variation, instanced decorative meshes, procedural vertex variation, or efficient material techniques.

Avoid generating large numbers of independent objects per tile.

## 10. Implementation stages

**Stage A — Terrain quality**

Rebuild terrain geometries, materials, detailed surfaces and damage effects.

**Stage B — Camera and depth**

Make tile top surfaces visible while preserving correct grid alignment.

**Stage C — Character**

Improve mole geometry and implement obvious directional walking and claw-digging animations.

**Stage D — Resources and lighting**

Redesign gold, rocks, lighting, tunnel backgrounds and visual effects.

**Stage E — UI redesign**

Replace the current HUD and buttons with the concept-matched visual system.

**Stage F — Integration and QA**

Run gameplay regression tests, inspect rendered screenshots and validate performance.

Do not declare individual stages complete based solely on code compilation.

## 11. Visual acceptance criteria

### VA-01 Terrain detail

At normal gameplay zoom, multiple tiles visibly contain different embedded stones, surface variations, pits or cracks.

Tiles must no longer resemble identical smooth brown cubes.

### VA-02 Visible walking surfaces

The top surfaces of exposed terrain are clearly visible.

The mole appears to stand physically on the ground.

### VA-03 Square grid

All gameplay cells remain consistently aligned and visually recognizable as square units.

No freeform map geometry.

### VA-04 Walking animation

Record or capture at least six distinct temporal samples while the mole walks left, and six while it walks right.

Limb alternation and body motion must be clearly observable.

### VA-05 Digging animation

Capture at least one complete multi-pose claw-dig sequence in each of the four directions.

The arm/claw motion must be clearly visible rather than inferred from effects alone.

### VA-06 Interface match

The final HUD uses the same general style as the reference: rounded dark panels, large gold indicator, central depth indicator, clear progress/upgrade presentation and tactile controls.

No raw prototype HUD remains.

### VA-07 Gold

Gold nuggets are bright, volumetric and visually prominent.

### VA-08 Character dimensions

The mole still occupies one gameplay cell.

### VA-09 Gameplay regression

All existing Core and browser tests pass.

### VA-10 Screenshot comparison

Produce screenshots at:

- 390×844 portrait.
- 844×390 landscape.
- 1920×1080 desktop.

Also capture:

- A mole standing on exposed soil.
- Walking left and right.
- Horizontal digging.
- Vertical digging.
- A partially damaged terrain block.
- A ladder shaft.
- Gold embedded in the terrain.

Compare the actual screenshots visually against the supplied target image.

Tests passing is not sufficient if the visual result remains too simple.

## 12. Completion rule

Do not stop at a technically working renderer.

The visual result must demonstrate a significant improvement in:

1. Terrain surface complexity.
2. Visible three-dimensional block depth.
3. Character animation.
4. Interface presentation.
5. Material richness.
6. Overall similarity to the concept.

If those differences are not clearly visible in screenshots, continue refining the corresponding systems.

**Final requirement: Shiny Burrows must look like a polished casual mobile mining game, not a technical prototype using 3D cubes.**