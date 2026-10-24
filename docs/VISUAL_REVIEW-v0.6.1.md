# v0.6.1 reference and geometry review

Reference: root `StyleReference2.png`, SHA-256 `826A49927D200060DD61B99A480DC5A7B6C0671A020CBD7A39E1F1B74C988746`. Its warm orange sculpted earth, lavender stone, round separate rocks, embedded bright gold, orange helmet, natural claws and red/copper rounded UI guide this pass. Reference pixels are not used as runtime art. Geometric requirements take precedence over illustrative exaggeration.

| Required correction | Evidence |
| --- | --- |
| Square aligned terrain and full-cell tunnels | All four soil/stone mass variants and four ore variants retain exact 32×32 XY bounds; 22px Z depth. Compensated orthographic projection preserves equal row/column spacing. Empty cells and collisions remain from the unchanged Core. |
| One-cell mole | Full visible model, including helmet, whiskers, nose and animated paws, remains inside the existing stricter 20×26 envelope; 100-tick pose sampling and browser metrics. Global zoom changes every tile and character together. |
| Embedded gold | Complete opaque soil sides/back and front bank; only the front face is subdivided into a 2.6px-deep continuous bowl. Five partially embedded faceted nuggets intersect the surface, surrounded by warm darker soil. No black inset rectangle or frame mesh. All gold-bearing cells use earth colors, while Core stratum/hardness and the extra hit remain unchanged. |
| Remove extraneous decoration | Single simple dark backing. Sky, hills and structural beams removed; no plants, lanterns or crystal props. Existing functional exit becomes a small painted direction marker. No collectible types or props added. |
| Round falling rocks | Irregular shared near-spherical low-poly mesh; bounded warning wobble, falling rotation/stretch, and landing compression/dust triggered by actual Core events. Square terrain retains a square silhouette. Square rock collision stays unchanged. |
| Visible top surfaces | 22px depth and 20° elevation, with square frontal cells. Presentation-only feet/shadow grounding adjusted; no collision offset. |
| Walking and digging | Existing articulated gait and four event-clocked claw cycles retained. Six actual walking frames per direction and ten per digging direction are captured again. |
| Gameplay preservation | Core/content source hashes and all nine deterministic replay signatures match the pre-visual baseline; full existing gameplay regressions retained. |

The current campaign has no boulders. Four boulder screenshots are from a separate QA scene using the production renderer and real `stepGame` hazard rules on an authored test level. Test buttons advance ordinary Core ticks; the game has no state injection interface or debug hazard scene. This fixture is bundled in memory by Vite for Playwright and is absent from production output.

Final evidence is saved in `screenshots/v0.6.1/`: portrait/landscape/desktop surfaces, excavated ladder shafts, embedded gold and damaged terrain, six animation sheets with individual frames/tick receipts, and warning/falling/impact/rest boulders beside square stone. Compare the production captures themselves with the reference, rather than treating test success as art approval.

The result is original procedural low-poly game art following the reference's visual language, not a pixel-for-pixel reproduction of its illustration. Existing mine layouts are preserved, so their composition differs. Physical phone GPUs and other browser engines remain unverified; local emulated layouts do not certify them.

Final review completed after the combined **35/35 browser tests passed (6.2m)**. All three surface layouts, all four boulder captures and all six final animation sheets were visually inspected. All eight required geometric/gameplay checks have evidence. **114 headless tests**, typecheck, lint and production build also pass; no Core/content file or replay signature changed. The 86 retained evidence files are actual production/QA renderer captures rather than substituted concept art.
