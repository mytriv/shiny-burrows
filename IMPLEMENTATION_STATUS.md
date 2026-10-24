# Implementation status

## Milestone B.5 — cell traversal and presentation polish (2026-10-24; verified locally)

Authority: `docs/MILESTONE-B5-REQUEST.md`, copied from the user's pasted request. This supersedes continuous player motion and fractional-rest assumptions in older specifications/status sections. Pre-code design and migration tradeoffs: `docs/MILESTONE-B5.md`. Major gameplay expansion remains paused. The user's smooth real-PC play report is retained as user evidence; historical SwiftShader limits are documented below and are not treated as this milestone's immediate blocker.

### Movement and control feel

- `core/motion.ts` now commits exactly one reachable adjacent32px cell per action. Player position is always canonical center X /bottom Y; collider remains20×26 within that cell. New off-grid spawns are rejected. A serializable `traversal` record locks a committed walk/climb for12ticks (200ms), or fall for6ticks (100ms). Holding repeats only at boundaries; release queues no extra movement. A reversal during a step takes effect only if still held at the next boundary. No continuous drift, fractional resting cell or airborne lateral steering.
- `core/traversal.ts` centralizes cell coordinates and timing. `app/playerPose.ts` interpolates one committed segment with easing; the camera and renderer follow that same visual position. Core collision, reward and discovery decisions use canonical occupancy, never the interpolated pose. Input is responsive immediately; a short tap commits one cell and visually finishes it even after release.
- Adjacent diggable cells keep the mole stationary and use the existing contact-mining cadence. Dirt remains exactly2hits at every upgrade; gold adds one hit; harder strata,24-tick strikes and180-idle-tick regeneration are unchanged. Breaking a block does not move the mole in that tick. Released input leaves it in place; a later held attempt can enter the opening.
- Ladder grip remains stable while mining in either direction. Up uses connected existing rungs, platform connectors or the shaft-bank foothold; a disconnected rung gap cannot provide ascent. Up never digs. A successful side step releases grip only if the destination lacks ladder support; an unsupported destination falls at its next movement boundary. There is no artificial fall through a solid neighboring floor. Only actual downward cell transitions generate ladders, once per candidate per attempt. Horizontal steps/mining and ascent never create rungs.
- One-way platforms retain price5, separate buy/place and intentional fresh-Down drops. A Down press during a committed step buffers one explicit drop until its boundary; it cannot cascade through stacked platforms. Pause clears an uncommitted buffered drop and held input, while preserving the committed cell. Restart recreates entry state.
- Existing boulders now descend one whole cell per6ticks after their12-tick warning, using deterministic bottom-first ordering, solid-cell/stack collision, crush and fragile-floor impact rules. Their renderer interpolates the committed cell descent. No new hazards or campaign boulders were added.

### Presentation delivered

- Rounder clay bevels retain exact32×32×22 geometry. Warmer specular shading and softer normal relief replace the dry look; fewer tiny loose flecks leave clearer chunky surface forms. Larger faceted nuggets remain embedded in complete soil/recesses and retain the existing finite value tiers. Square stone and rounded boulders remain distinct.
- The one-cell mole has larger bright eye whites, pink cheeks, a small smiling mouth/tooth and a fuller orange helmet dome without exceeding the previous20×26 visual-size checks. Articulated walking/climbing and directional claw sequences remain; no character scaling across cells.
- Warm lacquered panels/buttons now have thicker rounded rims, cream highlights and depth. Direction controls are grouped left and tools right, closer to the supplied casual-mobile reference. Gold, depth, claw power and quota remain truthful; no fake XP, backpack or purchase-plus control. Portrait/landscape keep compact layouts and all interactive targets≥44px.
- Fog logic/bitset is unchanged. Undiscovered cells stay opaque and submit no terrain/nuggets. One shared lightweight edge shader feathers cardinal borders and rounds diagonal contours over discovered cells using cached instance masks. The edge plane is projection-compensated so its gradients align with the logical grid. Only affected chunks/neighbors rebuild; no full-screen pass, dynamic glow system or per-frame geometry rebuild. This replaces the pre-code texture-atlas idea without adding assets/dependencies.

### Migration and verification

The initial migrated unit run exposed63 incompatible continuous-motion assumptions (including off-grid fixtures) and a rounded-mesh depth bound; these were resolved. Existing tests were migrated to canonical cells, not disabled. Earlier continuous motion/boulder source and five major test suites are retained in `archive/b5-continuous/`. Adjacent-row mining tests now assert that above/below cells remain intact; former tolerance/edge assertions check exact cell departure and solid-bank/platform behavior. The historical replay baseline is preserved; new exact all-tier timings are asserted. Unrelated Core hash tests, geometry/one-cell checks, economy, discovery and hazard regressions remain active.

| Check | Actual final result |
| --- | --- |
| Full unit suite | **172 passed,20 files,1.87s** — `node node_modules/vitest/vitest.mjs run` |
| Typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed**,43 modules,5.40s — JS2,027.67kB /484.03kB gzip; CSS10.11kB /3.09kB gzip. Existing large-chunk advisory remains. |
| Full production Chromium suite | **45 passed,4.8m**, exit0; `.last-run.json` reports passed. No weakened/skipped performance assertions. |

Twelve new Core/presentation tests cover single-step, held repeat, release/reversal, off-grid rejection, smooth visual-only interpolation, support loss, buffered drop/pause, disconnected ladders, frame grouping, exact campaign timing and fog-cache reuse. Three new browser cases test single-cell tapping, no release overshoot, mining in place, post-break release and one-cell entry through physical non-QWERTY keys, mouse and touch. Existing suspended ladder mining, multitouch, cancellation, three-direction mining, ascent/descent, paid/free campaign routes, upgrades/retry, platform drops, boulder/fragile behavior and all walking/claw animation browser checks pass.

First browser migration run:38 passed /4 failed due to obsolete86px wall contact and fractional-height assertions. Those tests were corrected to require80px cell centers,192px ladder stops and a supported adjacent-floor exit. Final45-test combined run passes on the built game. The climb/step-off test waits for its committed boundary before measuring a horizontal transition; later genuine downward transitions remain authorized ladder events.

All three authored mines are unchanged and solve at every claw tier without mandatory purchases. Base routes now take1191/1349/2035ticks (19.9/22.5/33.9s); power2/3: First Burrow999/999, Amber Hollow989/989, Golden Depths1339/1051. Route rewards remain30/71/122; paid First Burrow still adds6gold and spends5. These are scripted solve times, not first-time-player pacing measurements.

### Screenshots and performance

Inspected actual390×844 portrait,844×390 landscape and1920×1080 desktop opening/exploration captures: square terrain, embedded ore, one-cell mole, visible block depth, readable tunnel/ladder and reachable controls remain. `docs/screenshots/milestone-b5/comparison.html` shows six before/after scene pairs using actual screenshots. Before captures are from the preserved B receipts; traversal progress scenes can differ by one row because stops are now whole cells. The `after/` folder retains36 artifacts: new control captures, exploration/full-world surfaces, six suspended-mining views, timing/GPU receipts and the final passed browser receipt. No generated mockups or reference-game assets are shipped.

Unchanged startup budget gates pass at16.7ms median across all three sizes; calls61/60/61, triangles12,224/10,688/12,224, CPU submission1.10/1.09/1.14ms. Full-discovery diagnostic medians33.3/16.7/33.3ms, p95 33.4/33.3/33.4ms; calls75/57/67; triangles87,064/56,792/57,856; CPU submission0.88/0.50/0.59ms. Resident fully discovered terrain/detail instances3862, versus4454 at B, reflecting the requested simpler chunky relief. Same pixel cap, projection, engine pins and frame thresholds; no performance-driven quality downgrade or forced GPU option. CPU submission is not GPU duration.

Historical A and B SwiftShader failures remain valid recorded results, including B's49.9ms fully exposed portrait sample. This run's better result does not establish consistent60FPS, hardware-GPU/mobile performance or Playables certification. User-reported real-PC smoothness is accepted separately from automated software rendering. Physical devices and non-Chromium engines remain unverified.

### Tradeoffs, exact controls and deferred scope

Canonical destination occupancy commits immediately; the sprite eases to it over the lock. Collision/reveal/collection/hazard interactions therefore use the destination before the visual step finishes. Unsupported side exits finish their horizontal step, then fall; lateral air steering and mid-step retargeting are intentionally absent. A paused transition can freeze visually between cells, while authoritative occupancy stays unambiguous. Old fractional-position saves/fixtures require migration; no durable saves are currently shipped. Balanced pacing may need player testing after the faster grid cadence.

Tap A/D or Left/Right for one adjacent cell; hold to repeat at200ms/cell or mine the blocking neighbor. W/Up climbs connected ladders at200ms/cell, never digs. S/Down mines/descends; a fresh press drops through one platform/shaft foothold. Falling steps take100ms/cell. Release retains valid ladder grip and stops future cell attempts. B buys a5-coin platform; E places it. Escape pauses/resumes, R restarts. Mouse/touch use the same four hold buttons, supporting simultaneous pointers and independent release. No new aiming/jump control.

Deferred: major hazards, explosives, supports, Endless expansion, Story progression redesign, cloud saves/SDK and other C–G work. No dependencies added; Phaser3.90.0, Three0.180.0 and pure deterministic TypeScript Core are preserved.

## Milestone B — gold discovery, fog and exploration (2026-10-23; functional criteria verified)

Authority: the user's pasted request, copied to `docs/MILESTONE-B-REQUEST.md`. It explicitly authorizes B despite the prior performance failures, superseding the older no-B instruction below. Pre-code migration design and authored content: `docs/MILESTONE-B.md`. Performance comparison and remaining uncertainty: `docs/PERFORMANCE-B.md`. **B's functional acceptance criteria pass; general performance acceptance remains open. No C–G implementation or YouTube certification is claimed.**

### Delivered behavior and architecture

- New pure `core/discovery.ts` owns visibility: one row-major bit per cell in JSON-serializable unsigned32-bit words (14 words for each432-cell mine). Every occupied body cell seeds a two-step cardinal exploration flood through empty cells. The first solid face is revealed, but propagation stops there. Mining and actual body-cell movement expose new boundaries; discoveries persist within the attempt. Idle reuses the same visibility array. Restart and next-level construction reset it. No camera, renderer, random event, browser API or SDK decides discovery.
- `core/model.ts`, `levels.ts` and `simulation.ts` initialize and update discovery after the existing movement/mining/hazard/ladder sequence. `motion.ts`, `mining.ts`, `ladders.ts`, durability/cadence/regen formulas, economy, input adapters and fixed60Hz authority are preserved. The ladder-mining hotfix remains intact; horizontal excavation adds no rungs. Core state round trips through JSON and continues deterministically; this is not durable storage or an untrusted-save codec.
- New pure `core/deposits.ts` derives small/medium/rich/rare categories from actual finite reward values: ≤10 /11–18 /19–28 /≥29, shown as2/3/5/7 embedded nuggets. Existing stable ore IDs, immediate wallet/quota credit, exact-once collection and gold's extra hit remain. Mined deposits remain empty and cannot regenerate rewards. Complete soil bases, recessed pockets and embedded nuggets remain; hidden ore has no submitted geometry.
- Authored clue cells reference a real deposit ID within2–3 cardinal cells, validated with terrain and bounds. Discovered clue cells show warmer soil and two small embedded flecks while their source remains hidden. No exact-location arrow, magical glow system, animated hint particles or new collectible.
- `TerrainView` now owns terrain, detail and opaque square-cell fog batches per eight-row chunk. Only changed tile/visibility/clue chunks rebuild; unchanged frames return immediately. Details gain chunk-level culling. `ObjectsView` hides undiscovered overlays/objects, and remote hidden boulder impacts emit no particles. The occupied tunnel, mole and immediate collision hazards remain visible. Square32×32 geometry, compensated orthographic projection,20×26 mole, approved clay materials, lighting and rounded rocks remain unchanged.
- All three original opening mines now support discovery choices. First Burrow adds14/22-gold left/right pockets off the shaft with truthful clues and proven ladder returns; the initial10-gold block, free route and paid bridge remain. Amber Hollow adds a36-gold hard-column detour and richer24-gold pocket. Golden Depths adds a28-gold detour and deeper40/32-gold deposits. Available gold81/131/182 exceeds quotas20/45/70. Base-power routes require no purchases. All nine main routes and all new detours at all three claw tiers are verified. Main-route ticks remain1763/1866/2559; Golden Depths' reward intentionally increases110→122. No backpack, cash-out, new enemy/hazard, crafting, SDK or network dependency.
- Help/README explain exploration, embedded clues and richer deposits. Phaser3.90.0, Three0.180.0, dependency pins and development infrastructure remain.

### Actual checks and acceptance evidence

| Check | Result |
| --- | --- |
| Full headless suite | **160 passed,19 files,3.46s** — `node node_modules/vitest/vitest.mjs run` |
| Final strict typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Final lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed**,41 modules,6.35s — `node node_modules/vite/bin/vite.js build`; JS2,025.51kB /483.31kB gzip, CSS7.87kB /2.59kB gzip. Existing large-chunk advisory remains. |
| Focused new exploration/profile run | **4 passed,42.8s**; subsequent combined suite also includes the added full-discovery profile |
| Complete production Chromium suite | **42 passed,6.6m**, exit0; `.last-run.json` passed, no failed tests. Existing frame-time assertions are unchanged. |

