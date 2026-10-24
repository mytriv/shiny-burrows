# SDD v0.2 migration plan — recorded before code changes

The supplied platformer specification will be copied verbatim to `docs/SDD-v0.2.md` because that file is not yet present. It supersedes incompatible v0.1 gameplay. No dependency changes are planned.

| Existing module/feature | Treatment |
| --- | --- |
| package.json/lockfile, Vite, TS, ESLint, Vitest, Playwright, licenses | Preserve exact pins; adapt browser assertions to the new game |
| core/model.ts and levels.ts | Replace contracts/schema with pixel feet coordinates, explicit AABB, 32px tiles, overlays and boulder entities |
| core/reducer.ts and gravity.ts | Archive; replace with stepGame at 60Hz and axis-separated substepped collisions; rocks adapted only in P0d |
| core/history.ts and scoring.ts | Archive; remove turn undo and medals from runtime/UI; retain restart and quota concepts |
| app/GameController.ts | Rewrite as accumulator with five-step catch-up cap, edge input consumption, pause and restart |
| content/levels/first-dig.ts | Archive; P0a sandbox then one authored First Burrow in P0c |
| presentation/phaser/tiles.ts | Reuse original primitive sprite generator; extend terrain names and bridge artwork |
| presentation/phaser/LevelScene.ts | Replace discrete event playback with snapshot interpolation, camera, held input and separate actions |
| M1 tests (58) | Archive intact outside active test/TS/lint globs; replace superseded assertions with mapped real-time coverage below |

## Ordered gates

1. P0a: create motion/collision core, sandbox with a hole, fixed-step controller and interpolating renderer. Test stable support >=120 ticks, unsupported fall, walls/floors/ceilings/bounds, grounded-only jump and deterministic replay. Build and run browser motion tests at 390×844, 844×390 and 1920×1080. Do not proceed until unsupported falling and wall collision are verified.
2. P0b: add dig targeting/range/cooldown, energy, ore and overlay loot, optional secret, quota/exit. Test floor excavation/fall and once-only rewards plus rejection invariants; build/typecheck/lint and relevant browser assertions before proceeding.
3. P0c: add one-way one-cell bridges and accounting/preview. Author First Burrow with low-ceiling one-cell gap and a longer diggable lower route. Record legal 60Hz inputs for both solutions, secret and attempted jump bypass. Gate on actual physics replay proving both routes and a failed gap bypass.
4. P0d: add stable-ID real-time rocks, safe release and crush/restart, polish pointer IDs/blur/pause/camera, production browser playthroughs, viewport screenshots and final full checks. Stop at P0d.

## Physics and targeting decisions

Player position is bottom-center (feet); collider 20×26, tiles 32. Constants: 96px/s horizontal, gravity 560px/s², jump -200px/s, terminal 360px/s. Fixed 1/60s step only; collision resolves X then Y with <=4px microsteps. Coyote time is omitted (optional); grounded-only jump edges. Static tiles are solids; treasure/exit/secret are overlays. Bridges are one-way tops, rocks ignore them. Rock sides are solid to the player. Core returns serializable state and ordered events; arrays are copied only for edits, player/small entity records per tick. No browser/Phaser imports in Core.

Dig default is facing at body center; I/K select up/down and J/X confirms, separate from jump. Pointer/touch select a tile then confirm. Bridge default is the adjacent bank-level cell in facing direction. Both previews use Core validators, with explicit action rejection feedback. Successful dig costs 1 energy; successful bridge costs 5 wallet coins and 1 energy; invalid actions cost nothing. At zero energy, movement/exit remain allowed and restart is always available; do not invent automatic unwinnability detection.

## Superseded-test mapping

- Tile-step movement/invalid steps -> continuous displacement, support/collision, fixed-tick input.
- Dig/collect conservation and immutable source level -> adjacent digging, unique loot IDs, independent wallet/quota/spend and definition isolation.
- Cascade ordering/fragile destruction -> fixed-tick rock release/landing/crush and determinism; fragile chain breaking deliberately deferred to P1 with explicit test.
- Full-turn Undo -> reset reproducibility, failure/restart and pause/resume; no Undo UI.
- Exit/secret/medals -> physical exit overlap + quota and once-only optional secret; medals deferred.
- Old sample legal grid solutions -> paid/free/secret tick-indexed platformer replays and browser end-to-end input.
- Old browser keyboard/touch/resize/offline -> held movement and action edges, multitouch/cancel/blur, airborne resize and three viewports.
