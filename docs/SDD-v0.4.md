# SHINY BURROWS
## Software Design Document v0.4 — 2.5D Visual Overhaul

**Project:** Shiny Burrows  
**Platform:** Web / YouTube Playables  
**Genre:** Casual mining platformer  
**Target audience:** Broad casual audience, including children  
**Rendering:** Stylized 2.5D with a near-frontal camera  
**Gameplay:** Real-time, grid-based 2D platformer  
**Document status:** Consolidated development specification

---

# 1. Game Vision

Shiny Burrows is a colorful, accessible mining adventure about a cute mole digging deeper underground to discover gold and valuable resources.

The concept is intentionally simple:

**Dig deeper → Collect resources → Earn money → Buy upgrades → Reach deeper layers.**

There is no complex storyline, combat system, fantasy mythology, or unnecessary gameplay complexity.

The player controls a mole that digs through the underground environment using its natural claws.

The primary objectives are to:

- Explore deeper underground layers.
- Collect gold and valuable minerals.
- Find profitable routes through the mine.
- Manage limited resources.
- Return to the surface or shop.
- Purchase useful upgrades.
- Reach increasingly profitable underground areas.

The game should be immediately understandable without a lengthy tutorial.

## 1.1 Core design principles

1. Simple controls, understandable within seconds.
2. Satisfying digging with immediate audiovisual feedback.
3. Clear, predictable grid-based mechanics.
4. Short-term rewards from finding gold.
5. Long-term progression through mining upgrades.
6. Colorful, friendly visuals suited to children.
7. Strategic decisions without excessive punishment.
8. Consistent gameplay across desktop and mobile devices.

**Critical:** Game mechanics and visual representation must always correspond. A player should never be misled by the apparent size, shape, position, or collision boundaries of a tile or object.

---

# 2. Gameplay Architecture

## 2.1 Game dimensions

The game remains fundamentally two-dimensional.

The simulation operates on a discrete, square-cell grid.

Each logical cell corresponds to one world tile.

World objects must respect this grid regardless of how they are rendered.

All gameplay positions, tile boundaries, digging targets, and environmental interactions use the existing 2D coordinate system.

The renderer is responsible only for displaying the environment in 2.5D.

## 2.2 Coordinate system

Logical axes:

- X: horizontal movement.
- Y: vertical movement and depth.
- Z: visual depth only.

The Z axis must never introduce an additional gameplay movement dimension.

The player cannot move into or out of the screen.

Depth must not affect collision, mining, ladders, or pathfinding.

## 2.3 Grid invariants

**Every gameplay tile must be a perfect square in logical world space.**

Let the tile size be `T`.

A tile at grid position `(x, y)` occupies:

`[xT, (x+1)T] × [yT, (y+1)T]`

Required invariants:

- Every terrain tile occupies exactly one cell.
- Adjacent tiles have aligned boundaries.
- Tiles never overlap.
- Tiles never have arbitrary polygonal outlines.
- A tile's visual volume must correspond to its logical cell.
- A surface may have bevels, decorations, or minor surface irregularities, but those must not alter the grid silhouette.
- Camera settings must not make tiles appear substantially rectangular, trapezoidal, or rhombus-shaped.

No irregular terrain tessellation is allowed.

---

# 3. Player Character

## 3.1 Character identity

The playable character is a cute, friendly mole.

Required characteristics:

- Rounded brown body.
- Large expressive eyes.
- Small ears.
- Distinctive pink nose.
- Small whiskers on both sides.
- Short legs.
- Large front digging claws.
- Optional mining helmet.

The character must remain visually recognizable at small sizes.

Avoid complex outfits, realistic fur simulation, or excessive anatomical detail.

## 3.2 Character dimensions

**The mole occupies exactly one grid cell.**

This is a non-negotiable requirement.

The complete visible character, including its head, body, legs, and major silhouette, must fit within the bounds of its current cell during ordinary idle and movement states.

The mole must not look like a character occupying four cells in a 2×2 arrangement.

Its main collision body also stays within one cell.

For small movements, animation can use minor internal offsets, but no animation may visually occupy surrounding terrain cells in a misleading way.

The mole should be visually centered in the cell.

## 3.3 Character animation

Required animations:

- Idle.
- Walking.
- Digging horizontally.
- Digging vertically upward.
- Digging vertically downward.
- Falling.
- Climbing ladders.
- Collecting resources.
- Receiving upgrade feedback.

Animation must remain simple, cute, responsive, and readable.

The mole digs with its claws, not a pickaxe.

## 3.4 Movement rules

The initial gameplay model includes:

- Walking left and right.
- Moving upward and downward using ladders.
- Digging in four cardinal directions.
- Falling under gravity.

There is no jump mechanic in the initial gameplay scope.

Diagonal movement and diagonal mining are not supported.

---

# 4. Digging System

## 4.1 Automatic digging

The player must not need to press a dedicated digging button.

Digging starts automatically when the player holds a directional movement input against a diggable tile.

This behavior applies to **all four directions**:

- Left
- Right
- Up
- Down

Examples:

Holding Right against dirt starts digging right.

Holding Down above dirt starts digging downward.

Holding Up beneath dirt starts digging upward.

If the target cell is empty and otherwise traversable, the same input should perform movement rather than mining.

The directional control state is authoritative. Digging must never depend on a separate mouse click or action button.

## 4.2 Directional mining

Only one neighboring cell may be mined at a time.

Mining cannot target diagonally adjacent cells.

The active mining target must correspond to the direction currently held by the player.

When the player changes direction:

1. Stop mining the previous target.
2. Evaluate the new adjacent cell.
3. Start mining it if diggable.
4. Otherwise perform the appropriate movement action.

## 4.3 Tile durability

Standard terrain blocks always require **exactly 2 successful hits** to break.

This remains true regardless of player upgrades.

More durable blocks require 3 or more hits.

Terrain durability may increase with underground depth.

Suggested block classes:

| Material | Hits required |
|---|---:|
| Ordinary soil | 2 |
| Compact soil | 3 |
| Stone | 4 |
| Hard rock | 5 |
| Indestructible boundary | Not diggable |

The exact mapping of terrain materials to durability must be configurable.

## 4.4 Mining upgrades

Upgrades must not reduce standard tiles from two hits to one.

Upgrades may improve:

- The time between hits.
- Mining energy efficiency.
- Resource capacity.
- Resource collection efficiency.
- Other progression parameters already supported by the game.

**Invariant:** Standard tiles always require two distinct hits.

## 4.5 Partial damage regeneration

If mining stops before a tile is destroyed, damage is temporary.

A partially damaged tile restores itself after **3 seconds** without additional hits.

The regeneration resets the logical damage state.

The visual representation must also return to its undamaged appearance.

This mechanic allows players to correct accidental digging directions.

## 4.6 Mining feedback

Each mining hit should display:

- A visible impact.
- Small dirt or stone particles.
- An updated crack or damage state.
- A subtle hit animation.
- A short sound effect.

When a tile is destroyed:

- Its entire logical cell becomes empty.
- Debris particles briefly appear.
- Nearby lighting and shading update if needed.
- The gameplay simulation updates collision immediately.

Particle effects must not create real gameplay obstacles.

---

# 5. Gravity, Falling and Ladders

## 5.1 Gravity

The player is affected by gravity whenever unsupported and not in a ladder-controlled climbing state.

The player can fall through empty cells.

Falling must be predictable and aligned to the grid system.

Visual animation may be smooth even when logical position is grid-controlled.

## 5.2 Automatic ladder creation

Ladders are part of the core traversal system.

**Ladders must be created automatically during vertical digging and when the player falls through an empty vertical shaft.**

This includes:

- Digging upward.
- Digging downward.
- Falling into an existing shaft.
- Continuing downward through multiple empty cells.

Falling must not leave the player stranded solely because no ladder was generated.

The ladder system should provide a reliable route back through the player's vertical path.

## 5.3 Ladder geometry

Ladders follow the same cell grid as terrain.

A ladder segment belongs to exactly one grid cell.

It must:

- Be centered within that cell.
- Align vertically with adjacent ladder segments.
- Never overlap unrelated cells as gameplay geometry.
- Preserve continuous climbing between connected segments.
- Remain distinguishable from the surrounding terrain.

To preserve the ladder's natural proportions, some space may remain empty on its left and right sides within the cell.

This is explicitly allowed.

The ladder itself does not have to fill the entire tile width.

## 5.4 Ladder rendering

