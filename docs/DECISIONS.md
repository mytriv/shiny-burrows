# M0/M1 decisions

Current P1 audit/decisions are in [P1-AUDIT.md](P1-AUDIT.md); implemented rules and outcomes are in [P1-PLAY-GUIDE.md](P1-PLAY-GUIDE.md). P0/v0.1 details below are historical where superseded.

For the current platformer architecture, see [MIGRATION-v0.2.md](MIGRATION-v0.2.md) and [P0-PLAY-GUIDE.md](P0-PLAY-GUIDE.md). The decisions below are historical where superseded by SDD v0.2.

1. The supplied `Shiny_Burrows_SDD_v0.1.md` is copied verbatim to `docs/SDD.md`; no pre-existing workspace `docs/SDD.md` was present.
2. Use Phaser 3.90.0, confirmed with the official release and versioned API docs on 2026-10-20. Keep all simulation in internal TypeScript modules, with no physics engine. Browser APIs occur only in presentation/tests.
3. Store immutable level metadata in state so the reducer can resolve boundaries, thresholds and restart without hidden global context. Session history keeps the last 50 full pre-action states (above the required ten). Invalid commands retain the original session.
4. Track falling boulders by their current indices in a cascade-local set. Bottom-to-top traversal prevents any boulder from moving twice per substep. Breaking fragile consumes a substep; movement follows on the next. Fall history resets each turn. On collision, terminate immediately with `stuck` before moving the rock onto the player.
5. Gems, exits and secrets support boulders. Exits and secret markers remain in the grid when visited. Digging/collection clears only the collectible tile. Treasure metadata `data.value` must be a non-negative integer; defaults are gold 1, gem 3.
6. Resolve each action synchronously, then replay chronological events with an input lock. Warning outlines occur before rock motion. Reduced-motion preference removes delays. Pause is application state, while core state and history stay unchanged.
7. Include one complete sample level with two validated solutions and a safe demonstration cascade away from the starting route. Ten levels, persistent progression, audio, main menu and platform stores are deferred to their specified later milestones.
8. All dependencies are exact pins and npm lockfile is provided. Vitest runs in Node by default; Playwright is used only for browser smoke tests. ESLint enforces core dependency/browser restrictions. The full Phaser bundle currently triggers Vite's advisory chunk-size warning; defer bundle trimming until measured optimization work.

9. Visual direction update (2026-10-20): original retro casual 2D sprites inspired by Java-era mobile games. Generate 24×24 textures once from integer-aligned flat color clusters; use nearest-neighbor scaling and distinct shapes/patterns for each tile. No painterly imagery, cinematic/3D treatment, downloaded assets, glow effects or added dependencies. Use compact monospace HUD text, warm beveled buttons, a helmeted mole with pink snout/scarf, bright cyan faceted gems, gold nuggets, masonry bedrock, chunky slate boulders, cracked tan floors, green exit doors and violet question-mark passages. Core/gameplay is unchanged.