Nineteen new deterministic tests cover initial reveal, occlusion/radius, horizontal/downward excavation, history/re-entry, restart, unsigned bit boundaries, JSON continuation, actual hints/validation, finite rich rewards, no repeats, terrain regeneration, climb-only Up, multiple display rates, hidden ore submission, complete square fog, occupied four-cell bodies/immediate boulders, dirty-chunk reuse, all-tier side-pocket returns and valuable detours. Existing24 ladder-hotfix tests and all other Core regressions remain active. Older omniscient geometry tests explicitly reveal their isolated fixtures; unrelated Core hash/geometry assertions remain, with intentional content changes documented rather than silently overwriting historical baselines.

Three new production input tests uncover and collect the actual rich pocket using physical arrow keys, mouse and touch. They verify initial concealment, genuine visible clues, correct embedded-ore reveal, release/grip, no lateral rungs, exactly-once22-gold reward, ladder return, fog persistence, state-preserving resize and restart reset. Existing simultaneous-touch/cancellation tests pass. Campaign completion/upgrades/retries, free/paid routes, all three platform-drop layouts, hazards and walking/three-direction digging animation checks also pass.

Actual390×844 portrait,844×390 landscape and1920×1080 desktop captures were inspected before reveal and during exploration: the mole/current tunnel remain readable; gold stays embedded; clues are visible; grid, surface depth, controls and original style remain. Evidence: `docs/screenshots/milestone-b/` contains7 baseline receipts and27 final artifacts:12 exploration screenshots,3 fully discovered surfaces,3 production surfaces,3 explored-state metrics,3 production budgets,2 profiling JSON files and the final browser receipt. No generated mockups. Physical devices and non-Chromium engines remain unverified.

### Performance — faster opening, unresolved fully exposed workload

Before code changes, unchanged A's three budget tests returned **2 passed /1 failed (26.7s)**: median33.4/33.4/50.0ms for portrait/landscape/desktop. Preserve those receipts alongside the earlier A-hotfix run's **three failures at50/49.9/50ms**. Their variability does not establish a single cause.

B's unchanged production opening gates now pass at16.7ms median across all three sizes, with56/55/56 calls and11,552/10,016/11,552 triangles. This opening has only4 discovered solids,2 nuggets and422 fog cells;478 resident terrain/detail/fog instances before camera culling. Approved visible mesh/material quality and renderer settings are unchanged. Do not equate a newly fogged opening with the former fully visible mine.

The QA-only fully discovered B mine has304 solids,20 nuggets,0 fog and4454 resident instances. Without Phaser/simulation/HUD updates, portrait still measures **49.9ms median /50.1ms p95**,71 calls /96,872 triangles; landscape33.3/33.4ms,57 /62,776; desktop33.3/50ms,63 /63,784. CPU submission1.18/0.79/1.23ms is not GPU duration. That profiling test records measurements; successful execution does **not** pass the fully exposed portrait34ms budget. Thus the earlier performance concern remains explicitly open despite all current startup assertions passing.

Empty-page and sparse-game RAF both measured16.7ms. Idle/full-profile rebuild counters remain4, and isolated changes rebuild only one chunk. Rendering workload contributes to the reproduced slowdown; Phaser, simulation, HUD writes and per-frame terrain rebuilds are not necessary causes. SwiftShader behavior, scheduling/overdraw and resource pressure remain hypotheses, not isolated findings. No threshold, quality, pixel cap, browser GPU option or failing test was weakened. Expanded exploration/reference-device performance needs further work; no global60FPS, resolved-all-performance or complete Playables claim.

### Exact controls and remaining scope

A/D or Left/Right: walk/contact auto-mine; blocked ladder mining preserves grip and Y, actual movement beyond support detaches. W/Up: climb existing ladders only. S/Down: descend or mine downward; a fresh press drops through platforms/shaft-top footholds. Release retains valid ladder grip. B buys a five-coin platform; E places it. Escape pauses/resumes; R restarts. Mouse/touch hold the four direction buttons with simultaneous pointers and independent release. No aiming, jumping or upward digging. Discovery requires no new control.

Remaining: full-exploration/reference-device performance, physical-phone/browser matrix, future save validation/versioning/durable host transport, and milestones C–G. No new C hazards, equipment redesign, Story replay/progress storage, Endless generation or cloud save was added.

## Milestone A hotfix — ladder grip and horizontal mining (2026-10-23)

**The ladder-mining hotfix is implemented and its functional gates pass. Milestone A remains unaccepted because frame-time gates fail. Milestone B has not started.** This section supersedes the older sideways-grip description and test totals below. Pre-code investigation and migration boundary: `docs/HOTFIX-A-LADDER-MINING.md`.

### Core correction and preserved behavior

- `src/core/motion.ts` retains acquired ladder grip while resolving horizontal collisions, then checks ladder support at the actual resolved position. Blocked intent, contact mining and mining animations do not release grip, change Y or apply gravity. A supported sidestep also retains grip. Ordinary fixed-step gravity resumes in the tick actual displacement loses support; no teleport, render workaround or permanent gravity exemption.
- `src/core/mining.ts` selects an actually touching adjacent solid cell when the suspended body spans two rows and its usual center-row target is empty. This closes the head/feet-only contact case without adding upward mining or remote excavation.
- `core/ladders.ts` and `core/simulation.ts` were investigated and preserved. Movement still precedes contact mining, so the breaking tick remains attached; the next held tick can enter the opening. Release causes no automatic sideways movement. The unchanged resolved motion path alone authorizes new downward feet-cell transitions. Horizontal mining, supported sidesteps and entering the tested side tunnels add no rungs or processed cells. Subsequent genuine downward cell transitions still follow Milestone A rules.
- Exact two-hit dirt at every upgrade, gold's extra hit, harder terrain, 24-tick cadence, regeneration, ascent/descent, platform drops, three-direction mining and rewards remain. Nine campaign replays preserve completion ticks and wallet totals. No art, renderer, authored level, grid/collider, engine pin, configuration or dependency change; Phaser remains 3.90.0 and the Core remains independent TypeScript.

### Actual verification

The first 11 dedicated tests failed before the fix, reproducing the bug. Expanded to 24 deterministic hotfix cases in `tests/unit/ladder-mining-hotfix.test.ts`: both directions, first hit/release/cooldown, breaking-tick release, continued displacement, empty-space exits, support loss, unchanged ladder records, gold/hard terrain, regeneration, indestructible walls, four suspended heights, dirt at all three upgrades, head/feet-only contact and interrupted consecutive blocks. One obsolete immediate-intent-detachment assertion in `v3-g.test.ts` now verifies supported movement followed by actual support loss. No skipped tests or relaxed gates.

| Check | Actual result |
| --- | --- |
| Full headless suite | **141 passed, 18 files, 3.76s** |
| Typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed** — `node node_modules/vite/bin/vite.js build`; 39 modules, JS 2,022.39kB /482.06kB gzip, CSS 7.87kB /2.59kB gzip; existing chunk-size advisory |
| Focused production Chromium hotfix tests | **3 passed, 1.8m** — left/right through keyboard, mouse and simultaneous touch |
| Complete production Chromium suite | **34 passed /3 failed, 37 total, 9.0m**; exit 1. All functional cases passed; failures are the three unchanged median-frame assertions described below. |

The three new browser tests drive the authored First Burrow with real production inputs: climb to a suspended position, first strike, release during cooldown, resume to destruction, release while remaining attached, then hold again to leave support and fall. They verify exact Y, grip, input combinations, selective release of one touch pointer, and unchanged ladder/processed-cell records. Desktop 1920×1080, landscape 844×390 and portrait 390×844 captures were visually inspected; square tiles, one-cell mole, visible terrain depth and reachable controls remain. Existing campaign, upgrades, retry, downward auto-mining, ladder return, platform/drop, boulder and walking/three-direction digging animation browser tests pass. Physical phones and non-Chromium engines remain unverified.

### Explicitly open performance gates

The prior **two failures** at portrait and desktop persist. **Landscape also fails in this complete run**; its previous pass does not supersede the current failure. Threshold remains `<34ms`; no resolution, renderer detail, timing assertion or hardware option was changed.

| Viewport | Median frame interval | p95 | Mean CPU render submission | Calls /triangles | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| 390×844 | 50.0ms | 50.1ms | 2.66ms | 63 /105,806 | Failed |
| 844×390 | 49.9ms | 50.1ms | 2.50ms | 60 /95,508 | Failed |
| 1920×1080 | 50.0ms | 50.1ms | 2.65ms | 60 /95,508 | Failed |

Measured environment: Windows10, HeadlessChrome141.0.7390.37, ANGLE Vulkan SwiftShader software rendering. CPU submission is not GPU duration. Renderer geometry/call counts remain unchanged. Preserve these failures for performance investigation; no full Milestone A acceptance or 60FPS/physical-device claim. Evidence in `docs/screenshots/hotfix-a-ladder-mining/`: six suspended left/right captures, three full viewport surfaces, three GPU/budget JSON receipts and `browser-last-run.json` reporting failure. Do not begin B while the A acceptance issue remains unresolved.

### Exact controls

A/D or Left/Right: walk and contact auto-mine; while gripping a ladder, a blocking wall preserves grip and height. Actual displacement beyond ladder support releases grip. Release retains the supported position, including after block destruction. W/Up: climb existing ladders only. S/Down: descend or auto-mine downward; a fresh press drops through a one-way platform/shaft-top foothold. B buys a five-coin platform; E places it. Escape pauses/resumes; R restarts. Mouse/touch hold the four direction buttons; simultaneous pointers and selective release remain supported. Purchase/place, mute and settings remain separate controls. No jumping, aiming or upward excavation.

## Bonanza overhaul — Milestone A (2026-10-23; mechanics implemented, performance acceptance open)

Current authority: `docs/SDD-OVERHAUL.md`, exact copy of the user's latest pasted request (SHA-256 `8477C444D6E3845698EB5532918552A5F928D9691B419E5B77C487AC7C4D5C91`). This supersedes earlier gameplay roadmap exclusions and four-direction excavation. Pre-code design: `docs/MILESTONE-A.md`. Full system disposition, early save-boundary decisions and concrete B acceptance plan: `docs/OVERHAUL-PLAN.md`. B–G are not implemented in this delivery.

### Actual code changes

- `core/mining.ts`: automatic excavation accepts Left, Right and Down. Up is rejected even by the direct digging API; mining-contact type excludes Up. Removed upward excavation/opening state. Existing two-hit dirt, harder strata, exact gold extra hit,24-tick repeat cadence,180-idle-tick regeneration and rewards remain.
- `core/ladders.ts`: removed per-microstep body backfill and all upward extension. Only entering a lower feet row authorizes its newly entered cell; enumerate long resolved segments. `ladderProcessedCells` records each in-bounds candidate once per attempt, even if occupancy prevents a rung. Horizontal exits, same-cell descent, ascent, idle/collision repeats and revisiting processed cells do not create ladders. Existing occupancy exclusions remain.
- `core/model.ts`, `levels.ts`: authoritative processed-cell state replaces `upwardOpening`; restart recreates an empty record. No SDK, storage or browser dependency enters Core.
- `core/motion.ts`: removed upward-opening climb extension. Existing shaft tops provide a one-way foothold for stepping onto the bank; Down bypasses it, and falls already below it continue. Existing platforms directly above a shaft remain climbable connectors without adding occupied rungs. This fixes the browser-discovered return-and-dismount regression caused by removing the old upper backfill.
- Help, Up indicator tooltip and README now describe three-direction mining and climb-only Up. Physical key codes and the existing mouse/multitouch adapter are preserved.

Only five Core files and `index.html` differ from the pre-overhaul active source/config preservation manifest. All presentation/art modules, balance, hazard/economy modules, three authored maps, package pins and lockfile remain byte-identical. The maps were audited rather than changed arbitrarily: all nine base/upgraded campaign routes preserve completion ticks and wallet totals; free and paid completion still pass. Full Story-map redesign belongs to E.

### Test migration and verification

Five new regression tests were run before the fix and all five failed, reproducing upward excavation and ladder backfill. Expanded to12 dedicated A cases, including real motion, landing, diagonal/junction transitions, blocked/repeated cells, upward grip, shaft bank dismount and platform connector returns. Nine obsolete Up-mining/extension assertions were superseded; old tests remain in `archive/overhaul-a/`. Current17-file headless suite has **117 passed (2.12s)**. All nine campaign route states replay deterministically with unchanged old tick/wallet totals; old whole-state hashes are historical because ladder state intentionally changed. Unrelated Core/content hash assertions remain active.

Typecheck and lint passed. Production build passed:39 modules, JS2,021.86kB /481.87kB gzip, CSS7.87kB /2.59kB gzip; existing large-chunk advisory remains. No dependencies added.

First combined browser run exposed actual shaft dismount failure plus obsolete rung-count/platform-return assumptions; fixed and unit-covered the mechanics rather than skipping tests. Focused rerun: **11/13 passed (2.3m)**, including every shaft-return/climb-only input mode and all three platform-drop layouts; two unchanged frame-time assertions failed. A separate profiling run confirmed the same failures and now writes GPU/budget receipts even on failed acceptance.

**Final complete Chromium run:32 passed /2 failed (34 total,7.2m).** Every gameplay/input/campaign/upgrade/retry/platform/ladder/help/animation check passed. Only the existing `<34ms` median-frame gate failed at390×844 and1920×1080;844×390 passed. The suite exits nonzero and `.last-run.json` reports failed; this is not a full browser pass. Final strict typecheck and lint passed after the profiling-test changes. No failing test is skipped, renamed out of discovery or relaxed.

