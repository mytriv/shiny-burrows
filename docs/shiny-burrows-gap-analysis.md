# Shiny Burrows audit and gaps

2026-10-23; current baseline v0.6.1. This phase changes documentation only. The audit covers the complete active source/module inventory, configuration, current level data, tests, license notices, prior specifications/migration decisions, status and existing capture/performance receipts. `archive/` contains superseded systems, not active mechanics. Dependency internals/generated bundles are not treated as hand-authored gameplay. Root `IMPLEMENTATION_STATUS.md` is current; `docs/IMPLEMENTATION_STATUS.md` contains historical material.

## Existing architecture to preserve

| Layer / complete active module groups | Current responsibility | Reuse / specific gap |
| --- | --- | --- |
| `core/model,constants,config,world,levels` | Immutable state contracts, validated rectangular cells, AABBs, balance and state construction | Preserve. Validation permits up to65,536 cells, while presentation batches have lower fixed capacities; the general validator is not a render-capacity guarantee. |
| `core/motion,mining,ladders,platforms,boulders,simulation` | All authoritative rules; internal TypeScript imports only | Preserve. Fixed1/60s step, X/Y microsteps≤4px; renderer cannot decide collisions/rewards. |
| `core/campaign` | Three-stage sequence, completion, wallet and claw purchases | Reuse serialization-friendly data; no durable storage or untrusted-save validation. |
| `content/levels/first-burrow` | All three original16×27 authored mines | Preserve identities and existing paid/free routes. Repetitive layered bands; all three have zero boulders and no optional discovery state. |
| `app/GameController` | Fixed-step accumulator, five-step catch-up cap, input edges, restart/level commits | Preserve; future restore initialization and host suspension belong here, outside Core. |
| `app/BrowserInput` | Physical key codes, held pointer IDs, cancellation, action edges | Preserve keyboard/mouse/touch. Visibility/blur listeners must become platform-aware for host integration. |
| `app/camera` | Zoom, tracking and bounded visible region | Preserve square logical coordinates; extreme aspect ratios still need testing. |
| `app/GameAudio` | Gesture-unlocked original short Web Audio tones | Reuse synthesis. No host audio permission or explicit pause suspension; local overall mute needs platform review. |
| `presentation/phaser/LevelScene`, `main` | Phaser3.90.0 HEADLESS lifecycle/time and adapter wiring | Preserve dependency. No Phaser physics/input authority. Currently combines lifecycle, help, platform-like events and telemetry. |
| `presentation/WorldRenderer`, `Hud` | Snapshot/event rendering interface and truthful DOM status | Preserve interface and accessible controls. No SDK bridge. HUD calls Core validation read-only. |
| `presentation/three/ThreeWorld,coordinates` | One Three0.180.0 WebGL2 canvas; orthographic depth | Preserve approved style. WebGL2 initialization failure throws; host/device compatibility is unproven. |
| `three/geometry,variation,Batch,TerrainView` | Original procedural materials/meshes, seeded cosmetic variation, shared instancing and eight-row terrain groups | Preserve. No random gameplay. Tile-array changes rebuild terrain batches; global detail batches are less selective than row geometry. |
| `three/ObjectsView,MoleView,Particles` | Ladders/platforms/round rocks, articulated one-cell mole, event effects | Preserve; capacities include64 rocks/bonus visuals,1024 object cells,48 particles. More content requires explicit budgets. |
| Vite/TS/Vitest/ESLint/Playwright, scripts, public licenses | Existing development/build/regression infrastructure | Preserve exact pins and lockfile. No added application dependencies needed for proposed adapters. |

Separation is already suitable for incremental modernization. Add platform and persistence adapters around existing contracts; do not move rules into Three, Phaser, DOM, SDK callbacks or save transport. No source module needs wholesale replacement. Archived undo/turns/jump/energy/aiming systems must not be resurrected.

## Implemented rules and inconsistencies

- Cells32×32; mole collider20×26 within one cell; orthographic elevation20° with projection compensation. Visible depth22px is cosmetic. Solid ore has soil base and embedded gold; square stone and rounded boulders are distinct. No new art or character redesign is warranted.
- Walk96px/s, climb72px/s, gravity560px/s², terminal360px/s. No jump. Automatic mining in all four directions; Up mines a reachable ceiling while grounded even without a ladder. Simultaneous horizontal/vertical intents give horizontal mining priority. Acquired ladder grip remains stationary when released.
- Dirt integrity2 and a first-hit correction window preserve exactly two hits even at upgraded power. Compacted/gravel3, hard5; minimum2; ore adds one explicit hit. Strong claws can bring hard terrain down to two actual hits: “hard3+” is not a current all-upgrades invariant. Do not silently rebalance it; clarify whether a future minimum-three-hit rule is desired before changing approved upgrade behavior.
- Repeat dig interval24ticks (400ms); damaged cells regenerate after180idle ticks (3s). New pristine contact strikes immediately; resuming a damaged target has a delay. Two dirt strikes are therefore not automatically800ms from contact.
- Automatic free ladders follow actual vertical collision-resolved travel, including falling; no ladder grants unsupported flight. One-cell one-way platforms cost5; B buys, E places, fresh Down drops. Placement validates support, occupancy, inventory and range atomically.
- Gold credits quota and wallet immediately, exactly once. Spending does not reduce quota. Quotas20/45/70; claw costs8/20 and powers1/2/3. Successful level completion commits campaign wallet; restart reconstructs entry state, rolling back attempt loot/spending. No energy, backpack, enemies, explosives, stamina or procedural generation.
- Boulders already have square32px envelopes, warning12ticks, deterministic ordering, crush failure, impact events and fragile-floor chains. Campaign hazard absence is a **content gap**, not absence of the engine. Initial rock cells are empty terrain occupied by entities; the validator currently does **not** require surrounding dirt. Add a campaign-authoring constraint for cardinal neighbors without breaking deliberately unsupported physics fixtures. No campaign map currently exercises this new requirement.
- No fog/exploration state exists; ore fronts are rendered wherever visible to the camera. Camera clipping is not hidden-gold discovery. Three levels and two upgrades form a complete prototype, not long-term progression/replayability.