Ladders should appear as simple three-dimensional wooden or similarly stylized structures.

Use:

- Two rounded vertical rails.
- Several crossbars.
- Slightly beveled edges.
- Soft shadows.
- Minimal material detail.

Do not render a ladder as an oversized object occupying two or more tile widths.

## 5.5 Platforms and bridges

The game supports purchasable or placeable traversal structures as established in the original gameplay concept.

A basic platform spans one grid cell.

Platforms should support the player from above while preserving the intended drop-through mechanics.

They must remain aligned to the logical grid and visually distinct from solid terrain.

---

# 6. Underground World

## 6.1 World structure

The environment is a vertically extending underground mine.

The player starts near the surface and progresses deeper into increasingly valuable underground areas.

The environment contains:

- Diggable soil.
- Compact soil.
- Stone.
- Hard rock.
- Empty tunnels.
- Ladders.
- Platforms.
- Gold deposits.
- Valuable minerals.
- Special resource deposits.

## 6.2 Depth progression

Deeper layers must feel progressively different.

Progression is communicated through:

- Changes in soil color.
- Changes in stone materials.
- More durable terrain.
- More valuable mineral deposits.
- Larger potential rewards.
- Increasing energy and traversal challenges.

The game does not need narrative events to justify these changes.

**The player should understand that deeper mining means greater earning potential.**

## 6.3 World generation

World generation should use discrete square cells.

Generation rules must respect:

- Terrain connectivity.
- Traversable areas.
- Resource distribution.
- Valid mining paths.
- Ladders and player access.
- World boundaries.
- Difficulty progression.

Visual effects must not change generated terrain geometry.

Resource distribution and digging difficulty should remain governed by the gameplay model, not the renderer.

---

# 7. Economy and Upgrades

## 7.1 Mining rewards

The player earns money by collecting resources.

Gold is a primary and visually distinctive resource.

Deeper deposits generally provide higher rewards.

Reward generation should be simple and understandable.

## 7.2 Shop

The shop allows collected money to be spent on upgrades.

The shop should present clear upgrade costs and straightforward benefits.

Potential supported upgrade categories include:

- Digging speed.
- Energy capacity.
- Energy efficiency.
- Carrying capacity.
- Resource value bonuses.
- Traversal equipment.

Upgrades must not invalidate core rules such as standard soil always requiring two hits.

## 7.3 Energy

Retain the existing energy-management system.

Energy consumption is associated with the relevant mining and traversal actions as defined by the gameplay core.

The game should communicate energy clearly through the UI.

Energy upgrades improve the amount of useful activity available before replenishment.

## 7.4 Player motivation

The progression loop should continually create a visible goal:

- Mine another layer.
- Find a better deposit.
- Collect enough money for an upgrade.
- Unlock more efficient progression.
- Travel deeper.

Avoid unnecessarily complex currencies and progression trees.

---

# 8. NEW — 2.5D Visual Design

## 8.1 Visual objective

Replace flat 2D rendering with a polished, stylized, volumetric visual presentation.

The desired result looks like a modern, cute, toy-like casual mobile game.

The environment should resemble a small, handcrafted underground diorama made from clean 3D objects.

However, it must maintain the readability and visual framing of the existing 2D game.

**This is a visual modernization, not a change of genre or game mechanics.**

## 8.2 Art direction

Required style:

- Stylized 3D geometry.
- Smooth, rounded shapes.
- Soft bevels.
- Clean surfaces.
- Warm, colorful materials.
- Gentle ambient lighting.
- Soft contact shadows.
- Friendly cartoon proportions.
- Minimal surface noise.
- Simple, expressive animations.

Avoid:

- Photorealism.
- Realistic dirt scans.
- High-frequency noisy textures.
- Dark horror aesthetics.
- Complex cinematic lighting.
- Sharp, visually aggressive geometry.
- Excessive bloom.
- Excessively shiny or metallic terrain.
- Dense environmental decoration.

The result must remain attractive at small screen sizes.

## 8.3 Camera

Use a near-frontal 2.5D camera.

The gameplay plane must remain visually close to a traditional side-view platformer.

The camera may use a slight vertical angle to reveal the thickness and upper faces of 3D objects.

Camera requirements:

- Prefer orthographic projection.
- No strong perspective distortion.
- No isometric view.
- No dramatic diagonal camera.
- No substantial horizontal rotation.
- No camera rotation during regular gameplay.
- Tile boundaries remain visually grid-aligned.

The camera angle should be subtle enough that the player primarily sees square frontal tile faces.

Object thickness must be noticeable without making the environment appear to have a second navigable dimension.

If tilt causes the visible tile faces to become noticeably non-square, reduce the angle or compensate for its projection.

## 8.4 Terrain geometry

Every terrain cell is rendered as an individual volumetric block or equivalent optimized tile geometry.

Required properties:

- Square front face.
- Consistent visual dimensions.
- Subtle rounded bevels.
- Shallow visible thickness.
- Correct alignment with neighboring blocks.
- Minor material variation.
- Subtle soft shadows.

Terrain may use small decorative imperfections within a cell.

Decorations must not break the silhouette of the logical tile.

**Forbidden:** Procedurally irregular polygons that replace the game's square grid with a freeform underground shape.

## 8.5 Terrain materials

Use a simplified material hierarchy:

**Soil**

- Warm brown.
- Smooth matte appearance.
- Soft edge shading.
- Occasional subtle embedded details.

**Compact soil**

- Slightly darker or richer brown.
- Denser appearance.
- Clear distinction from normal dirt.

**Stone**

- Muted gray.
- Rounded chipped-looking details.
- Stronger perceived solidity.

**Hard rock**

- Darker stone.
- Visually recognizable toughness.
- Clearly differentiated from ordinary stone.

Materials must remain readable without relying on high-resolution textures.

## 8.6 Gold and valuable minerals

Gold should appear as attractive three-dimensional nuggets or embedded deposits.

Gold nuggets must be:

- Bright warm gold.
- Rounded and stylized.
- Clearly identifiable.
- Visually separated from ordinary terrain.
- Appropriate for a friendly mobile game.

Gold should not resemble generic flat yellow coins unless a specific gameplay element intentionally represents currency.

Gems may be used for additional high-value deposits.

Resource visuals must align with their logical tile positions.

## 8.7 Character rendering

The mole should become a real or convincingly volumetric stylized 3D character.

Use a compact toy-like silhouette.

The character must retain:

- Cute facial proportions.
- Distinctive pink nose.
- Small ears.
- Symmetrical whiskers.
- Prominent claws.
- Friendly expression.

Its rendered dimensions must correspond to **one logical cell**.

Avoid realistic hair, complicated fur shaders, oversized helmets, or silhouettes that obscure surrounding cells.

## 8.8 Lighting

Recommended lighting:

- Soft ambient fill.
- Gentle directional illumination from above and in front.
- Ambient occlusion or equivalent subtle contact shading.
- Limited shadow softness.
- Optional simple highlights on gold and gems.

Lighting should strengthen the perception of volume without reducing gameplay visibility.

Dark mine areas must not become difficult to navigate.

## 8.9 Visual effects

Effects should be lightweight and purposeful.

Include:

- Dirt particles on impact.
- Tiny dust clouds when blocks break.
- Stone chips from harder terrain.
- Simple gold collection sparkle.
- Subtle upgrade feedback.
- Limited character squash/stretch.

Effects must never obscure adjacent cells or interfere with directional reading.

---

# 9. Visual Geometry Constraints

This section has the highest priority during visual implementation.

## 9.1 One tile = one square

A terrain tile occupies exactly one grid cell.

Even in 3D:

- The front face stays square.
- The visible block footprint stays grid-aligned.
- Neighboring blocks fit without inconsistent gaps.
- No freeform tile boundaries are permitted.

## 9.2 One mole = one cell

The complete mole character must fit visually inside one cell.

No oversized character model.

No 2×2-cell mole.

No large head overlapping adjacent blocks during ordinary gameplay.

## 9.3 Ladders are grid objects

A ladder segment occupies one cell and connects vertically.

Its visible geometry may be narrower than the cell.

Unused space around the ladder remains empty.

## 9.4 Grid-aligned holes

A destroyed tile leaves a square hole occupying precisely one logical cell.

A vertical shaft consists of aligned empty cells, not a freely sculpted organic tunnel.

## 9.5 Noninteractive visual depth

3D thickness is purely decorative.

A terrain block cannot become wider, narrower, traversable, or obstructive due to visual depth.