Visually inspected final390×844 portrait,844×390 landscape and1920×1080 desktop platform-return captures plus the actual sideways ladder-exit capture: controls remain separate/reachable, square terrain and one-cell mole remain readable, and no adjacent-column ladder was backfilled. Copies, three current GPU/budget JSON files and the final browser failure receipt are retained in `docs/screenshots/overhaul-a/`. These are real rendered captures; physical phones and other browser engines remain unverified.

### Performance and open acceptance

Current benchmark: Windows10 HeadlessChrome141.0.7390.37, ANGLE Vulkan SwiftShader software rendering. Portrait and desktop median frame interval50ms against the unchanged **<34ms** gate; landscape33.4ms; p95 approximately50.1ms at all three sizes. Mean CPU render submission2.44/2.34/2.53ms is not GPU duration. Calls/triangles unchanged:63/105,806 portrait,60/95,508 landscape/desktop. Three textures, same400k drawing-buffer cap and original geometry. No renderer complexity, resolution, test limit or benchmark hardware setting was changed to force a pass. Earlier33.3ms receipts do not supersede these current failures. Real-phone GPU and60FPS reference-tier performance remain unverified; further performance work belongs to the profiled G plan.

**Milestone A is not fully accepted: two frame-time checks still fail.** Its gameplay changes and functional regressions pass, but do not report an all-green completion. No B gameplay, SDK, cloud save, Story replay, Endless, added hazard, shop overhaul or certification completion is claimed. Do not begin B gameplay while this acceptance issue remains unresolved.

### Exact controls

Physical A/D or Left/Right: walk/auto-dig. S/Down: auto-dig downward or descend an existing ladder; a fresh press intentionally drops through a one-way platform/shaft-top foothold. W/Up: climb existing ladders/connectors only, never excavate or add a rung. Releasing holds acquired ladder grip; sideways movement releases it. B buys a five-coin platform; E places it. Escape pauses/resumes, R restarts. Mouse/touch hold the four direction buttons, with simultaneous pointers; purchase/placement, mute and settings remain separate controls. No jumping or aiming.

## Bonanza analysis and modernization proposal — 2026-10-23 (documentation phase)

Delivered `docs/bonanza-reverse-engineering.md`, `docs/bonanza-mechanics-inventory.md`, `docs/shiny-burrows-gap-analysis.md`, `docs/youtube-playables-requirements.md` and `docs/modernization-roadmap.md`. No active source, level, dependency, visual or gameplay changes. Private analysis/decompiler/emulator artifacts are outside the game at `E:/LightPathfinder/tools/shiny-burrows-bonanza-analysis-20261023/`; none is a game asset.

Supplied JAR identified as CGRBonanza1.0.7 / MIDP2.0 / CLDC1.1. Inspected all67 classes; independently validated50 packs /3,413 entries,41 referenced parameter records and their type-1 map dimensions/lengths. CFR has documented reconstruction limitations; static findings, packaged text, inference and unknown behavior are labeled separately. Three bounded MicroEmulator startup attempts did not yield an interactive playthrough; Nokia API/classloading failures and an observation-free system-classloader attempt are documented. No empirical original-game timing, full behavioral reconstruction or emulator acceptance is claimed.

Fresh checks: **114/114 tests passed in16 files (5.07s)**; typecheck and lint passed. Build and35 Chromium passes remain the existing v0.6.1 receipts below, not rerun for this documentation-only phase. Current dist inspected at six files /2,036,902 bytes. Source/config SHA preservation manifest retained with analysis artifacts.

Roadmap preserves current Core/engines/grid/controls/style and proposes small gated steps: versioned save codec, host lifecycle/cloud transport, an original buried-rock route, then approval-dependent discovery/replay and measured pacing/performance. Key gaps: no persistent saves or YouTube SDK; pause does not stop rendering/audio; host-incompatible visibility/Escape help paths; no campaign boulders/enclosure validator; ~30FPS baseline and no physical-phone/host certification. Official Playables audience is general13+, not specifically made for kids; friendly art remains compatible with general-audience positioning. No modernization implementation or YouTube release completion is claimed.

## v0.6.1 — Reference2 geometry and visual corrections (2026-10-23; locally verified)

Source: user's Visual Corrections v0.6.1 and root `StyleReference2.png` (SHA-256 `826A49927D200060DD61B99A480DC5A7B6C0671A020CBD7A39E1F1B74C988746`). Pre-code plan: `docs/MIGRATION-v0.6.1.md`; feature comparison/limitations: `docs/VISUAL_REVIEW-v0.6.1.md`.

### Implemented corrections and architecture

1. **Exact square cells:** all four terrain and four gold-bearing variants retain exact **32×32** XY bounds. Orthographic elevation remains 20°, with Y compensation preserving equal projected cell axes. Shared depth increases from **16 to 22px**; backing, cavity shadows and visual foot grounding follow that depth. No collision coordinates change.
2. **One-cell mole:** visible helmet, nose, whiskers, paws and all normal poses remain within the existing stricter **20×26px** envelope, inside the 32px cell. Warm fur, contrasting belly and blue irises improve expression without enlarging the model. Existing six-frame-per-direction walking and four articulated claw sequences remain.
3. **Gold in earth:** complete opaque soil base/sides/back, a continuous **2.6px shallow front bowl**, warm darker soil and five partially embedded faceted nuggets per deposit. Removed the black rectangular inset and rim meshes. Gold-bearing cells render as earth even when Core hardness comes from a deeper stratum. Core extra-hit, value and hardness rules remain unchanged. The nugget instance expectation changes from 18 to 30 for six deposits; this is visual density, not extra loot.
4. **Focused environment:** removed sky, hills and structural beams; one dark warm backing remains. No plants, hanging lanterns, decorative crystals or new collectible types. Functional exit is a small painted direction marker. Legacy bonus overlays use gold visuals rather than crystal decoration. Ladders have wider grid-contained rails/rungs and small fasteners; platforms retain exact one-cell support alignment.
5. **Round boulders:** original irregular near-spherical shared faceted mesh, separate from square lavender stone terrain. Bounded warning wobble, falling rotation/stretch and event-driven landing compression/dust; every pose remains inside the unchanged square rock collider. Visual impact history resets on restart. Reduced motion suppresses the extra motion. No hazard rules changed.
6. **Reference presentation:** sculpted clay/clod relief, warmer highlights, orange helmet, lavender stone and copper/red rounded UI. Desktop frame up to 1600×900 with whole-grid 4× minimum zoom; portrait 1.85× and landscape 2.3× retained. Relative character/tile sizes remain unchanged. No fake energy, XP, backpack mechanic or nonfunctional purchase icon.

Initial desktop testing failed the unchanged <34ms median-frame gate at about 50ms. Reduced extra clay fragments to four per tile and drawing-buffer cap to **400,000 pixels** (DPR ceiling still 1.5). Geometry/material reuse, instancing, chunk culling, single context and 48-particle cap remain. Focused viewport, regeneration/resource-reuse, reduced-motion and boulder checks then passed **6/6 (32.0s)**. No test timing/triangle/draw limits were relaxed.

### Verification receipts

| Check | Actual result |
| --- | --- |
| Full headless tests | **114 passed**, 16 files, final **1.58s**. Four new tests cover complete square soil/ore geometry, a real shallow recess, nugget/earth intersection, round bounded boulder poses and impact reset without state mutation. Expanded the existing mole bounds regression to both facings and landing: 11 poses × 100 ticks × two facings within 20×26. |
| Core/content preservation | All source SHA-256 values and nine full-state replay signatures unchanged. Base routes remain 29.4s / 31.1s / 42.6s. No Core or authored-level edits. |
| Typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed** — 39 modules; JS **2,022.16 kB / 482.00 kB gzip**, CSS **7.87 kB / 2.59 kB gzip**. Existing large-chunk advisory remains. Phaser **3.90.0**, Three **0.180.0** and dependency infrastructure preserved; no dependencies added. |
| Full Chromium | **35 passed (6.2m)** in the combined run; `.last-run.json` reports passed with no failed tests. Includes all prior campaign/input/platform/visual regressions, plus Core-driven boulder warning/fall/impact/rest. |

Final rendering receipts (119 warmed RAF intervals; submission is CPU time, not GPU time):

| Viewport | Calls | Triangles | Mean submission | Median / p95 interval | Exposed top depth |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 63 | 105,806 | 1.61ms | 33.3 / 50.0ms | 13.92px |
| 844×390 | 60 | 95,508 | 1.46ms | 33.3 / 33.4ms | 17.31px |
| 1920×1080 | 60 | 95,508 | 1.60ms | 33.3 / 50.0ms | 30.10px |

Three shared textures; measured DPR 1 / 1 / 0.6005 under the 400k buffer cap. Eight restarts preserve GPU geometry/texture counts. No general 60fps or physical-device performance claim.

**Acceptance review:** all eight local requirements have geometry/state test and screenshot evidence. Inspected all three viewport surfaces, four boulder poses and all six temporal walk/dig sheets against Reference2. Square terrain/tunnels, one-cell mole, opaque earth around embedded gold, removal of extraneous props, rounded distinct boulders, visible top faces/grounding, expressive articulated animation and unchanged gameplay were verified. **86 evidence files** in `docs/screenshots/v0.6.1/`, including 52 temporal PNGs, six pose receipts, six contact sheets, full contexts/layouts, four boulder captures and three budget JSON files. These are actual renderer screenshots, not generated mockups.

**Boulder coverage:** all three existing campaign definitions have zero boulders. Do not infer campaign hazard coverage from screenshots. The isolated QA scene uses production rendering and real Core `stepGame` release/fall/impact rules, with a round boulder beside square stone. Four actual screenshots cover warning/falling/impact/rest. It is bundled in memory by the test runner and is not shipped in dist; no game debug/state-injection API was added.

### Controls and remaining limits

Controls are unchanged: physical **A/D or Left/Right** walk/auto-dig; **W/Up** mines a reachable ceiling while standing or climbing and climbs a grabbed ladder; **S/Down** digs/descends, with a fresh press dropping through a one-way platform. Release holds acquired ladder grip. **B** buys a five-coin platform; **E** places it. **Escape** pauses/resumes, **R** restarts. Mouse/touch hold the four direction buttons, with simultaneous pointers supported. **♪** mutes/unmutes, **⚙** opens paused help/settings. No jumping, separate aiming or separate Dig input.

Original procedural low-poly art follows Reference2's features; it is not a pixel-for-pixel copy of the illustration. The mine layouts remain unchanged. Physical phone GPUs and non-Chromium engines remain unverified; emulated portrait/landscape checks cannot certify them. All mandatory local geometric/gameplay acceptance checks and capture reviews above are complete.

## v0.5 — Concept-directed visual pass (2026-10-23; implemented and locally verified)

Authoritative written request: `docs/SDD-v0.5.md`, copied from the pasted attachment. Pre-code plan: `docs/MIGRATION-v0.5.md`. The user subsequently identified **`StyleReference.png` in the project root**, SHA-256 `B9DC81902630CE51071936F531575559FCE6A7AC40A08945FA70319140E34531`. Inspected it and refined the terrain grain/rocks, gold glow, helmeted directional mole, zoom and dark depth pill against it. Reference pixels are not used as runtime assets. Screenshots and passing tests alone are not treated as concept approval.

### Implemented stages

- **A — Terrain:** four reusable sculpted block masses, coordinate/material seeded color and geometry variation, multiple embedded faceted stones/clods, shallow pits and natural fissures per tile. Two shared 96×96 procedural clay color/normal textures add fine grain; rocky strata include larger central fragments. Terracotta soil, compressed red earth and purple/gray rock palettes. Separate authoritative damage branches deepen with integrity and disappear on actual regeneration. Shared instanced geometry, no per-tile object trees.
- **B — Camera/depth:** 20° orthographic elevation, compensated world Y by `1/cos(20°)` so frontal logical cells project as equal 32px X/Y squares. Blocks extend 16px backward from the logical front plane; visible exposed top depth is `16*sin(20°)` world pixels. A presentation-only character shear/grounding offset aligns feet with the top face; no collider movement or gameplay Z. Projection and one-cell geometry checks pass.
- **C — Character:** larger expressive head/eyes, plump body, original orange helmet/lamp, directional head/body yaw, articulated shoulders/arms and hips/feet, alternating walking legs with opposing arms, body bob/rotation and head motion. Event-clocked directional claw sequences include impact, recoil, return and anticipation of the next hit. The final impact completes after a block breaks rather than being cut off immediately. Climb/fall/landing/collection/idle poses retained; no pickaxe. Every sampled pose stays within the existing collider-sized visual envelope. Cosmetic helmet adds no equipment mechanic.
- **D — Resources/light:** large faceted bright gold in dark inset squares with warm rims, emissive highlights and a shared 32×32 radial halo, dark warm cavity backing and edge contact shading. Dirt/chips originate at the nearest claw/block contact edge rather than the block center; capped particle batch and collection sparkle retained. Hemisphere/key/fill lighting; no bloom or per-tile lights.
- **E — UI:** burgundy/brown beveled panels, large original nugget icon/wallet, central depth, claw icon/tier, truthful level gold progress bar, icon pause/restart/mute/settings controls and tactile directional/equipment buttons. Settings/help pauses the game and clears held input; Escape/Back resumes only if it was playing. No fabricated energy/XP. All original keyboard/pointer action names remain compatible.
- **F — QA verified:** baseline 106 headless tests passed before changes; final **110 headless tests passed**, 15 files, with exact Core/content/replay preservation. Typecheck/lint/build pass. Final combined production browser run **34 passed (5.9m)**, including six rendered samples in each walking direction and ten clock-stepped rendered frames per dig direction. Browser clock controls RAF/time for capture only; no Core state injection. All six final temporal sheets and the three viewport layouts were visually reviewed against the supplied reference. **82 evidence files** are retained in `docs/screenshots/v0.5/`.

