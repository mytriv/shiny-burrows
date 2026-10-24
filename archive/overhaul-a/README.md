# Superseded tests retained for review

These are pre-Milestone-A copies, outside active test discovery. They assert earlier four-direction mining/upward ladder extension and visual-migration byte preservation. They are not skipped active failures.

Active replacements:

- `tests/unit/overhaul-a.test.ts`: direct API/held Up cannot excavate; horizontal/same-row/ascent cannot add rungs; downward rows processed once; blockers/collision repeats; actual diagonal/junction/detachment/landing; ceiling grip; real bank dismount; shaft foothold Down/fall behavior; existing platform connector return.
- `tests/unit/v3-g.test.ts`: keeps three-axis cadence/durability/ore/regen and ladder occupancy, grip, drop, physics and determinism coverage. Removed seven obsolete Up-mining/extension cases plus two generated Up-mining cases.
- `tests/unit/v4-preservation.test.ts`: still checks unchanged files against old hashes, except the five intentionally modified Core modules; all nine campaign routes preserve old ticks/wallet and replay new states exactly. Old whole-state hashes cannot remain equal after replacing the ladder state field.
- `tests/e2e/v3-g.spec.ts`: three real input-mode shaft returns, three climb-only-Up regressions, new clock-stepped lateral-exit regression. Removed obsolete upward excavation/extension route.
- `tests/e2e/v5-animation.spec.ts`: retains left/right/down rendered strikes and walking. The removed gameplay Up-strike case is obsolete; historical cosmetic Up-pose bounds remain tested without gameplay triggering them.

Current frame-time test threshold remains unchanged. Its failures are recorded as open acceptance, not archived or skipped.
