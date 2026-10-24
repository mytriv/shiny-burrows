# Bonanza overhaul — Milestone A design (before code)

2026-10-23. The latest pasted overhaul request supersedes earlier four-axis excavation and upward ladder-extension rules. Implement A only; B–G remain future work.

Preserve engines, procedural art, 32px grid, 20×26 collider, fixed ticks, walking/gravity, held input, two-hit dirt, ore extra hit, hardness, regeneration, platforms/drop-through, free restart and campaign economy. No new dependencies.

Replace upward excavation with a Core-level rejection, including direct digging APIs; Up remains available for existing-ladder climbing. Remove `upwardOpening` and its climbing/ladder-extension paths. Keep cosmetic upward poses only as historical art coverage, never triggered by gameplay.

Replace body-overlap backfill with feet-cell downward transitions: logical cell is `(floor(x/32), floor((feetY-epsilon)/32))`. Only crossing a lower row authorizes that newly entered cell. Horizontal crossings, same-row descent, ascent and idle authorize nothing. Record processed downward cells per attempt, including blocked candidates, so repeats cannot create a later rung. Enumerate every row of long resolved downward segments; no geometry-based proximity inference. A shaft's first rung lies below its bank; climbing to that rung's top returns feet to bank height, without creating a rung above it. Restart clears this record. Existing platform/solid/loot/boulder occupancy exclusions remain.

Browser validation exposed a necessary dismount detail: at bank height, immediately restoring gravity on horizontal release caused the mole to fall before reaching the bank. The top of an existing ladder column therefore supplies a one-way foothold at its exact grid top. It permits stepping onto the bank, creates no extra ladder/platform entity, and Down explicitly bypasses it. Falls already below that top are never caught. Other rungs remain nonsolid. This is covered by a real First Burrow return-and-dismount regression and separate descent/fall checks. Top detection uses a linear per-column scan.

An existing one-way platform directly above the shaft remains a climbable connector to its own top, including contiguous platform connectors. This preserves the prior platform-drop return path without adding a rung in an occupied platform cell or excavating upward. Exact lower-rung counts in old browser assertions are replaced with the newly entered rows; solid-ceiling/no-Up-mining assertions replace obsolete upward excavation tests. Superseded tests are retained in `archive/overhaul-a/`; the active suite does not skip failing old behavior.

Tests first demonstrate lateral exit/same-cell gravity backfill and upward excavation; cover downward transitions, diagonal resolved paths, junctions, landing, collision repeats, reversal, blocked cells, regeneration, all input modes and existing campaign routes. Supersede obsolete Up-mining assertions with no-Up-mining regressions. Historical exact-state visual replay hashes necessarily change; preserve the old baseline as history, replace obsolete source-byte freezing with meaningful purity/route checks for the new mechanics.

Validate relevant tests after each edit, then full unit tests, typecheck, lint, production build and browser suite. Inspect portrait/landscape captures. Document actual results and any remaining verification limits in root status. No host SDK or rendering-complexity changes in A; current ~30FPS receipts remain baseline, not a new performance claim.

Early future schema boundary: processed ladder cells are authoritative attempt state, so include them in future save round trips and Endless section-local state. Core must never read storage/SDK APIs. Milestone B design will explicitly separate discovered state from collisions and from visual fog.