### Integration fixes and performance decisions

Early QA exposed desktop rendering cost and missed short-lived screenshots. Simplified PBR shading to controlled shared Phong highlights, disabled multisample antialiasing and capped drawing-buffer area at 500,000 pixels while preserving CSS/grid aspect and the 1.5 DPR ceiling. UI progress/disabled properties only update when their values change. Existing frame-time gate remains in place; it was not relaxed to accept slow rendering. The triangle budget was raised from 100k to 150k for the explicitly requested detail increase; instancing/chunks/single context remain.

Phaser's default smoothed delta could slow the 60Hz simulation clock during costly rendered frames (the real-browser regeneration check failed). Set `fps.smoothStep=false` at the application boundary so actual elapsed time reaches the unchanged fixed-step accumulator and its existing five-step catch-up cap. This is a proven visual integration timing fix; every Core/content byte and all nine deterministic replay hashes remain unchanged. Focused desktop performance and real-time regeneration/restart checks subsequently passed.

Final contact-sheet inspection prompted a stronger vertical preparation arc: hands visibly retract toward the face/chest before reaching upward or downward. Full runs then exposed QA-only clock handoff failures (a past pause timestamp, and frozen frame callbacks). The capture harness now pauses the browser clock **before Phaser boots**, then advances time throughout the route using actual input. No Core state injection, application-code workaround or weakened assertions. All six focused visual cases passed (1.1m), followed by the complete **34/34** combined suite (5.9m).

All specified local acceptance gates VA-01 through VA-10 have test/capture/review evidence below. Physical-device mobile performance and other browser engines remain unverified. The procedural low-poly renderer follows the concept's features rather than reproducing its illustration pixel for pixel; existing maps are preserved. No dependency, energy model, gameplay/economy/level changes or functional equipment were added. Original procedural models/icons/textures stay local; no remote assets or image generation. Camera zoom is presentation-only (portrait 1.85, landscape 2.3 minimum, desktop 3 minimum, increased when necessary to fill the viewport).

### Final verification receipts

| Check | Actual result |
| --- | --- |
| Full headless suite | **110 passed**, 15 files, 1.54s. Includes coordinate/material seeds, deterministic clay regeneration, articulated gait/strike poses, square elevated projection and all earlier gameplay regressions. |
| Typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed** — 39 modules; JS **2,019.89 kB / 481.20 kB gzip**, CSS **6.81 kB / 2.29 kB gzip**. Existing large-chunk advisory remains; dependency license notices verified in dist. |
| Full production Chromium | **34 passed (5.9m)** in the final combined run; `test-results/.last-run.json` reports passed with no failed tests. Includes all prior regressions and six v0.5 visual/help cases. |
| Gameplay preservation | Every Core/content source hash and all nine exact replay signatures match the pre-visual baseline. No gameplay code was changed. |

The v0.5 request explicitly preserves the current economy and terrain hit rules and forbids fake energy/XP; older v0.4 discrepancies below are historical, not new unfinished v0.5 systems. Detailed concept comparison and capture inventory: `docs/VISUAL_REVIEW-v0.5.md`.

Final production measurements (119 warmed RAF intervals; CPU render submission is not GPU time):

| Viewport | Draw calls | Triangles | Mean CPU submission | Median / p95 frame interval | Exposed top depth |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 72 | 83,228 | 1.36ms | 33.3 / 33.4ms | 10.12px |
| 844×390 | 68 | 72,584 | 1.30ms | 33.3 / 33.4ms | 12.59px |
| 1920×1080 | 73 | 83,396 | 1.64ms | 33.3 / 50.0ms | 16.42px |

All three viewports use three shared uploaded textures; restart tests check stable geometry/texture counts. Idle mole bounds are approximately **19.06×25.4** world pixels; every tested pose remains within **20×26**, below the one-cell limit. Particles remain capped at 48. Measured DPR is 1 on portrait/landscape and 0.758 on desktop under the 500k drawing-buffer pixel cap. The existing median-frame gate remains <34ms; there is no claim of 60fps on every device.

### Acceptance evidence

| Gate | Evidence |
| --- | --- |
| VA-01 detailed terrain | Adjacent cells show different grain, stones, pits and fissures at normal zoom; all three surface/shaft captures visually inspected. Seed and texture recreation tests pass. |
| VA-02 walking surfaces | Exposed top faces visible; grounded feet/contact shadows inspected in surface and walk contexts. No Core coordinate offset. |
| VA-03 square grid | Equal X/Y projected footprints verified mathematically and in all three browser viewport tests. |
| VA-04 walking | Six distinct rendered temporal frames in each direction, pose/tick receipts and contact sheets; alternating feet/opposing arms/body and head motion visually inspected. |
| VA-05 digging | Ten actual frames in each cardinal direction cover impact, recoil, return, preparation and next hit. Vertical preparation strengthened after inspection; no pickaxe. |
| VA-06 interface | Rounded burgundy/brown wallet/depth/claw/status panels and tactile controls inspected at all sizes. Actual wallet/goal/tier only; visible buttons meet 44px minimum. |
| VA-07 gold | Enlarged faceted nuggets, dark recess and controlled warm illumination inspected in surface and dig contexts. |
| VA-08 dimensions | All animation poses sampled over 100 ticks within 20×26 world pixels; browser bounds agree, inside one 32px cell. |
| VA-09 regressions | **110 headless tests and 34 combined browser tests passed**; exact Core/content hashes and nine replay signatures match. |
| VA-10 comparison | Supplied `StyleReference.png` inspected against 390×844, 844×390 and 1920×1080 screenshots, exposed soil, walking, four dig axes, damaged blocks, ladder shafts and gold. Detailed feature-by-feature comparison in `docs/VISUAL_REVIEW-v0.5.md`. |

### Exact controls (v0.5)

Hold physical **A/D or Left/Right** to walk/auto-dig; **W/Up** auto-mines a reachable ceiling while standing or climbing and climbs a grabbed ladder; **S/Down** digs/descends, with a fresh press dropping through a one-way platform. Releasing holds an acquired ladder grip. Mining Up alone does not move upward. **B** buys one platform for five coins; **E** places one at the facing bank. **Escape** pauses/resumes, **R** restarts. Mouse/touch hold the four direction buttons (simultaneous pointers supported); Buy/Platform are separate actions. **♪** toggles synthesized sound. **⚙** opens paused settings/help; Back/Escape returns to the previous play/pause state. No jump, separate aiming or separate Dig input. Keyboard actions use physical codes across layouts.

## v0.4 — 2.5D visual migration (2026-10-23, implemented and locally verified; acceptance gaps remain)

Source: `docs/SDD-v0.4.md`, copied verbatim from the user attachment (SHA-256 `3E6443B96EC08C61977BDFF2B449BBB8E750C4C606FC8DA5939995D5B625BD0E`). Pre-code decisions and phase gates: `docs/MIGRATION-v0.4.md`.

### Completed phase work and gates

1. **Baseline/preservation:** 96 existing Core tests and 23 existing Chromium tests passed (4.4m). Typecheck/lint/build passed. Core/content file hashes and nine full-level replay signatures captured before changing presentation. New tests verify exact preservation; baseline route durations remain 29.4s/31.1s/42.6s at base power.
2. **Terrain:** Three.js r180 orthographic camera, centralized `(x,y) → (x,-y,z)` conversion, equal-axis projection and shared shallow rounded square block geometry. Instanced terrain is partitioned into eight-row chunks for frustum culling. Soil/compacted/stone/hard-rock palettes, embedded nugget clusters, within-cell cracks and square logical holes. Geometry, spacing, projection and damage/heal synchronization tests pass.
3. **Character/objects:** Original volumetric toy mole with pink nose, paired expressive eyes, ears, whiskers, short legs and large cream claws; no pickaxe model. All animation poses tested within the 20×26px collider envelope (one 32px cell maximum). Rounded wooden ladder rails/rungs, one-cell platforms, gold, gems, boulders and green exit. Existing logical positions and smooth interpolation preserved.
4. **Animation/effects:** Idle/walk/climb/fall, four claw-dig directions, collection and upgrade poses; 48-particle maximum with cell-local dirt/chips and gold sparkle. Ambient/front-top lighting, bevel/contact shading, mole contact shadow; no postprocessing/shadow maps. Reduced-motion support and paused particles. User-gesture-unlocked original synthesized hit/break/collection/upgrade sounds plus mute control.
5. **Integration gate:** final **106/106 headless tests pass**, 14 files (2.07s); Core/content remain byte-identical and all nine replay state hashes match. Initial integration browser run: 12/12 passed (1.2m); final combined production run **28/28 passed (4.8m)**. This includes keyboard/mouse/touch fall-and-return, standing upward digging, full campaign/upgrades, paid platforms, three layout/geometry/performance checks, visual healing, eight-restart GPU stability and reduced motion.
6. **Optimization/QA:** Shared geometry/materials, instanced terrain/nuggets/ladders/platforms/rocks, chunk culling, device pixel ratio capped at 1.5, pooled particles, single renderer/canvas, no second simulation. Screenshots inspected at portrait 390×844, landscape 844×390 and desktop 1920×1080, plus Amber Hollow/Golden Depths. Final receipts below.

### Final verification and measured rendering

| Check | Actual result |
| --- | --- |
| Full Vitest | **106 passed**, 14 files; final 2.07s. Includes every pre-existing regression plus ten v0.4 geometry/preservation/effects tests. |
| Typecheck | **Passed** — `node node_modules/typescript/bin/tsc --noEmit` |
| Lint | **Passed** — `node node_modules/eslint/bin/eslint.js src tests` |
| Production build | **Passed** — 38 modules; JS **2,008.87 kB / 476.92 kB gzip**, CSS **3.35 kB / 1.32 kB gzip**. Existing large-chunk advisory remains; no external assets. Three MIT notice verified in dist/licenses. |
| Full production Chromium | **28 passed (4.8m)**; zero page/console errors and non-local requests in instrumented acceptance tests. |
| Simulation preservation | Every Core/content source SHA-256 unchanged; all nine full-state replay SHA-256 values identical to the pre-migration baseline. |
| GPU restart stability | Eight repeated restarts preserve geometry/texture counts and clear particles; no new renderer/context per restart. |

Local frame timings use 119 requestAnimationFrame intervals after warmup; CPU render submission timing is measured separately and is not GPU frame time. Physical-device performance is not inferred from these results.

| Viewport | Draw calls | Triangles | Mean CPU render submission | Median frame interval | p95 frame interval |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390×844 portrait | 49 | 43,860 | 0.60ms | 16.7ms | 16.8ms |
| 844×390 landscape | 47 | 33,204 | 0.58ms | 16.7ms | 16.8ms |
| 1920×1080 desktop | 49 | 44,016 | 0.87ms | 33.3ms | 33.4ms |

Measured idle mole bounds are **18.09×23.4 world pixels** inside the **20×26** collider envelope; all tested poses stay within that envelope. Terrain projection is equally scaled in X/Y. Rendered surface samples used four uploaded shared geometries and zero textures. Screenshots and raw JSON receipts: `docs/screenshots/v0.4/` (surface, fall/ladder and claw-impact views). No 60fps-on-all-devices claim is made.

### Architecture

Phaser **3.90.0** remains HEADLESS for lifecycle and game-loop timing. `WorldRenderer` consumes readonly state/events/interpolation; `ThreeWorld` owns the visible WebGL2 canvas and resources. DOM `BrowserInput` remains unchanged; `Hud` and `GameAudio` are separate presentation services. Core imports of Three.js are prohibited by lint. Old Phaser world renderer/texture drawings are archived in `archive/v0.4-migration`; they are outside the application build. Added runtime **three 0.180.0**, development **@types/three 0.180.0** and **@types/node 24.0.0** (hash verification tests); existing tool/library versions retained. No external runtime assets or services.

### Specification discrepancies / unverified criteria

- **Energy:** current v0.3 Core has no energy model. Preserved that fact; no fabricated meter/costs/upgrades. The energy wording in AC-15 is not fulfilled, since adding a system conflicts with this migration's mechanics-preservation constraint.
- **Hard terrain:** existing upgraded hard terrain can take two hits (`max(2, ceil(base/power))`), with gold requiring exactly one more. Preserved rather than rebalance it to AC-07's possible three-hit minimum at every upgrade. Standard ordinary soil remains exactly two hits at every upgrade.
- **Device coverage:** Chromium desktop with emulated touch/portrait/landscape can measure local rendering/input performance, not certify physical phone GPUs, other browser engines or YouTube Playables integration. These remain unverified. No SDK/hosting integration or persistent save system was added.

Controls remain physical A/D or Left/Right to walk/auto-dig; W/Up auto-digs a reachable overhead tile, also climbing when on a ladder; S/Down descends/digs and fresh presses drop through one-way platforms; release holds an acquired ladder grip. B buys/E places a 5-coin one-tile platform; Escape pauses/R restarts. Pointer buttons support continuous four-direction holds and simultaneous touches. New ♪ button mutes/unmutes synthesized feedback. Surface upgrades are labeled **Claw power**; internal versioned pickaxe field names and upgrade behavior are unchanged.