## 9.6 Logical and visual agreement

The visible mining target must match the actual logical mining target.

Collision boundaries must agree with the apparent gameplay-space boundaries.

The renderer must never suggest that the mole can walk into the depth of the screen.

---

# 10. Input System

## 10.1 Desktop controls

Core input:

- Left: Move or dig left.
- Right: Move or dig right.
- Up: Climb or dig upward.
- Down: Descend or dig downward.

Support arrow keys and WASD-compatible physical keyboard controls.

## 10.2 Keyboard layout independence

Controls must work regardless of active keyboard language.

Use `KeyboardEvent.code` rather than depending exclusively on localized `KeyboardEvent.key` values.

Requirements:

- English layout.
- Ukrainian layout.
- German layout.
- Other non-English layouts where physical key mappings apply.
- Arrow-key fallback.

Prevent unwanted page scrolling during focused game controls.

## 10.3 Touch input

Provide mobile-friendly directional controls.

Touch controls must support continuous holding.

Touch and desktop input must resolve to the same gameplay actions.

There must not be a separate mandatory digging button.

## 10.4 Continuous input behavior

Holding a direction triggers repeated appropriate actions.

This includes:

- Horizontal movement.
- Horizontal digging.
- Vertical digging.
- Ladder traversal.

Controls must not require repeated manual taps to dig consecutive blocks.

Input repetition should be controlled by gameplay timing rather than the operating system's keyboard-repeat events.

---

# 11. User Interface

The interface should remain simple, playful, and readable.

Display the essential information:

- Current resources or money.
- Energy.
- Mining depth.
- Relevant upgrade information.
- Shop access.
- Pause/settings.

Use rounded UI elements consistent with the stylized 3D world.

Avoid excessive panels and text.

The gameplay environment should occupy most of the viewport.

## 11.1 Responsive behavior

Support desktop and mobile aspect ratios.

Maintain logical tile proportions on all screens.

Do not stretch the world horizontally or vertically.

Do not make the grid cells non-square when resizing the viewport.

The world camera may reveal a different number of cells depending on the available screen size.

---

# 12. Technical Architecture

## 12.1 Existing architecture

Preserve the independent TypeScript gameplay core.

The existing design used Phaser 3.90 for presentation with a separate TypeScript gameplay model.

The visual upgrade must not require rewriting core mechanics.

## 12.2 New rendering approach

Preferred implementation:

**TypeScript gameplay core + Three.js/WebGL 2.5D renderer**

The Three.js renderer consumes the current simulation state and produces 3D visuals.

If Phaser remains responsible for input, audio, UI, or application lifecycle, these responsibilities should be explicitly separated from the renderer.

Do not introduce a second physics simulation.

## 12.3 Architecture separation

Maintain clear boundaries:

**Simulation**

- World grid.
- Tile types.
- Tile durability.
- Mining.
- Gravity.
- Ladder creation.
- Character movement.
- Collision.
- Inventory.
- Economy.
- Energy.
- Upgrades.

**Rendering**

- Terrain meshes.
- Materials.
- Camera.
- Lighting.
- Character visuals.
- Animations.
- Particles.
- Visual effects.

**Input/UI**

- Keyboard.
- Touch.
- Game HUD.
- Menus.
- Shop.
- Settings.

The renderer must not directly change gameplay state.

## 12.4 Coordinate conversion

Implement a deterministic conversion from logical grid coordinates to render-space coordinates.

All gameplay objects should use this centralized conversion.

Do not independently calculate tile spacing in multiple render components.

## 12.5 Rendering optimization

YouTube Playables and mobile web performance are priorities.

Use where appropriate:

- Shared geometries.
- Shared materials.
- Instanced meshes.
- Chunked world rendering.
- Frustum culling.
- Limited dynamic lights.
- Simple shadowing.
- Small particle pools.
- Low-poly geometry.
- Controlled draw calls.

Avoid expensive postprocessing unless it provides a measurable visual improvement without compromising performance.

## 12.6 Simulation integrity

The 2.5D renderer must not alter:

- Grid dimensions.
- Existing save data.
- Collision results.
- Mining target selection.
- Tile durability.
- Energy costs.
- Resource values.
- Ladder behavior.
- Player upgrades.

The visual migration is not authorization for a gameplay rewrite.

---

