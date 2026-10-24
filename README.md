# Shiny Burrows — Milestone B.5

[Play in your browser](https://mytriv.github.io/shiny-burrows/) · [GitHub repository](https://github.com/mytriv/shiny-burrows)

GitHub Pages builds and publishes `main` automatically after unit tests, typecheck, lint and production build. Deployment details: [GITHUB-PAGES](docs/GITHUB-PAGES.md).

Current gameplay authority: [B.5 controls and presentation](docs/MILESTONE-B5-REQUEST.md), [B discovery](docs/MILESTONE-B-REQUEST.md) and the preserved [overhaul rules](docs/SDD-OVERHAUL.md). Migration decisions: [MILESTONE-B5](docs/MILESTONE-B5.md). C–G gameplay expansion is deferred; current validation and limitations are in [implementation status](IMPLEMENTATION_STATUS.md).

A small family-friendly excavation adventure. Step between square cells, auto-dig left, right and down, return on automatic ladders, collect gold and buy claw upgrades between three handcrafted mines. Independent deterministic TypeScript Core; Three.js 0.180.0 renders an orthographic volumetric world, Phaser 3.90.0 runs lifecycle/timing, and DOM controls handle input/UI. No jump, energy, precision aiming, enemies or crafting. A WebGL 2 browser is required.

v0.6.1 follows `StyleReference2.png`: warm sculpted square earth, gold partially embedded in a shallow soil pocket, lavender square stone, separate round faceted boulders, a helmeted mole and copper/red tactile UI. Block depth is 22px with a compensated 20° camera; cells remain 32×32 and the mole remains within 20×26. The background is dark and simple, with no hills, plants, structural beams or decorative crystals. Runtime art is original procedural geometry/textures; natural claws and real gameplay values are preserved.

The three current campaign maps contain no boulders. Their existing Core mechanics and warning/fall/impact presentation are validated in an isolated QA scene, not by adding hazards to the campaign. See `docs/MIGRATION-v0.6.1.md`, `docs/VISUAL_REVIEW-v0.6.1.md` and `IMPLEMENTATION_STATUS.md` for evidence and limitations.

## Play locally without installing Node on this workstation

The Codex bundled runtime and installed project dependencies are already available:

```powershell
cd E:\LightPathfinder\shiny-burrows
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules/vite/bin/vite.js preview --host 127.0.0.1
```

Open the local address printed by Vite (usually http://127.0.0.1:4173). Keep the terminal running. The production build includes all assets; it requires an HTTP server rather than double-clicking index.html. On another machine, a static host can serve the entire dist directory; players only need a browser.

For development on another workstation: Node 22.12+ with npm, then npm ci and npm run dev. Package pins and lockfile are preserved.

## Controls

- Tap physical **A/D or Left/Right** for one adjacent cell; hold to repeat at 200ms per cell. Empty reachable cells move; solid neighbors are mined while the mole stays in its cell. Release queues no extra step; the already committed step finishes smoothly.
- Hold **S or Down** to dig the adjacent floor or descend an existing ladder. A fresh Down press drops through a platform; stacked platforms require another press. No separate Dig key/button.
- Hold **W or Up** to climb existing ladders. Up never digs or creates a ladder.
- Ladders appear only when descending into a new feet cell, once per cell per attempt; lateral movement, ascent and same-cell falls never create rungs. Release or reverse to interrupt mining. Soil requires two hits; harder strata require 3/3/5 at base power. Upgrades never reduce terrain below two hits. Gold blocks take **one additional hit** at every power tier. Strikes are 24 simulation ticks / 400ms apart; partial damage heals after 180 idle ticks.
- Entering a new lower feet cell can add a free ladder, including natural falls and platform drops; occupied cells are skipped and each cell is processed once per attempt. Hold Up/Down to grab and climb existing ladders; release to stay exactly in place. Grip persists during blocked horizontal mining and supported sidesteps; actual movement beyond ladder support releases it. A fresh Down press still drops through platforms. Natural falls continue until you grab a ladder. Upward movement never excavates or adds rungs.
- **B / Buy**: 5 coins for one platform. **E / Platform**: place one adjacent to the facing bank at foot level. Press/release Down for each intentional stacked-platform drop.
- **Esc / Pause**, **R / Restart**. Physical key codes work regardless of the character produced by the active language layout.
- **♪** mutes/unmutes short synthesized feedback. Audio starts only after keyboard/pointer interaction; reduced-motion preference limits particles and animation.
- **⚙ Settings and help** shows controls and pauses the mine. Back to mine / Escape restores its previous play/pause state. The progress bar is the actual level gold goal, not XP or energy.
- Mouse/touch: hold one of the **four direction buttons**. Buy and Platform remain separate. Simultaneous touch pointers are supported. J/X/Space no longer perform gameplay mining.

Gold contributes to both level goal and spendable wallet once. Platform purchases do not reduce goal progress. Reach the green exit with enough gold to finish. The surface station shows Claw power 2 for 8 coins and power 3 for 20 coins. Next mine carries wallet and upgrades; upgrades are optional. Only finished mines commit income. Restart discards the current attempt's income/purchases, preventing retry farming. New Adventure resets the campaign; refreshing also resets it. No disk save. Internal versioned pickaxe field names remain unchanged for compatibility.

## Validation

Use npm test, npm run typecheck, npm run lint, npm run build and npm run test:browser. Alternatively run the local CLI files with the bundled Node executable:

```text
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src tests
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test
```

Browser tests serve production output on port 4187, leaving ordinary preview port 4173 available. Build first. Chromium must be available to Playwright. Tests use real input with read-only inspection datasets; they never inject gameplay state. Generated screenshots go to test-results. Core rules, automatic ladders, platforms, campaign and retries are tested headlessly. ESLint restricts engine, DOM, clock, network and random dependencies in Core.

Visual specification: docs/SDD-v0.5.md; pre-code plan and preserved mechanics: docs/MIGRATION-v0.5.md. Controls/mining baseline: docs/SDD-V3-G.md plus subsequent user corrections in docs/DECISIONS-V3-G.md. Actual gates, screenshots, temporal samples and remaining limitations: IMPLEMENTATION_STATUS.md. Prior presentation is archived under archive/v0.5-migration. Original geometry, icons, audio and dependency notices: ASSET_LICENSES.md. No external assets load during play.

Milestone B: unexplored cells stay concealed until movement or excavation exposes them through nearby open tunnels. Discoveries persist until restart. Embedded flecks in warm soil hint at real nearby deposits; larger visible deposits carry more gold. There is no backpack or cash-out trip.

B.5 preserves one-cell authoritative occupancy with 200ms walking/climbing and 100ms falling steps; only presentation interpolates. There are no fractional resting cells or air steering. Up climbs connected rungs/bank connectors only. An explicit drop pressed during a step is buffered once to the boundary; pause clears that uncommitted request. Fog edges are visually feathered without changing discovery. Rounder clay, expressive facial detail and thicker warm UI remain original procedural graphics. Historical software-renderer limits remain documented; no new C gameplay is included.
