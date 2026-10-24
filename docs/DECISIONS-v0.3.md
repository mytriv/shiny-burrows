# v0.3 migration decisions — before code changes

Authoritative source: `docs/SDD-v0.3.md`, copied from the supplied file. Audited previous specifications, current status, Core motion/mining/terrain/ore/platform/rock modules, controller, input, renderer, camera and tests. No dependency changes planned; retain Phaser 3.90.0 and strict TS/Vite/Vitest/ESLint/Playwright.

| Existing feature/module | Treatment |
| --- | --- |
| 60Hz accumulator, AABB collision/microsteps, world helpers, camera bounds | Preserve and adapt; no engine rewrite |
| Jump impulse / Space/W jump / Jump UI | Remove; Up/W means ladder climbing only |
| I/K aiming, pointer-target mining, Claws/Bridge toolbar | Remove; horizontal facing dig plus the specified Down+Dig context exception |
| Single-hit terrain | Replace with data-driven integrity/power and 180-idle-tick regeneration; destroyed tiles never regrow |
| Per-action energy | Remove from state, rules and HUD; walking/digging/climbing are free |
| Bridge inventory / one-way tops | Replace names with platforms, keep atomic purchase and one-cell support, add intentional edge-triggered drop-through |
| P1 secret/lore markers, medals, one large level | Replace with three short descending authored levels and ordinary bonus gold/gems; no mysterious content |
| Ore payout IDs, rock hazards/fragile behavior | Preserve compatible deterministic logic and once-only rewards |
| Controller lifecycle | Extend with Core-owned in-memory campaign and surface pickaxe upgrade transactions |
| Procedural pixel sprites / technical HUD | Replace with original higher-resolution rounded/faceted cartoon textures and walk/dig loops; preserve local-only generation and renderer separation |
| Prior tests | Add new parity tests before archiving superseded files; keep collision/rock/determinism coverage, replace jump/energy/aim/old level assertions explicitly |

## Mechanics decisions

- Horizontal input immediately sets facing, even if a wall prevents displacement. Hold J/X/Space or Dig to strike on a fixed 12-tick cadence. Down/S + Dig while standing on diggable floor targets immediately below; Down alone never mines. This is the v0.3 explicit context action, not a separate aiming tool.
- Soft/compacted/gravel/hard terrain defaults: 1/2/3/5 integrity, configurable in `core/config.ts`. Power = 1 + pickaxe tier (tiers 0–2). Successful hits subtract power; hits-to-break = ceil(integrity/power). Partial blocks heal to full after 180 simulation ticks without a hit; game pause freezes both damage timers and physics. No energy system.
- Down excavation installs a ladder in the removed floor cell AND the empty body/anchor cell above, so a return to the original bank is possible. Ladders are overlays, never solids. Active shafts may extend only through contiguous empty same-column cells attached to an existing segment; leaving the column ends extension, and unrelated caverns get no free ladders. Reentry can use existing ladders. Up/Down climbs at 72px/s within a 12px center tolerance, using existing collision resolution; idle on a ladder still falls.
- Platforms remain one-way tops. B/Buy spends 5 coins for one platform; E/Platform context places one inventory item at the adjacent facing foot-level empty cell. No cursor targeting required and no energy charge. Down press while supported by a platform suppresses that specific top until the whole body is below; holding Down does not automatically drop through stacked platforms. A platform drop takes priority over nearby ladders.
- Every ore/gem adds authored value once to level gold and run wallet. Run Restart restores the entry wallet/power and all terrain/resources, discarding uncommitted income/purchases. Only finishing a new level commits its wallet once. No replay of completed levels within a campaign; New Adventure resets wallet/upgrades/completions together. This prevents retry farming. No disk save or platform SDK.
- Between levels, surface menu offers Pickaxe Power only: prices 8 then 20 coins, powers 2 then 3. No mandatory purchase; every level must remain solvable with base power. Three independently authored layouts increase integrity and payout. No movement upgrade, crafting, enemies or narrative systems.

## Ordered acceptance gates

V3-A: no-jump and stable support/free-fall tests first. V3-B: integrity/heal/facing/down dig and connected ladder/climb tests plus actual browser shaft descent/ascent. V3-C: platform purchase/crossing/drop/no-snapback/stack and free-route scripts. V3-D: three no-jump level solutions, upgrade/campaign/retry economy tests and real progression. V3-E: dimensional procedural art, contextual HUD, three inspected viewport screenshots and final full suite/typecheck/lint/build/browser run. Record observed results before proceeding through each gate.

Mouse accessibility: right-click and hold Dig maps to the same Down+Dig context intent, so mouse-only downward excavation does not require two pointer buttons. This adds no aiming mode or new Core rule. Touch keeps simultaneous Down and Dig; left-click still mines facing.