# 13. Acceptance Criteria

## AC-01 — Square grid

Every terrain cell has a square logical footprint and a visually square main frontal face.

No irregular tile geometry is visible.

## AC-02 — Character size

The mole occupies one and only one logical cell.

Its model remains appropriately scaled inside that cell.

## AC-03 — 2.5D rendering

Terrain, character, resources, and ladders appear volumetric.

The screen remains a near-frontal side view.

No isometric perspective or additional gameplay axis is introduced.

## AC-04 — Automatic horizontal digging

Holding Left or Right against a diggable tile automatically damages and destroys it.

No dedicated dig button is required.

## AC-05 — Automatic vertical digging

Holding Up or Down against diggable terrain automatically mines in that direction.

## AC-06 — Standard tile durability

Every standard tile requires exactly two hits, regardless of upgrades.

## AC-07 — Hard terrain

Harder blocks require three or more hits according to configuration.

## AC-08 — Damage regeneration

A partially mined block fully regenerates after three seconds without further mining.

## AC-09 — Automatic vertical ladders

Vertical digging creates appropriate ladder segments.

## AC-10 — Falling ladders

Falling through empty vertical cells produces the required ladder path.

## AC-11 — Ladder geometry

Ladders align to the grid and remain within their assigned tile widths.

## AC-12 — No jumping

Jumping remains absent unless introduced through a separate approved gameplay change.

## AC-13 — Keyboard layouts

Movement and mining work with non-English keyboard layouts.

## AC-14 — Touch support

All four directional inputs support continuous holding on touch devices.

## AC-15 — Economy preservation

Resources, energy, shop, and upgrades continue functioning according to existing simulation rules.

## AC-16 — Visual consistency

The mole, dirt, rock, gold, ladders, and platforms all share the same coherent stylized 3D art direction.

## AC-17 — Performance

The game remains responsive on target desktop and mobile browsers.

No significant simulation or input latency is introduced by the renderer.

## AC-18 — Regression safety

Existing gameplay regression tests continue passing.

The new renderer does not modify simulation outcomes.

---

# 14. Required Implementation Order

The migration should be incremental.

### Phase 1 — Preserve and validate the current game

- Establish a regression baseline.
- Confirm current grid and simulation behavior.
- Add tests for the latest mining and ladder requirements.
- Separate renderer-dependent logic from simulation logic.

### Phase 2 — 2.5D terrain

- Implement orthographic 2.5D camera.
- Add square volumetric terrain cells.
- Implement soil and rock materials.
- Preserve the original grid layout.
- Verify tile alignment and square appearance.

### Phase 3 — Character and world objects

- Introduce stylized volumetric mole model.
- Scale the character to exactly one cell.
- Add volumetric ladders.
- Add gold nuggets and mineral deposits.
- Add 3D platforms.

### Phase 4 — Animations and effects

- Integrate movement and mining animations.
- Add crack progression and regeneration.
- Add digging particles.
- Add gold collection effects.
- Add soft lighting and contact shadows.

### Phase 5 — Gameplay integration

- Confirm all directional digging.
- Confirm falling and ladder creation.
- Confirm collision consistency.
- Confirm inputs and energy systems.
- Confirm shop and upgrades.

### Phase 6 — Optimization and QA

- Optimize mesh rendering.
- Test mobile performance.
- Validate responsive behavior.
- Verify keyboard layout independence.
- Run regression tests.
- Compare gameplay before and after the migration.

---

# 15. Definition of Done

The visual overhaul is complete when:

1. The entire visible gameplay world uses the approved 2.5D art direction.
2. All logical terrain cells remain square.
3. The mole visibly occupies exactly one cell.
4. All ladders and platforms remain grid-aligned.
5. The player can dig automatically in all four directions.
6. Standard tiles still take exactly two hits.
7. Partial mining damage still regenerates.
8. Falling generates the required ladders.
9. Existing gameplay and economy systems remain functional.
10. Both desktop and touch controls work properly.
11. The new renderer does not break existing tests.
12. The game performs acceptably on supported web devices.

## Final development constraint

**Do not redesign the existing gameplay to fit the new graphics. Redesign the graphics to fit the existing gameplay.**

The result must feel like the same Shiny Burrows game, but with a richer, cleaner, more dimensional, and more attractive visual presentation.