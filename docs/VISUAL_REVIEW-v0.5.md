# v0.5 visual review

Target: user-supplied `../StyleReference.png`. Runtime screenshots in `screenshots/v0.5/` come from the production build with real keyboard/pointer gameplay. Temporal sheets only arrange captured frames; no generated art or injected Core state substitutes for evidence.

## Comparison to the supplied concept

| Reference feature | Implementation and review evidence |
| --- | --- |
| Rounded terracotta blocks with fine grain and embedded fragments | Shared sculpted block variants, smooth bevel normals, deterministic clay color/normal grain, irregular stones, pits and shallow fissures. `g-fall-390x844.png` exposes adjacent tiles and a damaged block. |
| Visible top ledges with grounded feet | Compensated 20° elevation, 16px block depth, presentation-only character grounding. Surface and walking contexts show the mole on exposed soil; frontal grid remains square. |
| Purple rocky strata | Purple/gray material palette, larger angular central rock and smaller fragments; existing three authored mines retain their terrain identities. |
| Dark carved cavities and wooden ladder shafts | Warm dark backing, edge contact strips and raised foreground blocks. All three `g-fall-*` captures show an excavated shaft and the automatic ladder. |
| Large luminous gold inside dark squares | Three faceted nuggets per deposit, dark recess, warm rim/emission and small local halo. Surface screenshots show the first deposit; collection emits bounded sparkle. No screen-wide bloom. |
| Cute helmeted directional mole | Original articulated plump mole, orange helmet/lamp, nose, eyes, whiskers and natural claws. Both walking sheets show alternating feet, opposing arms and body/head motion. Four dig sheets show impact, recoil, return and continuation toward another hit. |
| Dark rounded status panels | Nugget/wallet at left, depth in a dark central pill, claw tier/settings at right; real gold-goal progress below. Rounded tactile controls share the burgundy/brown palette. No fabricated XP/energy or pickaxe equipment. |

The runtime uses low-poly procedural models and a deliberately limited local rendering budget; it is not a pixel reproduction of the concept illustration. The existing mine layouts and square collision grid are preserved rather than rearranged to reproduce the reference composition. Its pickaxe is replaced by the explicitly required natural claws. Source geometry, icons and three small data textures are original; reference pixels are not shipped.

## Capture inventory

- `v5-surface-390x844.png`, `v5-surface-844x390.png`, `v5-surface-1920x1080.png`: full layouts, exposed ground, mole, embedded gold and HUD.
- `g-fall-390x844.png`, `g-fall-844x390.png`, `g-fall-1920x1080.png`: depth, excavated cavities, ladders and return path.
- `v5-claw-impact.png`: authoritative first-hit cracks and debris before regeneration.
- `walk-left-sheet.png`, `walk-right-sheet.png`: six distinct actual temporal frames each, with individual PNGs and pose/tick receipts.
- `dig-left-sheet.png`, `dig-right-sheet.png`, `dig-up-sheet.png`, `dig-down-sheet.png`: ten temporal frames per direction, including a full strike interval and subsequent impact/recoil. The first captured frame is at an actual mining impact; the following frames reveal preparation for the next hit.
- `walk-*-context.png`, `dig-*-context.png`: full viewport context for each animation capture.
- `budget-*.json`: projection, instance/resource counts, CPU render submission and RAF frame intervals at each viewport size.
- `v5-amber-hollow.png`, `v5-golden-depths.png`: the preserved deeper material palettes and progression HUD.

Final review: all six temporal sheets and required viewport/context views inspected after the combined 34-case production run passed. Capture timing starts paused before Phaser boots; the route and poses advance through real input and ordinary simulation ticks. The 82 retained files include 52 individual temporal frames, six pose receipts, six contact sheets and full-context/layout/performance evidence.

Performance figures describe this workstation's Chromium runs. Physical phones and other browser engines have not been tested. No general 60fps claim is inferred from emulated mobile viewports.
