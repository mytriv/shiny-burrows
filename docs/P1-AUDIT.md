# P1 audit and implementation plan — before source changes

Authoritative request: pasted P1 Gameplay Refinement & Mining Experience, copied to `docs/SDD-P1.md`. Read v0.2, status, P0 guide and current physics/gameplay/render/input/level modules before edits. Preserve exact dependencies and Phaser 3.90.0; no new dependencies.

| Module | Treatment and reason |
| --- | --- |
| constants/world/motion, 60Hz simulation API and controller | Preserve; keep fixed stepping and axis microsteps, expand regression tests |
| levels/model/mining | Extend ore concealment, nearby hints, quota event/medal and serializable bridge inventory; keep unique loot IDs |
| bridges | Separate Buy (5 coins -> one inventory kit) from Place (one kit + 1 energy -> one cell); no placement charge; invalid actions leave all resources unchanged |
| boulders | Extend existing ordered substeps: positive fall distance breaks only fragile tiles, each tile/impact emits once; solid terrain and rocks still stop descent; bridges remain ignored |
| first-burrow | Replace overly open layout with one dense 24×20 handcrafted mine. Retain home, starting gold, low-ceiling two-bridge crossing; add ore pockets, layers/caverns, long excavated free route, optional tunnel/secret and rock/fragile puzzle |
| LevelScene | Modify rendering/cache rather than replace engine: pure testable camera helper, descent look-ahead, cached concealed/revealed ore, event feedback, compact native HUD |
| BrowserInput | Preserve held directions, edges and multi-pointer logic; add B/Buy independent of E/Use construction; all other keys preserved |
| art/tooling/licenses | Preserve; add simple procedural dust/impact/reward indicators and concealed-ore texture, no final art/audio/assets |
| tests | Preserve physics/unit coverage; update bridge tests for explicitly superseded economy, replace route/browser scripts for dense level and extend chains/camera/accounting coverage |

## Rules decided before implementation

- Every extracted ore or claimed gem/secret adds its integer value to BOTH level treasure and wallet, once per unique source in the run. Spending changes wallet/spent only. Restart creates a fresh run, restoring source tiles and zeroing score/wallet/inventory to authored defaults, never accumulating across runs.
- Buy bridge (B/Buy): 5 wallet coins, +1 kit, no energy. Place bridge (E/Use with Bridge selected): validate geometry/support/occupancy and kit availability first, then -1 kit and -1 energy. Purchasing is intentionally independent of target validity; invalid purchase/placement costs nothing. Buy is an explicit in-level fictional transaction, not a shop/progression system.
- Dig costs 1 energy; placement costs 1. Walking/jumping/tool switching/purchasing cost 0. Idle never drains energy. At zero energy tools reject; movement, exit and Restart remain available. Initial authored energy increases to 60 for meaningful excavation; route scripts must prove sufficient resources.
- Rocks break ONLY fragile terrain after positive downward travel since the current release. Impact consumes the current microstep and descent continues on later ticks. Dirt/ore/stone/bedrock do not break and cannot lose loot. Bottom-first, left-first, ID tie order remains; stable contact does not repeatedly emit impacts. Rest resets fall-distance history.
- Hidden ore is still authored ore, rendered as a sparse gold fleck until excavation exposes an adjacent face or the mole is nearby. A short non-directional proximity hint suggests treasure without revealing coordinates/solutions. Medal is based on level treasure, independent of spending.
- Camera is presentation-only: pure configuration/bounds/coordinate functions under app; smooth scroll with downward look-ahead, safe-region clamps, level bounds. Desktop gameplay frame capped in CSS; viewport resizing never changes collision geometry or state.

## Validation plan

Run core tests/typecheck/lint during implementation. Record paid/free/secret tick input scripts and outcome/resource assertions. Verify supported rocks, multi-block fragile falls, chained/stacked impacts, no repeated events/payouts, one-way bridge support, energy depletion and restart. Add pure camera bounds/target mapping tests. Build and play via real browser input at 390×844, 844×390, 1920×1080; verify keyboard and touch/mouse, camera descent, pointer mapping after scrolling, paid/free wins and failure/restart. Inspect screenshots and record actual totals; no M3/M4 work.
