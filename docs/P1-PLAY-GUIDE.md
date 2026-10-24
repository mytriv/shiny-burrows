# First Burrow — P1 mining experience

The current single handcrafted mine follows `SDD-P1.md`; this guide supersedes P0 economy/route details. Tiles remain 32 world pixels, and gameplay remains fixed at 60Hz in independent TypeScript.

## Controls

| Action | Keyboard | Mouse/touch |
| --- | --- | --- |
| Move | Hold A/D or left/right | Hold ◀/▶ |
| Jump | Press Space/W/up; grounded only | Jump |
| Mine | J/X | Claws, then Dig |
| Aim | Facing by default; I up, K down; moving restores facing aim | Tap/drag a nearby block, or Aim ↑/↓ |
| Select tool | 1 Claws / 2 Bridge | Claws / Bridge |
| Buy one kit | B; 5 coins | Buy ▰ 5● |
| Construct one cell | E; requires kit and legal target | Bridge, choose gap, then Place |
| Pause / reset | Escape / R | Pause / Restart in the header |

Jump, mining, buying and placement use press edges (no automatic key repeat). Dig cooldown is 0.15s. Movement is held; separate touch pointers allow movement and actions together. Pointer cancellation and focus loss release holds; blur pauses the simulation. Target outlines and readable reasons explain legal/illegal actions.

## Treasure, inventory and energy rules

Every unique ore source is paid **on excavation**, not by walking past it. Each gem/secret pays on physical overlap. Its authored integer value is added once to **both level treasure and wallet**. Buying never reduces level treasure. Quota is 16; enter the green exit after reaching it. Completion medal: bronze at quota, silver at quota+3, gold at quota+9. Medals are per-run evaluation only; there is no persistence/progression.

Buying and construction are separate:

1. Buy spends **5 coins**, adds **one bridge kit**, costs **zero energy**, and never builds terrain. Purchasing does not require a valid placement target.
2. Place validates an adjacent empty foot-level gap, real bank support, no body/rock/terrain/exit overlap, an available kit and energy. Success consumes **one kit + one energy**, builds exactly one tile-width of one-way support, and charges **no coins**. Rejected placement changes none of these resources. Duplicate placement cannot consume a second kit.

Mining costs **one energy** per removed soil/ore tile. Walking, jumping, aiming, selecting tools and idle time cost zero. The level starts with **60 energy**, no coins and no kits. Zero energy blocks tools but leaves movement, completion and Restart available; there is no hunger timer or automatic unwinnability detection. Restart fully restores the authored terrain/rocks and resets score, wallet, inventory, energy, secrets and claimed IDs to a new run. Rewards never carry over or compound across restarts.

## Level and tested routes

The mine is 24×20 cells with home at the surface, soil layers, stone strata, small natural caverns and ore pockets. The initial underground region (columns 1–22, rows 5–15) is **192/242 = 79.3% solid**. Rectangles/pockets are manually authored, not procedurally generated. Distinct stone strata require excavation around structural barriers. Most travel underground requires digging.

- **Paid route:** mine the visible (3,4) pocket for 10 coins. Buy two kits (B twice). Walk to column 7, place (8,5), walk onto it, then place (9,5). Follow the upper gallery to (18,4), extract its 6 gold, then descend at column 20 by digging rows 5–14. Mine (21,15) and enter the green exit (22,15). Outcome: **16 treasure, 10 spent, 6 coins remaining, 0 kits, 45 energy**, bronze. Saves excavation/time/energy. Each bridge covers one cell; the crossing requires two purchases and two construction actions. Low ceiling and two-cell opening prevent unbridged jump bypass.
- **Free mining route:** mine starting gold, dig down column 5 through rows 5–12. Excavate row 12 soil at columns 6,7,8,9,13,14,15; (8,12) is a concealed 6-gold vein. The little cavern around column 11 contains a gem worth 3. Descend at column 18 through rows 13–14, mine (19,15) and (21,15), and reach the same exit. Outcome: **19 treasure, 0 spent, 19 coins, 0 bridges, 40 energy**, silver. Longer and more excavation, with extra treasure and access to lateral branches. Both routes work from identical initial state and have asserted tick-stream and real browser wins.
- **Secret / boulder puzzle:** while descending column 5, stop at feet y=384 before mining (5,12). From the right bank, face left and mine the rock's supporting soil at (4,11). Wait for the warning/fall. The rock breaks fragile (4,12) and lands one layer lower: it blocks the lower cell and opens the approach above. Walk left into the violet chamber at (2,12) for 3 secret treasure, then jump back over the settled one-cell rock and return to the shaft. Advancing under the released rock too early causes a recoverable crush. Browser QA verifies both failure/restart and the safe solution.
- **Optional side tunnel:** from the free tunnel near column 14, dig overhead soil (14,11), jump and mine the vein (14,10) for 8 extra treasure. With the secret and tunnel gem, the tested full run earns **30 treasure**, no spending, and a **gold** medal. Other lateral ore pockets offer optional exploration; hints never disclose a complete route.

## Discoveries and hazards

Ordinary soil, ore soil and cyan gem use different textures/shapes. Concealed ore starts as sparse flecks, becoming clear when nearby or exposed by an adjacent excavated cell. A short proximity glint hint has no direction/coordinate disclosure. Mining emits dust, extraction floats its value, quota/secret/completion have short indicators, bridge construction gives plank feedback and invalid actions give readable messages. Reduced-motion preference suppresses particles/camera smoothing, not simulation motion.

Rocks remain solid from the sides and ignore one-way bridges. Unsupported rocks warn for 12 ticks, then fall with bounded <=4px motion substeps. Only fragile tiles break after positive fall distance in the current release; each break and impact emits once. A rock initially resting directly on fragile does not smash it. Soil, ore, stone, bedrock and other rocks stop falls without deleting treasure. Rest clears impact momentum. Updates are bottom-to-top, left-to-right, then stable ID. Multi-tile breaks and stacked falls have deterministic test fixtures.

## Camera and presentation

Desktop has a maximum 1100×960 CSS-pixel game frame rather than fitting/stretches of the entire map. Mobile uses available width and readable >=48px tiles. Camera configuration, safe-zone bounds, descent look-ahead and pointer transforms are pure testable functions in `src/app/camera.ts`; no camera data feeds gameplay. Follow scroll is smooth with more space below the mole when falling, clamped to the level. ResizeObserver fits the backing canvas after layout changes. Native compact HUD/controls stay outside the canvas, with >=44px targets, focus outlines, selected-tool indication and text feedback alongside colors/icons.

## Remaining scope

One level, original procedural placeholders, no new dependencies or runtime network. No campaign, procedural generation, final art, audio, NPCs, enemies, crafting, persistence, platform SDK, advertisements or monetization. Supports/explosives stay disabled interfaces. Chromium covers desktop/emulated touch; physical-device, Firefox and Safari QA are still not claimed. The full Phaser bundle retains Vite's advisory large-chunk warning. No frame Undo or coyote time; Restart is always available.
