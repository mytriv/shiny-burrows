# Shiny Burrows modernization roadmap

Historical proposal: gameplay scope is superseded by `SDD-OVERHAUL.md`. Current implementation design and next steps are `MILESTONE-A.md` and `OVERHAUL-PLAN.md`; older four-direction preservation and excluded-scope decisions below no longer govern the overhaul.

2026-10-23. **Proposal delivered before implementation.** No gameplay, dependency, level or visual changes are authorized by this document alone. Basis: [reference evidence](bonanza-reverse-engineering.md), [mechanics inventory](bonanza-mechanics-inventory.md), [current audit](shiny-burrows-gap-analysis.md), [official platform matrix](youtube-playables-requirements.md).

## Direction and preserved contracts

Preserve Shiny Burrows' original mole, warm dimensional cartoon materials, embedded gold, dark simple backdrop and square logical grid. Keep Phaser3.90.0, Three0.180.0, current tools, TypeScript Core, fixed ticks, event-driven presentation,32px cells/20×26 mole, continuous walking/falling, no jump, all-axis automatic digging including grounded Up, stationary ladder grip, automatic free ladders, two-hit dirt, gold's extra hit, integrity regeneration, paid one-cell one-way platforms/drop-through, immediate gold credit, free restart and separate quota/wallet. No enemy, supernatural, narrative, crafting, extra resource, stamina or carrying system.

Original reference code/assets/dialogue/maps/music are research only. Implementation must be written from Shiny Burrows contracts and approved behavior, with original handcrafted maps. Bonanza evidence explains design opportunities; it does not override existing requirements.

Proposed boundaries:

```text
Keyboard / mouse / touch → InputIntent → GameController → pure Core → state/events
                                                    ↘ snapshots → validated save codec
state/events → current Three renderer / DOM HUD / audio
host adapter → suspension + audio permission + save transport + readiness
```

Core owns mechanics and any approved discovery state. The host adapter never awards gold or changes collision. A persistence codec validates data; storage transports do not become rules engines. Local development and host modes select different platform backends explicitly. Do not add a framework, general ECS, network service, event bus package or renderer replacement.

## Ordered milestones and acceptance gates

Each milestone is independently testable. Do not proceed past a failed mandatory gate. Complexity is relative implementation effort, not a delivery promise. Every feature below states its original basis, proposed behavior, player rationale, technical approach, performance, acceptance and tests.

### R0 — Baseline and implementation decisions

**Original basis:** B01–B18 establish a reference, but interactive emulator behavior remains unknown. **Proposed behavior:** freeze current playable contracts and agree the concrete changes below before coding. Resolve whether later discovery masking, new route layouts and replay rewards are wanted; do not silently reinterpret hard-terrain hit counts at upgraded power.

**Why:** avoid losing working controls/style or importing legacy friction. **Approach:** retain existing source and nine replay signatures; version map IDs and save design separately. Document initial unreleased boulders as entity-in-empty-cell with four in-bounds cardinal neighbors of standard dirt; do not change collision dimensions. Keep unsupported-rock physics fixtures separate from campaign authoring validity. **Complexity:** small. **Performance:** none.

**Gate/tests:** full114-test baseline, tsc/lint/build and full browser baseline green before implementation; collect source hashes and three layouts. No acceptance requires porting Bonanza's modes or completing its decompilation. If an uncertain original mechanic is proposed later, obtain stronger evidence or label the proposal original. **Current phase:** documentation and fresh unit/type/lint checks delivered; no new browser/build run claimed.

### R1a — Versioned progress codec

**Original:** B16 saves progress/upgrades locally. **Proposed:** reliably retain existing campaign completion, wallet, tier and current mine, without changing earning/spending rules. **Why:** brief sessions should not erase progress. **Approach:** pure validated schema with version, content revision, campaign and optional attempt checkpoint; stable loot/level IDs and current mutable tiles, player, rocks, ladders, inventory, cooldown tick and platform-ignore state. Omit render effects/interpolation/DOM/clock. Preserve entry wallet/power for restart rollback. Reject invalid numeric bounds, impossible economy, invalid IDs/positions and oversized arrays. Reconstruct against trusted level definitions. Known schema migrations explicit; unknown future schemas read-only with retry/new-session choice, never automatic destructive overwrite.