### Acceptance accounting

| v0.4 criteria | Evidence / status |
| --- | --- |
| AC-01 square grid, AC-03 frontal volume, AC-16 visual consistency | Shared bounded rounded geometry; orthographic projection tests; screenshot inspection at all three viewport sizes. No perspective/rotation or gameplay Z. |
| AC-02 one-cell mole | Every pose sampled across 100 ticks, full visible model stays within 20×26px; browser bounds and screenshots confirm scale. Smooth movement is preserved, so the bounded silhouette may cross a cell boundary during traversal. |
| AC-04/05 automatic cardinal digging | Existing Core direction/cadence/reach tests; existing keyboard, mouse and touch browser scenarios. Standing Up works without climbing. |
| AC-06 ordinary soil two hits | Preserved exact two-hit minimum and gold's separate +1 rule at all upgrade tiers, all directions. |
| AC-07 hard terrain | Existing configurable base counts 3/3/5 retained; upgraded counts can be two. This discrepancy remains unresolved without a separate mechanics change. |
| AC-08 healing | Core exact 180-tick checks plus renderer crack instance/heal tests and real browser 3-second regeneration. |
| AC-09/10 auto ladders, AC-12 no jump | Core regressions and real browser multi-cell fall/downward dig/upward return; no new Core mechanics or jump input. |
| AC-11 ladder / platform geometry | Instanced rails/rungs bounded to cell; platform's visible top exactly matches logical support Y. Existing drop-through rules preserved. |
| AC-13/14 layout-independent keyboard and touch | Existing physical-code, repeat/cancel, simultaneous-pointer and continuous-direction browser tests retained. |
| AC-15 economy | Rewards/prices, campaign upgrades, retry semantics and complete level replay hashes preserved; energy portion cannot be fulfilled because no current energy model exists. |
| AC-17 performance | Local Chromium render/frame timing, draw/triangle budget, bounded particle/GPU resource tests; physical mobile and other engines unverified. |
| AC-18 regression safety | Core/content SHA-256 checks, nine exact replay hashes, 106 headless and 28 Chromium tests passed. |

The visual implementation is not a claim that every Definition of Done item is signed off: energy and the interpretation of harder upgraded blocks require scope clarification, and physical target-device performance still requires testing.

## Upward mining without climbing (2026-10-21)

Latest clarification supersedes the ladder requirement for upward mining in earlier entries. Holding W/Up or ↑ automatically strikes a ceiling within 8px of the head while standing, hanging or falling; no ladder or climbing state is required. This reaches across the 6px gap in a standard 32px tunnel with a 26px player collider. Up pointer input is enabled throughout play. Ladder climbing remains the only input-driven ascent; overhead mining alone creates neither upward motion nor free ladder segments. Connected ladder excavation retains its existing traversal allowance. Stationary idle ladder grip remains intact.

Core regressions cover standing cadence, release, exact gold payout, absence of ascent/free ladders, airborne reach and out-of-range rejection. New browser cases use actual authored terrain and physical keyboard/mouse/touch to excavate overhead while grounded away from every ladder, checking unchanged position and ladder state. Documentation and pre-code decision amendment updated; no dependencies or assets added.

Validation: **96/96 Core tests passed**, typecheck and lint passed, production build passed (26 modules; JS 1,521.41 kB / 353.45 kB gzip; existing Phaser chunk-size advisory). **23/23 Chromium browser tests passed (4.5m)**, including the three new grounded upward-mining scenarios and retained ladder/campaign/platform/layout coverage. No page/console errors or non-local requests were reported. Verified emulated portrait 390×844, landscape 844×390 and desktop 1920×1080. Physical mobile devices and other browser engines remain unverified.

Exact control clarification: W/Up or ↑ always means auto-dig overhead within reach; it also climbs when overlapping a ladder. All other controls in the preceding correction remain unchanged.

## Ladder grip and automatic Up correction (2026-10-21)

Latest user correction supersedes the historical idle-falling behavior below. Migration decision recorded before changes in `docs/DECISIONS-V3-G.md`.

- Holding W/Up or the ↑ pointer button automatically climbs and repeatedly mines a reachable ceiling, without a separate digging action. Existing head-contact, ladder reach and multi-hit rules remain in Core.
- Up/Down acquire a ladder grip. Releasing directions holds the exact X/Y position with zero velocity and stops mining; partial terrain still regenerates normally. Idle grip uses the idle animation. Horizontal movement, loss of ladder contact and intentional platform drops detach. Natural falls through newly generated ladders continue until Up/Down grabs one.
- Pure TypeScript Core remains authoritative; Phaser 3.90.0 and dependencies unchanged. No new gameplay systems or assets.
- Core regressions cover automatic upward mining/resumption, idle position after both climbing directions, off-center grip, detachment/gravity and platform drop precedence. Browser fall/return tests now check a stationary mid-shaft release using touch portrait (390×844), mouse landscape (844×390) and keyboard desktop (1920×1080).
- Verification: **94/94 Core tests**, typecheck, lint and production build passed. **20/20 Chromium browser tests passed (4.2m)**, including automatic upward excavation, stationary ladder grip with keyboard/mouse/touch, portrait/landscape layouts, all three levels, upgrades and paid platforms. Browser checks reported no page/console errors or non-local requests. Build: 26 modules, JS 1,521.44 kB / 353.44 kB gzip; existing Phaser chunk-size advisory remains. Browser coverage is Chromium with emulated mobile viewports/touch; physical devices and other browser engines remain unverified.

Controls: A/D or Left/Right walk and auto-dig; W/Up climbs and auto-digs overhead; S/Down descends and auto-digs below; release holds a grabbed ladder. Fresh S/Down drops through a platform. B buys, E places, Escape pauses, R restarts. Mouse/touch use the corresponding four direction, Buy, Platform, Pause and Restart buttons.

## V3-G — Four-direction auto-digging and traversal ladders (2026-10-21)

Current request: [docs/SDD-V3-G.md](docs/SDD-V3-G.md). Pre-code implementation order, conflicts and subsequent verified mechanics decisions: [docs/DECISIONS-V3-G.md](docs/DECISIONS-V3-G.md). V3-G supersedes V3-F's manual downward action, no upward mining and restricted natural-shaft ladders. Earlier results below are historical.

### Delivered mechanics / architecture

- **Four directions, one mining resolver.** A/D/Left/Right walk or mine on actual facing contact; S/Down excavates the supported floor; W/Up climbs and mines only at head contact from a valid ladder. Horizontal input wins simultaneous-axis input, so lateral movement cannot accidentally mine the floor. No Dig intent, Dig button, J/X/Space mining bindings or manual ladder mode remain.
- **Core-only actual-motion ladders.** Collision solver records X/Y microstep positions; only actual vertical displacement authorizes segments. Descending creates a free, deduplicated ladder in each traversed empty body cell of the center column, including the return anchor. Natural falls, already-empty shafts and platform drops now work without a prior dig/active-shaft flag. Rows crossed are enumerated, not inferred only from final coordinates. Pure horizontal walking creates none. Terrain, rocks, uncollected treasure and platforms are never overwritten; ladders remain non-solid.
- **Upward excavation and proper ladder tops.** Reachable ceiling damage uses the same resolver/cadence. A removed ceiling grants a one-cell upward opening; its rung appears only after connected traversal enters that opening. Existing connected anchor cells may fill during actual upward traversal up to the authorized ceiling. Climbing permits feet to reach the highest rung's top, fixing the legacy 26px head-at-rung restriction and enabling a step onto the upper bank. No free extension into untouched space above the highest authorized anchor.
- **Anti-flight / anti-ratchet protection.** Releasing Up or stepping sideways at a ladder top cannot create successively higher free rungs. Natural descent anchors are bounded by the initial body anchor / highest already-authorized rung; only physically reachable upward excavation can extend that bound. Tests repeat climb/release and sideways cycles. Downward floor excavation gently centers an off-center mole with ordinary collision-safe microsteps; this is disabled on platform cells/drop initiation so solid-bank boundaries still behave correctly.
- **Two-hit protection and exact gold bonus.** Soil remains 2 hits; compacted/gravel/fragile base 3, hard base 5. Ordinary required hits = max(2, ceil(baseIntegrity/power)); a gold block always takes **one more hit** at every power tier. First gold hit removes a one-hit outer layer; underlying terrain retains its protected first hit. All four directions share 24-tick/400ms cadence, cancellation and 180-idle-tick regeneration; healing restores both gold and terrain layers. Reward IDs/values and once-only payouts are unchanged.
- **Platforms preserved.** Same 5-coin purchase, one-item inventory and nearby placement validation. One-way tops support from above only. Fresh Down initiates drop and ignored-top suppression takes precedence over ladders until the entire collider clears. No rungs are placed inside platform cells; a platform cell between adjacent real ladder segments acts as a traversable climbing connection after suppression ends. Idle gravity remains active. Holding Down can use the existing controlled ladder descent speed (72px/s); release returns to ordinary falling.
- Deterministic order: purchase/placement edges and healing, collision-resolved movement, at most one directional contact strike, rocks, collection, movement-trace ladder generation, tick increment. Pause freezes simulation/mining/falling/generation and clears holds/contact. Restart restores the entry wallet/power, terrain and empty ladder/opening state. In-memory campaign, upgrades, economy and authored levels remain intact.
- Physical KeyboardEvent.code bindings retained; mouse/touch use only the four direction buttons, Buy and Platform. Simultaneous pointers, cancellation, focus loss and repeat suppression remain covered. Existing tile/mole/background drawings and CSS/HUD styling are unchanged; help and README updated. Phaser **3.90.0**, strict TypeScript, Vite and existing test tools retained; no dependencies added.

### Exact controls

| Action | Physical keyboard | Pointer controls |
| --- | --- | --- |
| Walk or dig left/right | A/D or Left/Right held | Hold ◀ / ▶ |
| Descend or dig floor | S or Down held | Hold ↓ |
| Climb or dig reachable ceiling | W or Up held; requires a ladder | Hold ↑ |
| Stop/cancel current strike | Release / reverse direction | Release / cancel pointer |
| Drop through one-way platform | Fresh S/Down press | Press ↓; release/repress for stacked platforms |
| Buy / place platform | B / E | Buy / Platform |
| Pause / restart | Escape / R | Pause / Restart |

No separate mining key/button. Ladder creation is free and follows actual movement. A brief direction press cannot destroy intact soil; gold always needs an extra hit. See README.md for local preview instructions using the workstation's existing bundled Node runtime, without installing Node.

### Verification

| Check | Actual result |
| --- | --- |
| Full Vitest suite | **91 passed**, 9 files; final run 1.56s; 23 new V3-G cases plus retained/adapted regressions |
| Typecheck | **Passed**, node node_modules/typescript/bin/tsc --noEmit |
| Lint | **Passed**, node node_modules/eslint/bin/eslint.js src tests |
| Production build | **Passed**, 26 modules; JS 1,521.39kB / 353.42kB gzip; CSS 3.17kB. Existing Phaser chunk-size advisory only |
| Full Playwright production suite | **20 passed (4.1m)** final combined production run; zero page/console errors and non-local requests |
| Required 390×844 / 844×390 / 1920×1080 | **Passed / visually inspected**: real touch/mouse/keyboard multi-cell falls, continuous ladders, return and step onto the starting bank; >=44px controls, no Dig button or layout overlap |

Headless coverage includes all directions and upgrade tiers, exact gold +1 hits, cancellation/healing, actual traversal bounds and skipped structures, multi-row falls, platform drops/return, reachable upward extensions, inability to fly/mine remotely, repeated climb/release protection, off-center shafts, pause/reset and 30/60/120Hz grouping. Retained rock, fragile, platform, economy, retry and three-level route tests pass. New base-power direct routes: **1763 / 1866 / 2559 ticks = 29.4 / 31.1 / 42.6s**.

Browser tests use real input with read-only datasets, including non-English character / physical-code mismatches and controlled slow render callback delivery. A new scenario at each required viewport falls through a previously empty shaft, verifies every rung and climbs/steps back onto the starting bank without Restart. Another real route excavates upward from the lower chamber to the upper bank. The suite rejects all page/console errors and non-local requests. GPU-heavy runs are serialized on this workstation; timing polls explicitly allow the controlled slow-render case. Superseded tests were preserved in archive/v3-g only after new directional/traversal parity existed.

### Limitations / completion gate

- **V3-G acceptance criteria passed.** Full headless, typecheck, lint, production build and combined Playwright suite succeeded. All three required viewport captures were inspected and preserved in docs/screenshots/v3-g. No mandatory V3-G gate remains unverified.
- Campaign remains in memory; refresh resets it. Physical phone hardware, actual OS language switching, Safari and Firefox are unverified. Chromium/CDP verifies the required input and CSS viewport cases; controlled render tests do not assert a physical monitor refresh rate.
- Initial/full-rung anchors permit stepping out; automatic ladder growth above the authorized ceiling requires reachable upward excavation, preventing free climb/release flight. In cavities interrupted by solid terrain, boulders or uncollected treasure, return connectivity remains subject to the actual geometry, as specified.
- No human 1–3 minute pacing claim: direct routes above are measured scripts. No new levels, art assets, persistence, audio, enemies, crafting or other milestones were added.

## V3-F — Automatic digging & universal keyboard controls (2026-10-21)

