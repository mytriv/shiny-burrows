# Bonanza-inspired overhaul — current scope and Milestone B plan

Update2026-10-23: Milestone B implementation is explicitly authorized by the subsequent `MILESTONE-B-REQUEST.md`; its pre-code design and implemented content are in `MILESTONE-B.md`. The original A-only scope and proposed B bullets below are historical planning context. Current verification and performance limitations are in the newest root `IMPLEMENTATION_STATUS.md` section. C–G remain unimplemented.

2026-10-23. Authority: user's latest pasted “Bonanza-Inspired Gameplay Overhaul”. It supersedes the gameplay scope of `modernization-roadmap.md` and the four-direction mining rules in V3-G. The five analysis documents remain research evidence and historical audit, not a veto on this scope. Current delivery is **Milestone A only**; B–G are planned, not implemented.

## System disposition

Reference IDs below point to `bonanza-reverse-engineering.md`. “Faithful” means gameplay principle, with independent implementation and original assets/maps/text. Text-only or uncertain reference details remain explicitly uncertain.

| Baseline feature | Classification | Overhaul disposition / milestone |
| --- | --- | --- |
| Grid, directional movement/mining, collision (B03–06) | Modernize | A: continuous motion, left/right/down automatic digging, climb-only Up; preserve square geometry, two-hit dirt, harder strata and regeneration. Do not port J2ME clocks or collision code. |
| Multi-state terrain and strata (B04–06) | Faithful principle | B: retain existing soil/compacted/gravel/hard strata, distinct damage states and gold extra hit; inspect any later balance change explicitly. |
| Varied gold veins / limited deposits (B07) | Modernize | B: finite per-cell rewards with progressive reveal; preserve current immediate credit and value IDs first. Repeated reserve extraction requires a later concrete design, not an implicit conversion. |
| Fog, clues, discovery / map items (B08) | Faithful principle / modernize | B: persistent exploration state; D: optional map consumable only if useful in testing, with original deterministic reveal behavior rather than random paid clues. |
| Authored layouts and increasing complexity (B04/B15) | Faithful principle | E: rework the three opening mines, introduce B–D mechanics gradually; future levels must be reviewed. |
| Ladder/tunnel connectivity (B09) | Modernize | A: downward cell transitions only, existing-ladder ascent, free automatic rungs. Supports are separate protective objects in C, not decorative beams or ladder proximity. |
| Unstable ground, collapse regions, supports (B10) | Faithful principle / modernize | C: deterministic instability, warnings, support protection and safe optional alternatives. Exact original probabilities remain unverified; design independent rules with fixed-tick tests. |
| Falling boulders (B10) | Modernize | C: reuse our verified real-time boulders; validate unreleased dirt enclosure and teach escape routes. Original continuous descent algorithm was not established. |
| Environmental propagation, gas/lava/ice (B11) | Modernize / mode adaptation | C: ground the environmental interactions in readable mining hazards. Original help mentions all three; exact propagation is not fully reconstructed. Implement independently specified rules, not asserted original behavior. Stage their introduction in E/F. |
| Explosives and terrain interactions (B11) | Faithful principle / modernize | C: explicit blast area, warning/preview, deterministic damage/chain order, resource tradeoff; D: useful purchasable inventory. No copying patterns/code without an independent design. |
| Enemy movement (B12) | Adapt for a specific mode | Evaluate grounded wildlife/obstruction equivalent in later F hazard design; no ghost visuals or supernatural effects. Decide exact interaction before implementation, and document exclusion if it does not improve survival choices. No silent “already deferred” omission. |
| Backpack capacity and cash-out (B07) | Modernize | Current decision: keep immediate credit, exclude mandatory hauling trips. Evaluate a capacity-based optional bonus only if route tests demonstrate a meaningful choice without repetitive returns; no fake backpack UI. |
| Stamina and exhaustion (B13) | Adapt for a specific mode | Exclude depletion/waiting from Story. Evaluate a run-specific safety/resource budget in F as one explicit survival failure rule, with no real-time recharge, purchase pressure or forced wait. Not permanent progression. |
| Shop stock/consumables (B14) | Modernize | D: small, useful tool inventory and readable prices, atomic purchases, no premium currency; preserve platform economy until a reviewed redesign. |
| Equipment upgrades (B14) | Modernize | D: claw progression plus only demonstrably useful exploration/protection effects. Preserve first-hit dirt protection; do not import backpack/boots tiers blindly. |
| Milestones, objectives, unlocks and bonuses (B15) | Faithful principle / modernize | E: sequential campaign, gold objectives, optional rewards, explicit win/fail and stage unlocks; no totem/narrative gate. F: depth-first scoring. |
| Special rewards / supernatural events (B15/B17) | Modernize / exclude theme | Optional original gold/tool rewards; exclude curses, ghosts and mystical collectibles. Grounded hazards can supply equivalent route pressure without supernatural aesthetic. |
| Failure, retry and saved progress (B13/B16) | Modernize | Story free retry/clear consequences, no permanent softlocks; F clear run end; G validated durable mode-separated saves and recovery. Exact original retry deductions remain unknown. |
| Tutorials/animation/feedback (B06/B17) | Modernize | A updates instructions; B–E contextual original cues, bounded particles and truthful UI. Do not copy dialogue or impose legacy modal friction. |
| Random authored events and PRNG (B18) | Adapt for a specific mode | F seeded deterministic section generation; no clock-seeded randomness in Core, no unreviewed dozens of story mines. |
| Loop, rendering, RMS and device controls (B01/B02/B16) | Exclude implementation / modernize function | Preserve TS/Phaser/Three and our graphics; G browser/platform lifecycle and cloud transport replace handset mechanisms. |