**Complexity:** medium. **Performance:** serialize on meaningful change/checkpoint, not each60Hz tick; small bounded JSON. **Acceptance:** round-trip reaches identical next-step states/events; restart after restore matches existing rollback; malformed/old/new-version data never crashes or overwrites a valid save. Define checkpoint loss window visibly; target<64KiB snapshots for current content, not a mandatory engine-wide cap.

**Automated tests:** current campaign phases and all tiers; checkpoint mid-strike/regen/grip/drop-through/warning/fall; duplicate loot/finish/upgrade prevention; missing content IDs; corruption/truncation/negative/NaN/overlarge values; migrations, exact deterministic continuation and unchanged route signatures.

### R1b — Save orchestration and platform lifecycle

**Original:** B02/B16 local lifecycle/RMS; no YouTube equivalent. **Proposed:** host/cloud save and safe interruption with standalone development behavior retained. **Why:** leave/re-enter without surprise loss, audio or movement. **Approach:** `PlatformAdapter` and `SaveTransport` interfaces outside Core; real YouTube and local development implementations; use official API contracts in the platform matrix. Load before writable play; distinguish successful empty data from failed load. Allow an explicitly unsaved temporary session after failure without cloud writes until recovery. Serialize/coalesce pending saves; snapshot revision prevents stale writes. Save completion, purchases, stage changes and bounded active-attempt checkpoints; prepare compact current snapshot continuously in memory for pause flush. No cloud-to-local progress fallback in host mode.

Use independent suspension reasons: host, user, help, context loss. SDK pause suspends Phaser stepping, Three draws, audio, UI/input and other callbacks; clear holds/clock so no catch-up burst. SDK resume removes only host suspension. Handle resize/context restoration without running simulation while suspended; do not use visibility/blur to determine host pause. Standalone listeners can retain existing behavior. Host mute is master permission and cannot be bypassed by gesture unlock. Do not prevent default on Escape, including help. Readiness ordering covers visible loading and actual interactability.

**Complexity:** medium/high. **Performance:** no network polling or per-frame save work; compact coalesced SDK writes; no execution while host-suspended except required lifecycle handling/flush. **Acceptance:** R1a plus platform matrix integration rows verified, no overwrite after load failure, deterministic first frame after resume, successful refresh/return restores committed state, no stuck held input or audio leak. SDK mocks are necessary but official host tests remain a separate mandatory release gate.

**Automated tests:** fake host callback ordering; pause during load/save/mining/modal/upgrade; repeated pause/resume/unsubscribe; attempted user unpause during host stop; audio enabled/disabled race before gesture; save queue rejection/out-of-order readiness; no update/render/input/audio activity while suspended; SDK-first HTML and no Escape default cancellation; reload/continue/purchase/retry round trips in browser. No platform dependency imported by Core.

### R2 — One readable buried-rock route

**Original:** B10/B11 encodes collapses and supports; complete falling behavior is unknown. **Proposed:** one original optional boulder pocket using our existing rock simulation; keep a safe free alternative and optional paid-platform shortcut. Unreleased rocks begin with dirt in four cardinal cells and stay visibly round when exposed. **Why:** a clear support-removal consequence gives route choice without random punishment or new tools.

**Approach:** content-only addition first; authoring validator checks enclosure, IDs, dimensions and spawn/exit clearance. Establish authored escape space and a legible warning before final support removal; use existing12-tick warning and impact events. Do not shorten costs or increase delay implicitly: playtest current warning and request a concrete balance change if needed. Gold in the side pocket is optional and embedded in soil. No structural beams, supports consumable, explosives or hazard randomization.

**Complexity:** small/medium. **Performance:** one or few entities within existing64-rock batch; no new textures/lights. **Acceptance:** safe base-power completion without touching rock, optional reward detour, deterministic release/impact and a recoverable route; unreleased enclosure passes; no overlap or platform bypass of rock collision; exact square grid/mole bounds/style retained. No claim that12ticks is universally sufficient for newcomers until playtested.

**Automated tests:** reject exposed/edge/overlapping campaign rock placement; support removal once; warning/fall/landing/crush; rock-on-fragile chain parity; paid/free/detour full-level replays at all tiers; mouse/touch/key scenarios and warning/impact screenshots. Existing intentionally unsupported hazard fixtures continue to test physics separately.

