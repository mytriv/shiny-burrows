# v0.4 migration plan — 2026-10-23, before implementation

Authority: the user's pasted SDD is copied verbatim to SDD-v0.4.md. This is a visual migration; section 12.6 and the final constraint preserve current simulation outcomes.

## Preserve

- Every file in src/core, authored levels, GameController, physical-code BrowserInput, fixed 60Hz steps and existing camera framing. Grid remains 32px, mole collider 20×26px, with no jump or second physics system.
- Automatic four-direction digging (including standing Up within 8px reach), exact two-hit ordinary soil, gold's extra hit, regeneration at 180 ticks, idle ladder grip, actual-motion ladders and one-way paid platforms.
- Campaign version, entry/restart semantics, rewards, upgrade effects/prices, three authored levels, Phaser 3.90.0, Vite/TypeScript and existing test infrastructure.

## Replace / separate

- Replace flat Phaser world sprites, procedural tile textures and graphical markers with a Three.js orthographic world renderer. Phaser runs HEADLESS lifecycle/timing only; existing DOM input/UI are separate. No second visible canvas or renderer/physics loop.
- Extract HUD and event sound from the scene. A renderer interface receives readonly state/events/interpolation and cannot mutate Core. Shared conversion maps logical (x,y) to (x,-y,z); z is decorative only. No camera tilt: square front faces and equal x/y scale are exact.
- Original low-poly beveled blocks, warm materials, internal crack overlays, rounded mole and claws, wood ladders/platforms, nugget clusters and lightweight pooled effects replace old assets. Keep complete mole silhouette within a 20×26 world envelope, smaller than one cell, including animation.
- Archive old renderer sources outside the build. Add Three.js and its development TypeScript declarations; Node development declarations support filesystem/hash regression tests. Share geometry/materials, instance terrain/structures, use ambient/directional lighting and baked/contact shading rather than expensive postprocessing/shadow maps. Cap device pixel ratio.

## Specification discrepancies

- There is no current energy system (removed by v0.3); do not invent energy costs, capacity or a misleading HUD meter. AC-15 preserves the economy that actually exists. Report energy as absent and that portion of the spec unfulfilled.
- Hard terrain currently uses max(2, ceil(base/power)) hits, gold +1. The suggested v0.4 table and AC-07 could imply >=3 even with upgrades; changing this would violate 12.6. Preserve existing configurable values/effects; ordinary soil remains exactly two hits at all tiers. Document rather than silently rebalance.
- Continuous motion can cross cell boundaries; "one cell" means a bounded character silhouette/collider no larger than one cell, following exact logical position, not snapping the smooth player to a different grid cell.

## Ordered gates

1. Baseline: full Core suite, typecheck/lint/build and existing Chromium suite. Snapshot Core/content hashes and deterministic replay signatures. Add conversion, one-cell bounds and renderer non-mutation tests.
2. Terrain: orthographic projection, square 32×32 front faces, shared beveled shallow geometry/materials, original grid and empty square holes. Test conversion/projection and terrain instance synchronization.
3. Objects: bounded volumetric mole, one-cell rails/rungs/platforms, embedded gold/gems, boulder and green exit. Test model bounds and world alignment.
4. Effects: directional claw digging, walk/climb/fall/idle/collection/upgrade, cell-local cracks/healing, capped pooled particles, gentle light/contact shading and user-gesture-unlocked synthesized audio. Respect reduced motion, pause/restart and cleanup.
5. Integration: unchanged full Core tests; real keyboard/mouse/touch mining and ladder/fall routes, paid platforms, campaign/upgrades, regeneration. Render-state telemetry remains inspection-only for browser tests.
6. QA: typecheck/lint/build, full Chromium suite plus visual geometry/non-mutation/performance tests; inspect screenshots at portrait 390×844, landscape 844×390 and desktop 1920×1080. Measure draw calls, geometry/texture counts, frame timing and restart resource stability. Compare final Core/content hashes and replay signatures with baseline. Desktop emulation cannot certify physical mobile performance; report that limitation.

Do not label all acceptance criteria complete if energy or physical-device performance remains unverified. Record actual phase checks and results in IMPLEMENTATION_STATUS.md.
