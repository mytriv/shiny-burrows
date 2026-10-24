# SHINY BURROWS — MILESTONE B.5
## Controls and Presentation Polish before Gameplay Expansion

We are intentionally pausing major gameplay expansion to improve core feel, readability and visual appeal first.

Important context:
- Local real-PC testing is currently smooth and acceptable.
- The previously reported SwiftShader software-rendering limitations should remain documented, but they are not the immediate blocker for this milestone.
- Before implementing major new Bonanza gameplay systems, we want cleaner controls, more predictable movement and a more appealing casual-mobile presentation.

Use the attached visual references as direction:
- Image A: target visual style reference (cartoonier, more polished, more casual-mobile).
- Image B: current in-game look that has become too technical / flat / prototype-like.
- Image C: current fog-of-war issue showing overly square and harsh reveal transitions.

## Primary goal

Improve:
1. movement predictability
2. gameplay readability
3. visual appeal
4. fog presentation

Do this before further gameplay feature expansion.

---

## 1. Convert movement to tile-based traversal

We want movement to become cell-based rather than free continuous locomotion.

### Requirements

- The simulation should become grid-step based.
- The mole occupies exactly one logical cell.
- A movement action attempts to move the mole into one adjacent cell.
- Directions remain:
  - Left
  - Right
  - Down for digging / descent
  - Up only for climbing existing ladders
- No upward digging.
- Terrain, ladders, falling rocks and hazards must continue to obey the square grid.

### Desired behavior

- If the adjacent target cell is empty and reachable, the mole transitions into that cell.
- If the target cell contains diggable terrain, the mole stays in place and performs digging against that cell.
- Standard dirt still requires exactly two hits.
- Gold-bearing dirt still requires the normal extra hit.
- Hard terrain keeps its current approved durability formulas.
- If the mole loses support, falling should also resolve cleanly by grid logic.
- Ladder climbing and ladder descent should align exactly to grid cells.
- No ambiguous half-cell resting positions.
- No slippery “continuous drift” feeling.

### Presentation

The simulation should be tile-based, but rendering may interpolate smoothly between cell centers so the game still looks polished and animated rather than jerky.

Keep:
- fixed-step authoritative simulation
- deterministic behavior
- existing testability
- one-cell mole
- square grid
- three-direction digging restriction
- current ladder bug fixes

### Acceptance goals

- Movement feels predictable and deliberate.
- Player can clearly reason about route planning.
- Tile occupancy is always obvious.
- Ladder behavior remains stable.
- Existing ladder-mining fixes must not regress.

---

## 2. Improve control feel around tile-step movement

Once movement becomes cell-based:

- holding a direction may queue/repeat cell-step attempts at a readable cadence
- responsiveness must remain good
- repeated input must not produce accidental overshoot
- keyboard, mouse and touch must remain supported
- non-QWERTY physical keyboard support must remain intact

Preserve accessibility and mobile usability.

Add/update tests for:
- single-step movement
- repeated held movement
- digging against terrain from a cell
- ladder entry/exit
- falling after support loss
- mining from ladders
- route determinism under different frame rates

---

## 3. Visual restyle toward the earlier cartoon target

The current visual style has become too dry / technical / prototype-like.

We want to move it closer to the earlier attractive concept style:
- more cartoonish
- more rounded
- more casual-mobile
- more toy-like
- warmer and more readable

This is not a total art restart, but a strong presentation polish pass.

### Terrain goals

- richer clay-like rounded block forms
- stronger readability of soil vs stone vs ore
- more appealing shading
- softer forms and slightly chunkier silhouettes
- visually rewarding gold-bearing tiles

### Mole goals

- make the mole cuter and more expressive
- stronger casual-game silhouette
- slightly more toy-like proportions
- keep it within one cell visually and logically

### Gold goals

- make deposits more appealing and obvious once revealed
- more satisfying nugget shapes
- stronger contrast with surrounding soil
- preserve embedded-in-earth presentation

### UI goals

Bring the UI closer to the earlier target style:
- thicker rounded panels
- more polished mobile-game buttons
- warmer highlights and depth
- better visual hierarchy
- still compact and gameplay-readable

Do not bloat the interface or reduce gameplay area unnecessarily.

---

## 4. Fog of war: softer visual transitions

Current issue:
The discovery system is functionally correct, but the fog edge looks too square and abrupt.

We want to preserve the existing cell-based discovery logic, while making the presentation softer and more natural.

### Requirements

- Discovery logic remains grid-authoritative.
- The renderer may visually soften the reveal edges.
- Opened space must remain readable.
- The fog should feel less like hard black square chunks.

### Desired presentation direction

- softened reveal contours
- rounded or feathered fog boundaries
- subtle gradient / darkening transitions
- preserve performance-conscious rendering
- no expensive full-screen postprocessing pipeline
- no mystical glows or unrelated VFX

### Important

Do not break:
- exact logical square grid
- deterministic reveal state
- gameplay readability
- current exploration mechanics

The softness is a presentation layer, not a gameplay logic rewrite.

---

## 5. Keep current scope focused

Do NOT begin major gameplay-expansion systems yet.

Specifically defer for now:
- major new hazards
- explosives
- support structures
- Endless procedural mode expansion
- story progression overhaul beyond what is needed for movement compatibility

This milestone is about:
- controls
- readability
- visual identity
- presentation polish

---

## 6. Deliverables

Implement the actual source changes and provide:

1. tile-based movement update
2. ladder/fall integration with the new movement model
3. updated control-feel behavior
4. visual polish pass toward the cartoon mobile target
5. softer fog presentation
6. updated regression tests
7. browser screenshots comparing key scenes
8. updated implementation status

Document:
- what changed
- what was intentionally deferred
- any migration tradeoffs
- any new gameplay edge cases introduced by tile-based traversal

Run:
- full unit tests
- typecheck
- lint
- production build
- browser regression suite

Start implementation now.