Current request: [docs/SDD-V3-F.md](docs/SDD-V3-F.md), byte-identical to the pasted attachment (SHA-256 324181493A01E97C3C23D4F718970D49C9E251793A2D64F04234C65C37DBA106). Pre-change mechanics decisions: [docs/DECISIONS-V3-F.md](docs/DECISIONS-V3-F.md). Supersedes manual horizontal Dig, one-hit soil, unrestricted upgrade damage and the earlier cadence. Historical v0.3 reports below retain their original results.

### Implementation

- Horizontal movement alone automatically mines the adjacent destructible cell **on actual collider contact**. Horizontal motion/collision runs before contact mining, so the mole stops against the block, hits, then resumes walking on the next tick after destruction. All strikes remain in independent Core; no browser repeat/Phaser animation timer schedules a hit. Automatic mining forces a horizontal target even if Down is held without Dig. No remote mining, wall skipping, downward auto-mining, auto-placement or incidental ladders.
- Intact contact hits immediately; subsequent hits occur at configurable **24-tick / 400ms** intervals. Each simulation step can emit at most one hit. Release, direction/context change or loss of contact clears the contact session. Returning to damaged terrain requires a fresh full hold interval, preserving the correction window and preventing rapid-tap bypass. Releasing never schedules a future strike. Partial damage remains until **180 idle ticks**, then heals; destroyed tiles do not regrow or pay twice.
- Standard soil now requires **exactly 2 hits** at all power tiers. Compacted/fragile terrain requires 3 base hits; existing gravel 3 and hard rock 5 remain unchanged. Ore uses its surrounding stratum's config and retains original deposit IDs/values. Upgrades still reduce harder blocks to **max(2, ceil(maxIntegrity / power))** hits: the first strike on an intact block must leave at least 1 integrity. Damage events report the actual damage and crack stage. No energy or new mining subsystem/dependency.
- Added Core contact state (cell/direction) for held mining and a distinct SolidBlocked event on new indestructible contact. Indestructible contact never damages a block, consumes a hit interval or spends coins. Existing sprite tint/tilt and short feedback make this visibly different from mining. The six-frame dig animation and existing cracked textures remain in use.
- BrowserInput uses **KeyboardEvent.code** for both press/release, with no character/case/locale fallback. Physical A/D/W/S, arrows, J/X/Space, B/E/R and Escape work with alternate character values. OS repeat events do not create action edges or restore canceled holds. Arrow/Space scrolling is prevented. Blur, visibility changes, pause and pointer cancellation clear holds; Controller pause also clears Core contact state.
- Vertical excavation remains explicit **Down+Dig**, with the same automatic ladder/collision behavior. The existing styled button is now **Dig ↓** and directly emits that same context intent for mouse/touch. Movement buttons handle horizontal mining. Hints/README updated. No changes to tile artwork, mole drawings, backgrounds, CSS/HUD design, authored level geometry, rewards, progression, upgrade/platform prices, gravity or platform collision/drop rules. Ore stratum metadata preserves the previous palette independently of the new integrity values.
- Updated obsolete one-hit test setup and direct routes to use held movement without a Dig key. Retained collision, gravity, rock/fragile, ladder, platform, campaign, retry and camera regressions. Corrected old browser button selectors and the old assertion that expected hovering after releasing Up; idle ladders continue to fall as specified. Layout route tests now ensure the entire collider is over the platform before dropping: a foot on the adjoining solid bank correctly prevents a drop. Headless tests explicitly cover both boundary cases.

### Exact current controls

| Action | Physical keyboard | Mouse / touch |
| --- | --- | --- |
| Walk and automatic horizontal mining | Hold KeyA/KeyD or ArrowLeft/ArrowRight | Hold ◀ / ▶; no horizontal Dig action needed |
| Stop/interruption | Release direction; reverse to change target | Release/cancel direction; opposite direction interrupts |
| Climb | KeyW/ArrowUp, KeyS/ArrowDown | Hold ↑ / ↓ |
| Excavation below | KeyS/ArrowDown + KeyJ/KeyX/Space held | Hold **Dig ↓**; this is explicit Down+Dig, not automatic descent mining |
| Platform drop | Fresh KeyS/ArrowDown press | Press ↓; release/repress for stacked platforms |
| Buy / place platform | KeyB / KeyE | Buy / Platform; same 5-coin price, inventory and preview rules |
| Pause / restart | Escape / KeyR | Pause / Restart |

Keyboard labels denote physical key positions even when another language character is produced. Simultaneous touch movement, climbing/digging and purchases remain supported. Down alone does not mine. Dig keys alone no longer mine horizontally. Mouse no longer needs a special right-click gesture to excavate below; Dig ↓ is available to both pointer types.

### Final validation

| Check | Actual result |
| --- | --- |
| Full Vitest suite | **68 passed**, 8 files, final run 1.56s; includes 13 V3-F cases, a new solid-bank/platform boundary regression, and retained coverage |
| TypeScript --noEmit | **Passed** |
| ESLint src/tests | **Passed**; Core boundary restrictions preserved |
| Production build | **Passed**, 26 modules; JS 1,520.13kB / 352.98kB gzip; existing Phaser chunk-size advisory only |
| Full production Playwright suite | **16 passed (2.7m)** in the final combined run; zero page/console errors and non-local requests |
| Layouts / screenshots | **Passed / visually inspected** at 390×844, 844×390, 1920×1080; clear Dig ↓ label, unchanged artwork, no HUD overlap/overflow, >=44px controls |

Coverage includes exact hit ticks at multiple power tiers, short presses, repeated taps, release/reversal, regeneration, repeated blocks, solid-wall feedback, no downward side effects, vertical return paths, and 30/60/120Hz plus changing display-frame grouping. Browser cases use real keyboard/mouse/CDP multi-touch; CDP code/key mismatch and changed-layout keyup exercise physical mappings, tool repeats and input clearing. Browser-only scheduling wrappers deliver rendering callbacks every 2nd/4th native frame to check the same 24-tick cadence without altering Core state. Every browser case rejects page/console errors and external requests.

### Remaining limitations

- Chromium desktop/mobile CSS viewports and CDP touch/layout events are tested; physical phone hardware, actual OS language switching, Safari and Firefox are unverified. Browser timing tests control render-callback delivery; they do not claim a fixed physical monitor refresh rate.
- No new persistence, audio, enemies, crafting, levels or dependencies. Prior in-memory campaign and other v0.3 limitations remain. New direct base-power route measurements: **26.2 / 29.0 / 40.5 seconds**; no level/reward redesign or claim of a human 1–3 minute playtest.
- **V3-F acceptance criteria passed.** Final full headless, typecheck, lint, build and browser runs succeeded. Updated first-hit desktop/portrait and three layout screenshots are preserved in docs/screenshots/v3-f. No mandatory V3-F check remains unverified.

## v0.3 — Current implementation (2026-10-21)

v0.3 supersedes the historical P1/P0 reports below. Migration decisions were written before source changes in [docs/DECISIONS-v0.3.md](docs/DECISIONS-v0.3.md). [docs/SDD-v0.3.md](docs/SDD-v0.3.md) is an exact copy of the supplied specification (SHA-256 C4351931B3B164AF65271BB0C573AF7C759879387F3722A5ADDFCF3514E2D165).

### Delivered behavior and architecture

- Preserved Phaser **3.90.0**, Vite/strict TypeScript/Vitest/ESLint/Playwright and package/lockfile dependency pins. No packages added. Pure Core owns motion, AABB tile/rock collision, fixed 60Hz simulation, digging, ladders, platforms, payouts and campaign transactions. Phaser owns local textures, animation, interpolation, camera and input presentation. No engine physics, DOM, clocks or randomness in Core; lint enforces the boundary.
- Removed jump impulse/input/API, independent vertical/world-pointer aiming, Claws/Bridge selection, legacy energy and secret/lore/medal systems. Walk/facing and gravity remain continuous; <=4px collision microsteps and deterministic rock ordering are preserved.
- Added terrain integrity defaults **1/2/3/5**, power-based damage, fixed **12-tick** held digging and **180-idle-tick** regeneration. Damage events include integrity, maximum, damage and crack stage. Healing restores remaining blocks only. Destroyed blocks stay empty and stable reward IDs prevent duplicate payout. Pause freezes simulation and regeneration. Restart restores pristine terrain.
- Down+Dig on diggable support excavates directly below and adds a free ladder plus an empty anchor above. An active same-column shaft extends only through contiguous empty cells attached to existing segments. Leaving that column ends extension. Climbing uses 72px/s, 12px alignment tolerance and the existing solid collision solver; idle ladders do not support/hover. No manual ladder inventory or placement.
- New one-tile platforms: configurable **5-coin** purchase adds one inventory item; valid adjacent placement spends one item and no extra coins. Contextual preview/validation is Core-derived. One-way top collision only, with specific-platform drop suppression until the full collider clears. A fresh Down press is needed for the next stacked platform. Drop takes precedence over ladder capture; invalid transactions consume nothing.
- Non-spendable **levelGoldCollected** stays separate from spendable **wallet**. Both gain each deposit once. Three static 16×27 mines: **First Burrow**, **Amber Hollow**, **Golden Depths**, increasing depth, hardness and ore value. First Burrow's paid platform path reaches extra upper ore; its free falling/excavating route conserves coins. All three solve at base power.
- Pure **core/campaign.ts** owns in-memory progression and surface Pickaxe Power purchases (**8**, then **20** coins; powers 1→2→3). A completed mine commits income once. Restart rolls the attempt back to its entry wallet/power and resources; completed mines cannot be replayed to farm rewards. New Adventure resets wallet/upgrades/completions together. Controller only orchestrates Core transitions/accumulation/pause.
- Original procedural **64px** locally packed drawings: bevels, facets, recessed cracks, distinct shape/color strata and gold nuggets; rounded helmeted mole with **six-frame walk/dig loops**, falling pose and landing feedback. Layered backgrounds, restrained particles, local reward labels, contextual native controls and compact gold/wallet/power/platform/depth HUD. No external assets or runtime asset requests. Reduced-motion preference suppresses camera smoothing/particles. Restart/transitions clear transient feedback.
- Superseded rules and tests archived under **archive/v0.3-migration** only after the replacement movement/mining parity suite existed. Retained and adapted rock/fragile/determinism tests; restored compatible camera tests. New route tests use tick-indexed input; browser tests use actual keyboard/mouse/CDP touch, with read-only inspection datasets and no gameplay state injection.

### Ordered acceptance gates

| Milestone | Observed gate |
| --- | --- |
| V3-A | Migration/contracts documented before coding; 2 no-jump/support/free-fall tests passed before B |
| V3-B | 31 headless tests + 2 real keyboard/touch three-layer shaft return tests passed before C; typecheck/lint/build passed |
| V3-C | 38 headless tests passed including atomic purchase/placement, paid crossing, free fall, stacked drop/no snap-back, terminal landing and ladder priority before D |
| V3-D | 54 headless tests after expanded regressions; three base-power solutions, paid/free solutions, economy/upgrade/retry invariants; real three-mine campaign and paid browser route passed before E |
| V3-E | Four focused mouse/touch/layout/regeneration tests passed; screenshots at 390×844, 844×390, 1920×1080 visually inspected. Final combined suite **8/8 passed** after restart-feedback fix |

### Final validation

| Check | Executed command | Actual result |
| --- | --- | --- |
| Headless tests | node node_modules/vitest/vitest.mjs run | **54 passed**, 7 files, 1.05s final run |
| Strict typecheck | node node_modules/typescript/bin/tsc --noEmit | **Passed** |
| ESLint | node node_modules/eslint/bin/eslint.js src tests | **Passed** |
| Production | node node_modules/vite/bin/vite.js build | **Passed**, 26 modules; JS 1,519.09kB / 352.62kB gzip; CSS 3.17kB; unchanged large Phaser bundle advisory |
| Full production browser suite | node node_modules/@playwright/test/cli.js test | **8 passed (2.2m)** final rerun, including transient-feedback reset regression; zero page/console errors and external requests |
| Required viewports | 390×844, 844×390, 1920×1080 PNGs | Inspected: readable terrain/mole/ladder, no HUD overlap, no document horizontal overflow; controls >=44px; real touch purchase/place/walk/drop/dig/climb verified at each size |

**V3-A through V3-E acceptance gates passed.** Browser checks reject all console/page errors and non-local requests. The suite uses port **4187** and leaves ordinary preview **4173** alone.

Selected screenshots are preserved in [docs/screenshots/v3](docs/screenshots/v3): portrait, landscape, desktop, Amber Hollow and Golden Depths. Final Amber Hollow screenshot re-inspected: stale gold popup and toast are cleared on Restart.

### Exact controls

| Action | Keyboard | Mouse/touch |
| --- | --- | --- |
| Walk/facing | A/D or Left/Right held | Hold ◀ / ▶ |
| Facing dig | Hold J, X or Space | Hold Dig |
| Excavate downward | Hold S/Down + Dig | Touch: hold ↓ and Dig together; mouse: right-click and hold Dig |
| Climb ladder | W/Up or S/Down held | Hold ↑ / ↓; Up disabled away from ladders |
| Drop through platform | Fresh S/Down press | Press ↓; release/repress for stacked platforms |
| Buy one platform | B | Buy button; price shown, default 5 coins |
| Place adjacent platform | E | Platform button with valid target preview; disabled when invalid |
| Pause/resume | Esc | Pause button |
| Restart attempt | R | Restart button; restores entry wallet/power, not extra persistent income |
| Upgrade/continue/reset campaign | Surface menu | Power price/benefit, Next mine, New Adventure buttons |

