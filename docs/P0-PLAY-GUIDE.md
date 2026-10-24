# First Burrow — platformer P0

**Historical P0 guide.** The current P1 level, purchase/inventory rules and controls are documented in [P1-PLAY-GUIDE.md](P1-PLAY-GUIDE.md).

The active game is SDD v0.2. The old tile-step/Undo puzzle is archived; its controls do not apply.

## Exact controls

| Action | Keyboard | Mouse/touch |
| --- | --- | --- |
| Move | Hold A/D or left/right arrows | Hold ◀/▶; independent pointer IDs permit simultaneous actions |
| Jump | Press Space, W or up arrow | Tap Jump; release/repress for another grounded jump |
| Aim dig | Facing by default; I aims up, K aims down; moving left/right restores facing aim | Tap/drag on a nearby tile, or Aim ↑/Aim ↓; movement buttons restore facing aim |
| Mine | Press J or X | Select Claws, then Use |
| Select tool | 1 Claws, 2 Bridge | Tap Claws/Bridge |
| Place bridge | E (also selects Bridge) | Select Bridge, tap a nearby foot-level cell or use the default facing target, then Use |
| Pause/resume | Escape | Pause |
| Restart | R | Restart |

Actions are edges: holding a dig/jump/place key does not auto-repeat. Dig cooldown is nine 60Hz ticks (0.15s). Only horizontal movement is held. Target outline plus text shows valid/invalid reason; Bridge ghost shows one-cell span, and the HUD shows cost and wallet before confirmation. J/X always mines even if Bridge was selected; E always attempts a bridge. There is no Undo.

Successful mining costs 1 energy; successful bridge costs **5 coins and 1 energy**. Invalid actions cost nothing. Idle/walking/jumping cost no energy. At zero energy tools reject, but movement/exit remain available; restart if the route is blocked. Coins are fictional in-level loot, with no real-money transactions. Gold/Quota, Wallet and Spent are separate: buying never reduces quota progress.

## Verified routes

Coordinates below are tile (column,row), zero-based. The mole starts at feet (80,160) world pixels. Tiles are 32px square.

- **Paid: two one-cell bridges.** Mine the visible pocket at (3,4), earning 10 coins and meeting the quota. Walk right to the bank in column 7. Place one bridge at (8,5), walk onto it, then separately buy/place a second at (9,5). Continue right; drop naturally at the far end into the lower exit at (22,8). Collected 10, spent 10, wallet 0, energy used 3. The bridge item never spans two cells in a single purchase.
- **Free alternative.** Mine the starting gold, then walk to the soil hatch at (5,5), aim down and dig. Fall to the lower tunnel. Mine the three soil cells (6,8), (7,8), (8,8). Jump the one-block stone ledge at (12,8), collect the optional cyan gem at (16,8), and walk to the same exit. Collected 13, spent 0, wallet 13, energy used 5. Headless replay verifies this route takes more ticks than the paid route. The extra gem is not required for the quota.
- **Optional secret.** From the lower hatch, face left and mine (4,8) from the safe right bank. Observe the amber warning and falling rock; wait for it to land. Jump left over it and the adjacent soil shelf into the violet nook at (2,8). The secret pays 3 once. Jump back over the shelf/rock, then use the free route. With the tunnel gem: collected/wallet 16, spent 0, energy used 6.
- **Failure/replay.** Entering the rock column while it is released can crush the mole. Feedback is a gentle retry prompt. Restart restores all terrain, player, rock, coins, quota progress, energy, bridges and secret state. The required routes do not force the hazard.

The low-ceiling crossing is **two cells wide**, intentionally requiring two one-cell purchases. A single low-ceiling one-cell hole still permits a last-edge jump with the canonical 20px collider; the specification explicitly permits the named multi-bridge geometry. Automated tests sample launch positions at 0.5px intervals and show this two-cell crossing cannot be jumped unbridged. A separate core fixture verifies one purchased tile supports walking across exactly one one-cell gap.

## Architecture and scope

Core owns 60Hz motion, gravity, X-then-Y collision with <=4px microsteps, digging, one-way bridge tops, integer accounting, loot/secret IDs, exit overlap and rocks. Rocks use 32×32 AABBs; they are solid from the sides, ignore bridges and stop on terrain. A 12-tick warning precedes descent. Rocks advance bottom-to-top then left-to-right with ID as tie breaker. Both player and rocks use bounded motion substeps, not a rigid-body engine.

Phaser renders only/interpolates snapshots and maps world pointer targeting. The browser adapter maps held keys and pointer IDs; native accessible HUD/buttons occupy separate layout rows outside the canvas. They have >=44 CSS-pixel targets. ResizeObserver synchronizes canvas backing size after HUD/orientation changes; rendering changes never feed physics. The camera follows the interpolated sprite and clamps to world bounds; restart snaps back. Reduced-motion preference disables camera smoothing without changing rules/speed.

Only First Burrow is bundled. Motion/excavation fixtures are in `tests/fixtures/`; v0.1 modules and all 58 superseded tests remain in `archive/v0.1/`, explicitly excluded by the existing src/tests globs. Earlier browser gate scripts are retained in `archive/gates/`. See `MIGRATION-v0.2.md` for coverage mapping.

Not implemented in P0: coyote time (optional), automatic unwinnable-route detection, frame undo/checkpoints, fragile crushing chains, supports/explosives (type contracts only), additional levels, persistence, shops, audio/final art, YouTube integration. Chromium is automated; Safari/Firefox and physical device QA are later work. Gameplay assets require no internet after local delivery; there is no service worker.