### R3 — Gold discovery with limited reveal

**Original:** B07/B08 has veins, fog and hints; not equivalent to our camera clipping. **Proposed, approval-dependent:** retain nearby embedded deposits and reveal a small authored pocket through excavation. Offer a subtle original gold cue on its bordering soil rather than an omniscient full-map reward preview. Never hide the player's own cell, reachable danger warning, route back or controls.

**Why:** make digging expose an understandable reward rather than just clear visible bands. **Approach:** explicit per-cell discovered flags and deterministic reveal in Core, using a small bounded neighborhood and authored hint cells. Renderer reads flags and masks whole32px cells without new collision. Saved discovery survives resume; retry follows defined attempt rollback. Do not conceal a boulder warning behind fog. No full-screen postprocessing, dynamic lights or purchased map system.

**Complexity:** medium. **Performance:** cheap bounded reveal on changed cells; mask in existing chunks/instances; avoid rebuilding all terrain on every camera movement. **Acceptance:** opening uncovers actual embedded ore, one collection only, no leaking hidden data through production HUD, route/hazard readability and unchanged mining/collision. This intentionally changes information available to the player; explicit approval precedes implementation.

**Automated tests:** reveal bounds/corners, no reveal-through-bedrock if chosen by approved rule, repeat reveal idempotence, checkpoint/retry, all dig axes and rock exposure. Browser captures before/after/pause/resume on three layouts; no floating gold/black-hole replacement of soil. Evaluate human discovery comprehension separately.

### R4a — Useful upgrades and concise onboarding

**Original:** B14/B17 has capacity/boots/support tiers and dialogue. **Proposed:** keep current claws, costs8/20 and powers1/2/3; display actual strike savings on the next stratum and retain two-hit dirt. One initial direction hint disappears after successful action, with help always available. **Why:** upgrades should have a comprehensible purpose; players should dig before reading a manual.

**Approach:** derive preview from a pure shared helper tested against mining, not duplicated UI arithmetic. Keep the workshop and existing input identifiers; no compulsory modal before first action. Honor reduced motion; combine gold message, existing bounded particles and synthesized sound, with no extra HUD currency or decorative object.

**Complexity:** small. **Performance:** preview recomputed on tier/content change only. **Acceptance:** preview matches all actual terrain/gold hit sequences; no misleading effect for dirt; insufficient funds spends nothing, affordable purchase commits once; first interaction available without closing onboarding; approved exact controls unchanged.

**Automated tests:** full hit-count matrix across strata/powers/ore, preview parity, double-click/key-repeat purchases, restore and retry; touch-only/mouse-only onboarding and keyboard-layout parity; muted/reduced-motion feedback, live-region announcements and one-cell animation regressions. If a hard3+ minimum is wanted, supply a separate balance proposal rather than hiding it in UI work.

### R4b — Three distinct short mines and measured pacing

**Original:** B04/B15 authored shapes, milestones and extra objectives; actual reward frequency unknown. **Proposed:** refine our three original descending mines into an introductory vein route, a safe/risky optional pocket, and a deeper upgrade-benefit route. Keep quota+exit, free completion at base power, optional platform use and automatic return ladders. Preserve named levels; do not expand count speculatively.

**Why:** repeated horizontal bands currently provide limited reason to choose different routes. **Approach:** small reviewed data edits after R2/R3 decisions; measure route length, hit effort, reward spacing, accessible optional value and time between decisions. Keep finite clear completion. Do not remove enough gold to make platform purchases mandatory or penalize exploration with stamina.

**Complexity:** medium, mostly authoring/QA. **Performance:** retain small rectangular maps and established batch caps. **Acceptance:** all three solve at base power with zero spending; all tiers and paid/free/optional routes verified; no softlock, forced hazard or arbitrary wait; distinct choices observed by newcomers. First action1–3s, gold5–10s, reward≤15s, loop≤30s, choice≤60s and session2–5min remain hypotheses until observed.

**Automated tests:** update golden replays only for explicitly approved map changes; quotas reachable, unique rewards, no negative wallet, restart/resume integrity and row/enclosure constraints. Browser all input modes and resize mid-route. Supplement with a formative study of at least five unfamiliar consenting participants: local timestamps plus comprehension/route-choice observations, report each and median/range, failures and revisions. Five is an initial study, not proof of universal pacing. No remote analytics dependency.