This inventory is a design commitment to address each system, not a claim all are necessary in all modes or currently implemented. C–F require their own concise rule designs, automated gates and documented tradeoffs before code. No source, art, maps, audio or text from the reference will ship.

## Milestone B — concrete implementation proposal

Goal: turn existing embedded ore into progressive discovery while preserving A's controls and deterministic motion. Scope is B, not shop/hazards/modes yet.

1. **Pure discovery module:** add authoritative row-major discovered-cell state with bounded dimensions. Reveal the mole's occupied cell and directly adjoining cells, with solid terrain stopping sight beyond its front cell. Use collision-resolved cell changes and excavation events, not camera position. Never hide the player. Revealing a deposit exposes its existing complete soil face and nuggets; digging, integrity and collision remain independent of visibility.
2. **Gold and terrain:** preserve existing stable ore IDs, authored values, quotas, extra hit and current stratum hardness for the first integration. Vary visual ore richness using actual value, not extra loot. Maintain exactly two ordinary-dirt hits and180-tick idle regeneration. Add a pure terrain/vein metadata helper only if it removes duplicated Core/presentation interpretation. No immediate multi-extraction/backpack conversion.
3. **Fog presentation:** render undiscovered cells as simple opaque whole-cell fronts using existing batches/materials. Discoveries change affected batches only; no per-cell dynamic lights, postprocessing or added artwork. Fog must not alter logical size, top surfaces or character bounds. Keep the dark background. Do not expose undiscovered gold through particles/HUD/production telemetry. Existing debug telemetry should remain test/development-only once platform work begins.
4. **Authored teaching pocket:** adjust First Burrow's opening so moving/digging reveals one nearby deposit and one optional gold pocket via a left/right/down route; automatic ladders provide return. Keep a free base-power quota route and optional paid platform alternative. Audit all three maps against reveal rules; preserve level IDs and record any intended reward/route changes. No concealed unavoidable boulder, new enemy or unsupported prop in B.
5. **Save boundary designed now:** define a versioned serializable attempt containing mode, content revision, tiles/integrity, loot IDs, discovered flags, processed ladder cells, ladders/platforms, player/rocks, inventory, tick/cooldowns and entry economy. Store Story unlocks/tiers/wallet separately from Endless records/run resources. Do not add storage or SDK calls to Core. Final schema and migrations depend on C–F; G owns durable transport. B tests codec-compatible values without claiming cloud saves exist.

### B acceptance gates

- Hidden deposits cannot be seen before reveal; actual excavation uncovers solid embedded ore, not floating loot or a black hole. Reveal is deterministic, idempotent, bounded and independent of viewport/renderer.
- Left/right/down mine; Up only climbs. New rungs satisfy A's downward-entry invariant. Known return paths remain usable; fog never changes collisions or creates terrain.
- Same reward is collected once, spending does not reduce quota, all powers obey existing dirt/ore rules, damage heals unchanged. Base-power free/paid/optional routes solve with unique IDs and sufficient reachable gold.
- Tests cover fog corners/strata/bedrock/occlusion/exit, repeated cell entry, simultaneous input, pauses/restarts and deterministic state restore; changing display cadence cannot alter discovery.
- Browser tests use real physical keys, mouse and touch; verify before/after reveal on portrait/landscape/desktop, climb-only Up, no lateral rung, no hidden-gold leakage, clear HUD/help and no unexpected network activity.
- Full unit suite, strict typecheck, lint, build and full browser suite pass. Inspect actual renderer captures. Record frame/GPU receipts against the current baseline before any added rendering complexity; profile a declared reference tier for later60FPS work. A workstation result is not a physical-phone claim.

### Later milestone dependencies

C adds environmental rules with known ordering and warning windows; D exposes tools/upgrades; E revises Story objectives/replay economy and gradual introduction; F introduces seeded bounded section streaming, valid routes, survival/loadouts and depth scoring; G integrates validated save transports, host suspension/audio/readiness/score and official certification checks. Endless depth best must be the same persisted value submitted through YouTube; no external leaderboard. Unknown original behaviors remain research unknowns while independent modern rules are specified and tested.

Official requirements remain those in `youtube-playables-requirements.md` (checked2026-10-23); no host SDK integration, durable progression, Endless survival or certification is claimed in A.
