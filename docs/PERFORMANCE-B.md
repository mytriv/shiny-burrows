# Milestone B — measured performance and open work

2026-10-23, Windows10 HeadlessChrome141.0.7390.37, ANGLE Vulkan SwiftShader software renderer. All production budgets retain the existing <34ms median-frame gate,90-call and150k-triangle bounds. Pixel ratio ceiling1.5 and400k drawing-buffer cap, materials, mole, mesh detail, lighting and projection are unchanged. No postprocessing or new dynamic lights.

## Baseline before implementation

Unchanged A production build, three existing budget tests: **2 passed /1 failed,26.7s**. Earlier A-hotfix full run had three failures at50/49.9/50ms; those historical failures remain in `screenshots/hotfix-a-ladder-mining/`. The fresh baseline's varying outcomes demonstrate that one pass does not establish permanent resolution.

| Viewport | Median /p95 frame interval | Mean CPU submission | Calls /triangles |
| --- | --- | ---: | ---: |
| 390×844 | 33.4 /50.1ms | 2.10ms | 63 /105,806 |
| 844×390 | 33.4 /50.0ms | 2.58ms | 60 /95,508 |
| 1920×1080 | 50.0 /50.1ms — failed | 2.26ms | 60 /95,508 |

Exact before receipts and full surfaces: `screenshots/milestone-b/baseline-a/`.

## Discovery renderer profile

The opening has10 discovered cells out of432. Only4 solid fronts and2 nuggets are resident;422 whole-cell fog instances conceal everything else. Total resident terrain/detail/fog instances478, versus4454 in the fully revealed B mine. These instance counts are after discovery filtering but before camera-frustum culling; draw calls and triangles are actual renderer counters. Culling is more selective because details now share the terrain's eight-row chunk bounds rather than one global detail batch. Approved visible geometry/material quality is retained.

Final production opening budget samples: median16.7ms at all three viewports; p95 approximately16.7/16.8/16.8ms. CPU submission1.33/1.26/1.24ms; draws56/55/56; triangles11,552/10,016/11,552. These gates now pass because the opening is no longer omniscient; this is not a like-for-like fully exposed workload or proof that the old performance issue is globally fixed.

The separate same-browser portrait scheduling probe measures an empty page16.7ms median, fogged game16.7ms, and the first excavated opening16.7ms. Idle rebuild count stays4 for the entire sample; the last idle terrain-sync timer reads0ms at browser timer precision. No geometry is rebuilt per idle frame. Core/renderer tests also verify an isolated tile change rebuilds exactly one affected chunk and equivalent state causes zero rebuilds. The production input tests verify resizing changes neither discovery nor chunk rebuild counts.

## Fully discovered workload and limitations

A QA-only full-discovery fixture imports the real renderer and authored B First Burrow. It uses the real layout/CSS and renderer settings, while excluding Phaser, simulation ticks, HUD writes and production state/input/damage telemetry from the game scene adapter. It is bundled only inside the browser test, with no production reveal-all switch. The renderer's own diagnostics, including pose, remain enabled. All304 solids and20 tier-sized nuggets are resident, fog0, instances4454; all meshes retain approved detail. Rebuild count remains4 throughout every120-frame profile.

| Viewport | Median /p95 | CPU submission | Calls /triangles |
| --- | --- | ---: | ---: |
| 390×844 | **49.9 /50.1ms** | 1.18ms | 71 /96,872 |
| 844×390 | 33.3 /33.4ms | 0.79ms | 57 /62,776 |
| 1920×1080 | 33.3 /50.0ms | 1.23ms | 63 /63,784 |

**The fully exposed portrait result still exceeds the existing34ms budget.** The profiling test records diagnostics; its successful execution is not a pass of that worst-case frame budget. Production startup tests remain unchanged and do not test a completely explored map. No full-workload60FPS or resolved-all-performance claim is justified.

Verified findings: an empty page can schedule approximately60Hz in this environment; the sparse game can too. An all-visible renderer can still miss the frame budget without Phaser, authoritative simulation, HUD updates or terrain rebuilding. Thus those components and per-frame terrain rebuilding are not necessary causes of this reproduced slowdown. Discovery filtering reduces actual submitted work and measured frame intervals at startup. CPU submission is not GPU duration.

Unresolved hypotheses: SwiftShader rasterization/shading, GPU-command scheduling, overdraw and workstation resource pressure may contribute. These observations do not isolate an individual shader/driver/scheduler or exclude CPU contention. No hardware-GPU comparison, GPU-duration query, OS contention trace, physical-phone measurement or cross-browser certification was performed. Larger-map/Endless growth is outside B. Future performance work must measure expanded exploration on a declared device tier; do not weaken the current acceptance assertions or silently discard the old failures.

Raw profile JSON, actual before/clue/reveal/return captures and all three fully discovered surfaces are retained in `screenshots/milestone-b/final/` alongside current production budget receipts.