### R5 — Modest replay and persistent progression

**Original:** B15/B16 stored unlocks, bonuses and upgraded equipment. **Proposed, approval-dependent:** persist current three-stage completion and best route results; allow explicit replay with a separate attempt, without charging entry or duplicating first-completion rewards. Keep upgrades useful, show all content completed and let the player start over only by an explicit destructive reset action. **Why:** return sessions need understandable goals; repeated coin farming or lost upgrades would undermine them.

**Approach:** first save the existing campaign in R1; subsequently add per-mine best collected gold/completion records and a clearly specified reward policy. Conservative proposal: replay does not add permanent wallet; existing completion gold remains the sole progression income. Verify affordability before approval; if this creates a dead end, revise economy openly rather than auto-resetting purchases. A reset must not overwrite cloud data before an intentional user action. No daily timers, random loot, endless mode, subscriptions or new currencies.

**Complexity:** medium. **Performance:** a few bounded per-level fields; no growing event history. **Acceptance:** reload restores unlocks/tiers; replay cannot double-award or regress best results; selected mine cannot invalidate the main campaign; all current upgrades remain reachable; completion truthful. Long-term retention beyond three mines remains unproven; do not call three replayable mines a content-complete long-term game.

**Automated tests:** upgrade/replay/finish/reset state-machine table; duplicate/out-of-order finish events, save round trips and migration; base-power economy solution and spending extremes; browser return session and final-content screen. Follow-up playtests must establish whether another authored content batch is useful before proposing its size or systems.

### R6 — Performance, accessibility and host release candidate

**Original:** B02 was constrained handset rendering; copying its implementation is inappropriate. **Proposed:** retain approved dimensional art and existing engines, improve measured rendering/loading and verify target host behavior. **Why:** small-screen clarity, steady interaction and reliable suspension matter more than extra visual decoration.

**Approach:** profile current~30FPS first on real devices; gate verbose per-frame telemetry to development/test, reduce proven allocation/batch rebuild costs, keep shared resources/48 particles and grid bounds. Evaluate splitting/lazy loading only where measured startup improves; no blind engine removal or downscaling. Production package includes only `dist` and necessary notices, never research/reference JARs. Test host frame/readiness and persistence integration against official matrix.

**Complexity:** medium/high validation, optimization dependent on measurements. **Performance:** target practical60FPS on a declared reference tier and controlled degradation elsewhere; record cold-load time, median/p95 frame, heap, buffer density, calls/triangles and resource stability. Local design targets: median≤16.7ms on reference tier; no long input freeze, no post-resume catch-up; weaker devices need a documented readable fallback budget, not an invented platform rule.

**Acceptance:** full unit/type/lint/build/browser checks; no Core dependencies on platform/render/browser APIs; exact grid, mole, gold/boulder bounds and route regressions. Layouts include390×844,844×390,1920×1080 plus9:32,1:1,32:9 and live rotations; every action reachable without overlap; Escape untouched; touch/mouse/physical keyboard support. Supported desktop browsers and physical Android/iOS host tests, heap and cold-load traces, accessibility/manual content/rights/metadata review and official test suite all recorded. Unavailable device/portal checks remain release blockers, never assumed green.

**Automated tests:** production SDK-script ordering and packaging/file budget scanner; all current browser specs plus save/lifecycle/network checks; repeated reload/restart/resume/context restoration; no resource leak after20cycles; touch multi-pointer cancellation/drag/rotation; screenshots and animation geometry; support-browser runs where available. Human/device/certification tasks remain distinct from automation.

## Deferred and rejected scope

No backpack hauling, stamina loss/waiting, consumable support economy, enemies, mystical artifacts, rescue narrative, lava/ice/gas, explosions, crafting, new currency, leaderboard, ads or multiplayer. Their original presence is neither a requirement nor evidence they improve this game. Broad procedural generation is deferred; authored choices can be evaluated first. R3 and R5 are deliberate proposals requiring approval, not stealth additions to platform work.

Next implementation slice recommended: **R0 → R1a → R1b**, then the reviewed **R2** pocket. Discovery/replay and map revisions follow approval and pacing evidence. Actual delivery of a production YouTube Playable requires R6's external validation; this analysis does not claim that outcome.