No jump or aiming control. Digging/climbing/walking/ladder creation are free. Touch supports separate pointers; pointer cancellation, blur and pause clear holds. See README.md for the bundled-runtime preview command: on this workstation **Node does not need to be installed**.

### Actual limitations / remaining tasks

- In-memory campaign only; page refresh resets it. No disk save, audio, platform SDK or backend. Final production art/asset atlas work is deferred; current drawings are original procedural placeholders, not downloaded art.
- Direct base-power scripted solutions take **20.3 / 23.8 / 30.6 seconds** (1216/1428/1839 ticks). These are short optimal routes; the suggested **1–3 minute casual session target has not been established by human playtesting**. Balance/exploration pacing needs a later playtest; no minimum duration is claimed.
- Falling-rock and fragile-cascade mechanics remain tested reusable Core features; the three gentle progression layouts currently contain no authored rock hazards. Optional side deposits contain ordinary extra gold; no mystery/secret narrative. Gems remain supported optional collectibles, not required by these layouts.
- Real browser coverage is Chromium at desktop/mobile CSS sizes with true CDP multi-touch; physical phone hardware, Safari and Firefox are unverified. Supported input cancellation and required layouts are verified in Chromium only.
- The existing Phaser bundle-size advisory remains; no new runtime dependencies or external requests were introduced.

## Historical P1/P0 reports

## P1 — Gameplay refinement and mining experience

**P1 complete and verified.** Audit and pre-change plan: [docs/P1-AUDIT.md](docs/P1-AUDIT.md). The pasted authoritative request is preserved verbatim in [docs/SDD-P1.md](docs/SDD-P1.md) (SHA-256 matches its attachment). P1 supersedes incompatible P0 economy/level constraints. Working physics/tooling preserved; mining, bridges, boulders, camera and one authored level extended. Phaser 3.90.0, package.json and dependency lockfile/pins are unchanged; no dependencies added. P0 results below are historical baselines.

### P1 delivered behavior and architectural decisions

- Replaced the open test layout with one **24×20 handcrafted First Burrow**. Initial underground region (columns 1–22, rows 5–15) measures **192/242 = 79.3388% solid**. Authored rectangles/pockets are static design, not procedural generation. Home, stone strata, multiple layers, small caverns, side tunnel, hidden ore, secret chamber, two-bridge shortcut, excavated free route, rock/fragile puzzle and deeper exit are present.
- Preserved fixed 60Hz simulation, X-then-Y <=4px collision microsteps, constants, grounded jump, one-way bridge support and headless APIs. Fixed edge-contact roundoff using a 1e-7 AABB tolerance; this prevents a 1e-12 overlap from incorrectly rejecting a flush-wall dig. Up aim now selects the adjacent cell above the body; an 8px face-gap reach accommodates the 6px headroom of a 26px collider in 32px tunnels while retaining four-neighbor/range checks.
- Added pure `src/app/camera.ts` for zoom configuration, bounded scroll, safe area, descent look-ahead and screen/world transforms. Phaser renders/interpolates snapshots with this camera and never influences Core physics. Desktop frame capped at 1100×960 CSS pixels; mobile fills available width with >=48px world tiles. Camera lag is safe-clamped; resize and restart remain independent of motion.
- Kept sprite caches: change only edited terrain textures and nearby/exposed ore variants. Added `core/discovery.ts` for proximity hints, exposed/partly concealed ore and score-based medals. Every unique ore/gem/secret pays its integer value once into BOTH level treasure and wallet. Spending only changes wallet/spent, never objective score. No persistence across Restart.
- **Separated bridge purchase and construction.** B/Buy: -5 coins, +1 kit, 0 energy, no tile placement. E/Place: legal bank/empty adjacent target, -1 kit, -1 energy, exactly one one-way cell, 0 coin charge. Invalid actions preserve resources; duplicate placement cannot consume another kit. Inventory is serialized in GameState and resets to zero. Core handles accounting/validators; UI only reflects them.
- Extended existing boulder substeps rather than adding another physics system. After positive fall distance, fragile tiles break once and descent continues on later ticks. Soil/ore/stone/bedrock stop rocks without deleting loot. Rest clears fall momentum. Stable bottom-to-top/left-to-right/ID ordering and 12-tick warning retained. Stack-follow chains, multi-tile breaks and terrain/rock impacts have exact outcome/event-count assertions; no repeated stable-contact events or oscillations. Rocks still ignore bridges and block player sides.
- Added short local procedural dust/fragments, gold values, plank construction feedback, THUD/CRACK, invalid-action messages, quota/secret/completion indicators. No audio, external assets or effects dependencies. Reduced motion suppresses particles/camera smoothing without changing physics.
- Compact native retro HUD shows level, gold/quota, coins, energy, kit inventory, selected tool, secret and pause/reset. Buttons change Dig/Place according to tool and show separate Buy cost. Preview uses outline/ghost plus readable reasons rather than developer-only enum/coordinates. Debug inspection remains read-only canvas datasets, with no test state injection.
- Preserved existing movement, gravity, accounting, reset and determinism regressions; explicitly rewrote superseded P0 combined-buy/build and fragile-omission expectations. Updated route/browser scripts for the new authored geometry. Previous P0 browser script retained in `archive/gates/P0d-browser.spec.ts`. New tests cover camera bounds/mapping, separate inventory/economy, depletion, hidden hints, medals, positive-impact fragile breaks and stacked chains. No tests were removed just to hide a failure.

### Actual final validation

| Check | Executed command / observation | Result |
| --- | --- | --- |
| Full headless suite | `node node_modules/vitest/vitest.mjs run` | **67 passed**, 7 files; final run 1.43s total / 547ms test execution |
| Strict TypeScript | `node node_modules/typescript/bin/tsc --noEmit` | **Passed** |
| ESLint | `node node_modules/eslint/bin/eslint.js src tests` | **Passed** |
| Production build | `node node_modules/vite/bin/vite.js build`, after typecheck/lint | **Passed**, 24 modules; JS 1,513.37kB / 350.99kB gzip, CSS 1.96kB; existing Phaser chunk-size advisory only |
| Full production browser suite | `node node_modules/@playwright/test/cli.js test` | **10 passed (1.2m)**; zero page/console errors or external requests in every test |
| Three layouts | Visually inspected 390×844, 844×390, 1920×1080 PNGs | **Passed**; readable tiles, bounded world, HUD/controls outside terrain, >=44px buttons |
| Gameplay visual review | Inspected excavated tunnel and settled fragile-rock puzzle PNGs | **Passed**; actual changes in route and mining visible, authoritative rocks align with sprites |

Browser play is exercised through actual input, not only state/unit assertions: desktop paid route win, landscape free excavation win, portrait touch-only paid win with simultaneous running/jump and cancel/blur recovery, mouse-only paid win, rock crush/restart and safe fragile break/secret entry, pointer targeting after vertical camera scrolling, airborne resize matched against exact Core tick replay, and camera/controls at all required sizes. No acceptance criterion is being inferred solely from green unit tests.

Final inspected screenshots (generated ignored artifacts): `test-results/portrait.png`, `landscape.png`, `desktop.png`, `mining-landscape.png`, `mining-portrait.png`, `rock-puzzle.png`, all under `E:/LightPathfinder/shiny-burrows/`.

### Verified route outcomes and controls

- **Paid:** starting ore (3,4) -> buy 2 kits -> separately construct (8,5) and (9,5) -> mine upper vein (18,4) -> excavate column 20 rows 5–14 -> mine (21,15) -> exit (22,15). **16 treasure, 10 spent, 6 coins, 0 kits, 45 energy**, bronze. Headless asserts faster than free and fewer digs; keyboard, mouse-only and touch-only browser wins.
- **Free:** starting ore -> excavate column 5 rows 5–12 -> row 12 through soil/ore at 6,7,8,9,13,14,15, plus cavern gem at 11 -> column 18 rows 13–14 -> bottom walls 19/21 -> same exit. **19 treasure, 0 spent, 19 coins, no bridges, 40 energy**, silver. Longer/more mining, extra treasure and side exploration. Headless and real landscape keyboard win.
- **Optional:** stop above (5,12), remove support (4,11) from safe right bank, let rock shatter (4,12), enter secret (2,12), jump back. Optionally open overhead (14,11) and jump/mine side ore (14,10). Full replay with secret/side vein earns **30 treasure and coins, no spending, gold medal**. Browser verifies secret physically reachable and failure recoverable. No bridge/jump exploit bypasses the intended low-ceiling crossing in launch sampling tests.
- **Keyboard:** hold A/D or ←/→; press Space/W/↑ jump; J/X dig; I/K aim up/down; moving restores facing aim; 1/2 select Claws/Bridge; **B buys one kit; E places one cell**; Escape pauses/resumes; R resets. Actions do not OS-repeat; dig cooldown 0.15s.
- **Mouse/touch:** hold ◀/▶, tap Jump, choose Claws/Bridge, point/drag at a nearby block or Aim ↑/↓, tap **Dig/Place**. **Buy ▰ 5●** is separate. Multi-pointer controls release on cancel/blur. Pause/reset stay visible in header.
- Energy policy: start 60; successful dig/build -1 each; buying/walking/jumping/idle/aim/tool switching cost 0. Empty energy blocks tools only; movement/qualified exit and Restart still work. No automatic starvation or unwinnability detector.

### Known limitations and deferred work

No known failing tests or mandatory unverified P1 criteria remain. Current content is one handcrafted prototype, not a final art/campaign release. Physical-device, Firefox and Safari QA remain unperformed; automated browser coverage is Chromium including emulated multitouch. Full Phaser bundle still triggers a non-failing chunk-size advisory. No save/progression, procedural world generation, final AI art, audio, NPC/enemy AI, crafting, support/explosive mechanics, YouTube SDK, advertisements, monetization or additional frameworks. No M3/M4 work performed. Core energy depletion uses recoverable tool lockout, not automatic route analysis. No frame Undo/coyote time; Restart is available throughout.

Full controls, rules, route walkthroughs and limitations: [docs/P1-PLAY-GUIDE.md](docs/P1-PLAY-GUIDE.md). Run/test and no-Node-install workstation preview instructions remain in README. The historical P0 guide is marked superseded.

## SDD v0.2 pivot — migration planned before code changes

Authoritative request: replace the turn puzzle with a real-time digging platformer, implementing P0a–P0d in order. The migration table, test mapping and gate plan are in [docs/MIGRATION-v0.2.md](docs/MIGRATION-v0.2.md). Preserve Phaser 3.90.0 and all dependency pins/tooling. Archive incompatible M1 modules and tests outside runtime/check globs, rewrite motion/input/hazards, retain procedural art and engineering standards. Historical M0/M1 results below describe the superseded version, not current acceptance.

P0a gate passed: 14 headless tests; strict typecheck/lint; production build; 3 Chromium movement/jump/fall tests at 390×844, 844×390 and 1920×1080 (17.6s). Unsupported falling and terrain collision verified; portrait screenshot inspected.

P0b gate passed: 25 headless tests; strict typecheck/lint/build; 4 Chromium tests (18.9s), including dig-floor/fall and once-only ore. The new exit initially stopped the old sandbox motion script; isolated that fixture and reran green before P0c. No physics failure was bypassed.

P0c design refinement before implementation: use the explicitly permitted two-cell crossing with **two separate one-cell bridges** (5 coins each), not a falsely claimed single bridge spanning two tiles. A low ceiling plus 64px gap will be tested against every legal launch position. The starting ore pocket yields 10 coins. The longer lower route needs no purchases. This avoids changing the canonical 20px player collider or jump physics to force a one-cell jump puzzle.

P0c gate passed: 38 headless tests; typecheck/lint/build; 6 Chromium tests (35.7s) including paid/free keyboard wins. Paid route buys two separate one-cell bridges for 10 total coins, free route excavates and jumps one stone ledge. Sampled launch positions at 0.5px intervals under the low ceiling cannot bypass the unbridged crossing. Initial staircase fixture exposed a blocked climb under the upper floor; replaced it with a shared lower exit chamber and reran both legal routes before P0d.

**P0d gate passed — P0a through P0d complete (2026-10-20).** No mandatory P0 acceptance gate remains unverified. Stopped at P0d; P1 requires feedback/approval.

### Final actual verification

| Check | Command actually executed | Result |
| --- | --- | --- |
| Full headless suite | `node node_modules/vitest/vitest.mjs run` | **49 passed**, 5 files, about 457ms test execution / 1.29s total |
| Strict typecheck | `node node_modules/typescript/bin/tsc --noEmit` | **Passed** |
| Strict lint | `node node_modules/eslint/bin/eslint.js src tests` | **Passed**; Core browser/global restrictions extended |
| Production build | `node node_modules/vite/bin/vite.js build` (after typecheck) | **Passed**, 22 modules, JS 1,506.12kB / 348.54kB gzip, CSS 1.51kB; existing full-Phaser >500kB advisory remains |
| Production Chromium suite | `node node_modules/@playwright/test/cli.js test` | **10 passed (53.9s)**, zero page/console errors and zero external requests in every test |
| Screenshot QA | Visually inspected generated PNGs | **Passed**: 390×844 portrait, 844×390 landscape, 1920×1080 desktop |
| Spec import / licenses | SHA-256 comparison; dist/licenses inspection | v0.2 copy matches supplied source exactly; both runtime MIT notices bundled |