Exact controls: physical A/D or arrows left/right walk and auto-dig; W/Up auto-digs upward or climbs a grabbed ladder; S/Down mines/descends, fresh press drops through platforms. Release holds ladder grip. B buys one platform; E places. Escape pauses/resumes; R restarts. Four direction buttons support held mouse/touch and multiple pointers; purchase/placement buttons, mute, pause, restart and settings/help are separate accessible buttons. No aim or jump input.

## Verification and actual performance

Fresh analysis-phase run: **114/114 tests in16 files passed,5.07s**; strict typecheck and ESLint passed. Automated coverage includes contact mining/cooldown/regen, all directions/layout-independent keys at adapter/browser level, ladder acquisition/traversal, one-way platforms, wallet/idempotent loot, hazards/fragile chains, camera, all three routes and upgrades, geometry/animation bounds, resource reuse, plus nine exact full-state replay signatures and source preservation checks.

Six browser spec files contain the previously verified combined35 Chromium tests. Root status records **35/35 (6.2m)** and successful build/typecheck/lint at v0.6.1. These browser/build receipts are historical baseline evidence; **not rerun or recertified in this documentation phase**. Emulated touch/layout coverage is not physical-phone, Safari, Firefox or YouTube certification.

Existing production output inspected: six files,2,036,902 bytes total; largest JS2,022,156 bytes, CSS7,865. Existing Vite `base:'./'` and built relative asset references are appropriate foundations. This small local bundle is not an ingested host transfer-size measurement. `node_modules`, research artifacts, reference images, screenshots and archives must not be packaged into the Playable.

Actual saved v0.6.1 captures: portrait390×844 median33.3ms/p95 50ms; landscape844×390 median33.3/p95 33.4; desktop1920×1080 median33.3/p95 50. CPU submission around1.46–1.61ms does not include GPU cost.60–63 calls,95,508–105,806 triangles; three textures; drawing buffer capped400k pixels and DPR1.5. **60FPS has not been demonstrated.** These are existing workstation receipts, not fresh mobile measurements.

Measured ~30FPS suggests GPU/frame scheduling work, but does not establish a single cause. Profile before optimizing: full engine bundle/startup, translucent/contact detail overdraw, per-frame JSON telemetry and DOM writes, immutable per-tick arrays, terrain regeneration batch rebuilds and object bounding-sphere recomputation. Reduce allocation/diagnostics or introduce cached dirty state only with route/state parity and resource stability checks. Do not lower detail or pixel density further without readability review. No measured heap/mobile cold-load result exists.

## Prioritized platform gaps

| Priority | Finding | Evidence / consequence |
| --- | --- | --- |
| Blocker | No YouTube SDK/readiness lifecycle | `index.html` and `main.ts`; local preview cannot establish host compatibility. |
| Blocker | No persistent progress | `newCampaign()` at controller creation; refresh loses all completion/upgrades. |
| Blocker | Pause only freezes simulation | `LevelScene.update()` continues input reads, render/HUD/telemetry and Web Audio context remains active. Host pause must stop more than Core ticks. |
| Blocker | Host-incompatible visibility and Escape paths | Scene uses Page Visibility API; help capture calls `preventDefault()` on Escape. Host mode requires adapter changes; BrowserInput's ordinary Escape path does not itself prevent default. |
| High | No host mute policy | GameAudio unlocks on window gestures and only checks its local boolean. |
| High | No real-device/performance/heap certification | Three viewport Chromium receipts and ~30FPS do not satisfy whole host/browser matrix. |
| High | Buried-rock authoring and discovery missing | Validator lacks surrounding-dirt rule; all campaign rock lists empty; no fog state. |
| Medium | No measured player pacing or replay loop | Scripted routes29.4/31.1/42.6s are efficient replay durations, not first-time session measurements. |
| Medium | Long-term wallet/retry/replay semantics undecided | Adding repeated rewards without a design could permit farming or double commits; persistence must define ownership/versioning first. |

See [official platform matrix](youtube-playables-requirements.md) and [incremental roadmap](modernization-roadmap.md). New discovery masking, content routes and replay rewards require concrete design approval before gameplay edits. Current approved mechanics and visuals remain the baseline.