Node CLI equivalents are used because npm is absent on this shell's PATH. Standard npm scripts remain supported; dependencies/lockfile and Phaser 3.90.0 were preserved with no installs or new dependencies during the pivot.

Browser assertions cover actual jump/fall, immutable ore collision, paid keyboard win, free keyboard win with excavation/jump, two separately charged bridge placements, boulder release/crush/failure/restart and safe secret collection, mouse-only win, touch-only win with simultaneous running+jump/dig, cancel/blur release, pause tick freeze, exact-tick physics equivalence across an airborne resize, pointer targeting, all three layouts, >=44 CSS-pixel controls, local resources and browser errors. The test inspection surface is read-only; no state is injected to win browser runs.

Final screenshots (generated, ignored artifacts):

- `E:/LightPathfinder/shiny-burrows/test-results/portrait.png`
- `E:/LightPathfinder/shiny-burrows/test-results/landscape.png`
- `E:/LightPathfinder/shiny-burrows/test-results/desktop.png`

All were inspected. Square tiles, bright ore/gems, recognizable helmeted mole, cracked/solid rock patterns and distinct green/violet doors remain readable. HUD and controls occupy separate rows outside playable terrain; selected tools have an outline, and validity has text plus ✓/× as well as color. Reduced motion removes camera smoothing without changing physics.

### Final architectural changes

- Reused unchanged exact dependency pins, Vite/Vitest/Playwright infrastructure, Phaser initialization and runtime license notices. Kept/refined original procedural sprites; added plank bridge/stone and simple surface entrance.
- Replaced `model.ts`/`levels.ts` contracts with continuous feet/velocity/AABB state, static 32px tile definitions, collectible overlays and serializable stable-ID entities. State uses arrays, not serialized Sets. Tile array copies occur only on excavation; renderer caches sprites and changes only edited cells.
- Replaced old reducer/gravity/history/scoring runtime with `constants.ts`, `world.ts`, `motion.ts`, `mining.ts`, `bridges.ts`, `boulders.ts` and `simulation.ts`. Core imports only internal TS modules. No Phaser physics, sprite-derived collision, browser clock or random state.
- Controller uses 1/60s accumulator, max five catch-up ticks, action edges consumed once, pause/reset. Motion uses X then Y with <=4px axis microsteps, 20×26 collider, grounded-only jump (~34px apex), 96px/s movement, 560px/s² gravity, terminal 360px/s. No optional coyote time.
- Bridge tops are one-way, one tile each, 5 coins + 1 energy per successful placement. Support is checked from actual current geometry, preventing a same-tick mined bank from using a stale grounded flag. Quota, gold collected, wallet and spent remain separate.
- Rocks use 32px AABBs, deterministic bottom-to-top/left-to-right/ID order, a 12-tick warning and bounded real-time descent. They block player sides, stop on solids, crush on overlap, ignore bridges, and deliberately do not break fragile tiles in P0.
- Renderer interpolates snapshots and follows/clamps camera; restart snaps to spawn. ResizeObserver synchronizes the canvas after native HUD reflow. Browser input uses held directions and independent pointer IDs; keyboard/touch/mouse share Core intents. Native accessible controls/HUD are outside the Phaser canvas and contain no authoritative rules.
- Archived all superseded v0.1 runtime files and **all 58 old tests** in `archive/v0.1/`. Removed Undo and Steps from active UI/runtime. Their coverage is mapped to replacement cases in the pre-change migration plan. Prior browser gate script is retained in `archive/gates/`; sandbox content is now tests-only, and only First Burrow is bundled.

### Verified paths and exact controls

**Paid route:** mine (3,4) for 10 coins; reach bank column 7, place (8,5), walk onto it, place (9,5), continue right and drop to exit (22,8). Two separate one-cell purchases: collected 10, spent 10, wallet 0, energy used 3. **Free route:** dig hatch (5,5), fall to lower tunnel, mine (6,8)/(7,8)/(8,8), jump the stone (12,8), collect gem (16,8) and enter the same exit. Collected 13, spent 0, wallet 13, energy used 5. Both headless and keyboard browser solutions pass; paid also passes mouse-only and touch-only. Bridge is optional. Secret detour via safely released rock and (2,8) also has a tested winning replay: collected/wallet 16, spent 0, energy used 6.

Hold **A/D or left/right arrows** to move. Press **Space/W/up** to jump. **J/X** digs; default aim is facing. **I/K** select up/down aim, and a movement key/button restores facing aim. **1/2** select Claws/Bridge; **E** places a bridge and selects Bridge. **Esc** pauses/resumes; **R** restarts. Key repeats do not repeat actions; dig cooldown is nine ticks. Mouse/touch: hold ◀/▶, tap Jump, select Claws/Bridge and tap **Use**; tap/drag a nearby world tile to target it or use Aim ↑/↓. Bridge selection shows a one-cell ghost, validity/reason, price and wallet; explicit Use confirms. Controls support simultaneous fingers and release on cancel/blur. No Undo.

### Fixed failures and remaining limitations

- Resolved early schema/type errors and free-route geometry before moving gates. In final QA, portrait HUD reflow briefly left a stale canvas size; fixed with bounded CSS canvas sizing and ResizeObserver. A rock test used a zero-duration direction press; changed it to actual held facing. The CDP touch driver initially ended the wrong finger; traced real pointer events and corrected selective touch release. Reran all 10 tests green after these fixes.
- Scope remains one P0 level. No P1 supports/explosives (interfaces only), fragile chains, progression, extra levels, persistence, audio, shops, final art, frame undo, platform SDK or service worker. Do not resume obsolete M2–M4 content automatically.
- Energy drains only on successful tools. At zero energy movement/exit remain allowed and restart is available; no automatic unwinnable-board detector. Kill plane is separate from fall distance; intended chamber drops are safe. Rocks use bounded axis steps, not a general swept rigid-body engine.
- Browser QA is automated Chromium (including emulated touch), not physical-device, Safari or Firefox certification. Those are follow-up QA, not claimed as executed. Bundle-size advisory is non-failing and still open.
- Full run/test commands and the no-Node-install workstation preview command are in README. Route walkthrough, targeting, accessibility choices and limits are in `docs/P0-PLAY-GUIDE.md`.

## Historical v0.1 scope and decisions (superseded where incompatible)

Implement M0 and M1 plus the explicitly requested single-level browser prototype from SDD section 15. M2–M4 remain future milestones.

- Use exact Phaser 3.90.0, verified at https://phaser.io/download/release/v3.90.0 and its versioned official API documentation. Phaser 4 features offer no benefit here.
- TypeScript strict mode and Vite provide compilation and bundling. Vitest provides headless tests. ESLint with typescript-eslint provides strict linting. Playwright is a development-only browser smoke test dependency. No other application dependencies.
- Core uses only internal TypeScript imports. Level metadata is part of state so applyAction(state, action) is self-contained. History wraps reducer snapshots rather than recursively embedding history in state.
- Boulder identity and fall distance are tracked only during each cascade. Special markers support boulders. Physics stops immediately on player collision; the preceding chronological events remain available for rendering.
- Pause and input cadence belong to the application adapter. Rendering uses local primitives; no downloaded assets or runtime network calls.

## Progress

### Visual direction update — 2026-10-20

- Replaced placeholder glyph tiles with original procedural 24×24 retro sprites. Nearest-neighbor filtering, square cells, distinct shapes/patterns and flat high-contrast colors prioritize small-screen readability.
- Added gold nuggets, faceted cyan gems, chunky cracked boulders, fractured tan floors, masonry bedrock, green exit and violet secret door. Boulder warning adds an amber outline before falling.
- Mole now has a compact pixel silhouette, miner helmet/lamp, eyes, pink snout and scarf. HUD uses compact monospace text and warm beveled controls.
- Updated SDD section 3 and asset/decision documentation. No new dependencies, external art or changes to simulation rules.
- Verification: **58 core/level tests, 3 Chromium production smoke tests, strict typecheck, lint and production build passed**. Inspected portrait/landscape screenshots: all tile types, the mole, compact HUD and controls remain distinct and visible. Build is approximately 1.50 MB JS / 346 KB gzip; existing Phaser chunk-size advisory remains.
- Browser tests now use port 4187 to avoid interrupting the existing playable preview on port 4173. Refresh that preview to load the rebuilt art.

**M0 and M1 complete**, including the requested single-level playable browser prototype. Final checks passed on 2026-10-20.

### M0

- Exact dependency pins, npm lockfile, Vite development and production scripts, strict TypeScript, strict ESLint, Node-based Vitest and Playwright smoke tests.
- Phaser scene with local procedural grid/mole placeholders, keyboard/mouse/touch controls, responsive portrait/landscape layouts, reduced-motion support, blur pause.
- Canonical SDD, decisions, README, asset notices and bundled runtime MIT licenses.

### M1

- Validated rectangular grid model, authored treasure metadata/defaults, schema parsing and immutable state creation.
- Pure movement/digging/collection, boundary and collision checks, deterministic gravity and fragile breakage, ordered presentation events.
- Completion thresholds, medals, secret marker, retry state, full-turn Undo (50 snapshots), Restart. Pause belongs to the application adapter.
- One sample level with tested direct and secret/gold solutions; safe rock/fragile cascade. Headless engine never imports Phaser or browser APIs.

### Checks (2026-10-20)

- `npm test` equivalent `node node_modules/vitest/vitest.mjs run`: **58 passed**, 2 files; about 16 ms executing tests.
- `npm run typecheck` equivalent `node node_modules/typescript/bin/tsc --noEmit`: **passed**.
- `npm run lint` equivalent `node node_modules/eslint/bin/eslint.js src tests`: **passed**.
- Vite production build: **passed**, 17 transformed modules; JS approximately 1.49 MB / 345 KB gzip. Advisory >500 KB chunk warning from full Phaser bundle.
- `npm run test:browser` equivalent `node node_modules/@playwright/test/cli.js test`: **3 passed** against the production build, approximately 7.1 seconds. Covers startup without console/page errors, keyboard win, Undo, Restart, viewport changes, touch command equivalence, mouse pause/resume and zero external resource requests.
- Inspected generated portrait (390×844) and landscape (844×390) screenshots: square grid, HUD and controls are visible and do not overlap. Screenshots are in ignored `test-results/`.
- Runtime MIT notices verified in `dist/licenses/`. Initial specification import SHA-256 matched the supplied document exactly; section 3 was subsequently amended by the user's explicit visual-direction request, as recorded above.
- Browser setup initially failed because localhost was sandbox-restricted and Chromium was absent. Retried with local network access after installing Playwright Chromium; all assertions passed. No known failing tests remain.
- Direct Node CLI equivalents were used because this shell provides Node and pnpm but no npm executable on PATH. Dependencies were installed through pnpm's npm launcher, producing a standard `package-lock.json`; documented npm scripts work in a normal Node/npm installation.

### Remaining work

- M2: three curated levels, refined camera/animation, more extensive desktop/mobile/browser QA. Current sample is the explicitly requested first-batch playable screen.
- M3: remaining ten-level content set and validated mechanic fixtures, level select/progression, versioned persistence, main menu, tutorials, best stats.
- M4: final art/audio and mute control, performance/bundle trimming, broader accessibility and Chrome/Firefox/Safari device QA. YouTube integration remains a separate follow-on.
- No service worker, persistence or remote platform integration in this batch. Built assets work on a local HTTP server without internet after delivery; new dependency/browser installation requires network access.
- Browser input ignores OS key repeats and uses a 140 ms minimum movement cadence. Commands cannot bypass animation completion. Landscape rearranges controls rather than shrinking the portrait layout.

### V3-A gate (2026-10-21)
Migration plan committed to files before source edits. Removed jump impulse. New no-jump/support/free-fall gate: 2/2 Vitest tests passed. Continuing to V3-B; earlier jump assertions will be superseded with parity coverage before archival.

### V3-B gate (2026-10-21)
31/31 headless tests passed (including preserved hazard/fragile regressions); typecheck, lint and production build passed. Chromium: 2/2 real keyboard and multi-touch shaft descent/ascent tests passed. Three-layer Down+Dig creates a connected return ladder; Up reaches the anchor, without a jump. Replaced jump/energy/aim tests archived only after new movement/mining parity suite existed. V3-C next.

### V3-C gate (2026-10-21)
38/38 headless tests passed; typecheck/lint passed. Added atomic configurable platform purchase, adjacent preview/placement, one-way landing, specific-platform drop suppression until collider clears, stacked-platform edge semantics and ladder-drop priority. Scripted paid crossing and free falling route pass in the geometry fixture. Full authored-level route/browser checks follow in V3-D/E.

### V3-D gate (2026-10-21)
54/54 headless regressions pass. All 3 handcrafted levels solve at base power; First Burrow paid/free routes both solve. Scripted direct runs: 1216/1428/1839 ticks = 20.3/23.8/30.6 seconds; 1–3 minute casual pacing remains a playtest target, not a verified duration. Chromium three-level progression + both upgrades/retry reset/New Adventure passed (1.1m), paid platform route passed (22.6s). Fixed invalid synthetic Phaser resize event exposed by zero-console-error gate. Typecheck/lint/build passed before browser rerun. V3-E starts now.

### V3-E final gate (2026-10-21)
Final full verification after restart-effect cleanup: 54/54 headless tests (7 files), typecheck, lint, build, and 8/8 Chromium browser tests (2.2m) passed. All three required layout images inspected; copies under docs/screenshots/v3. No mandatory automated/viewport gate remains unverified; physical-device/browser-family checks and pacing playtests remain the explicitly scoped limitations above.


