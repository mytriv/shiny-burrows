# YouTube Playables requirements and readiness

Checked 2026-10-23 against current official English documentation. This is an engineering gap assessment, not certification. [Overview](https://developers.google.com/youtube/gaming/playables) and [certification overview](https://developers.google.com/youtube/gaming/playables/certification/requirements) are authoritative entry points. MUST/MUST NOT are mandatory, SHOULD is a recommendation, MAY is optional. Recheck before submission; developer portal access and host ingestion have not been established.

## Runtime integration

| Requirement | Level | Current status / needed evidence |
| --- | --- | --- |
| SDK precedes game; loading/interactive readiness notices at appropriate states | MUST | Missing; verify startup trace in official test environment |
| Material progress saved through SDK only; successful load before any save; older saves readable | MUST | Missing; test load rejection, migration and duplicate commits |
| Milestone saves; pause save; exit flush best effort,64KiB | SHOULD / transport limit | Design compact snapshots and bounded flush; do not rely on exit |
| Respect device and host mute; host mute overrides game settings | MUST | Missing; test gesture unlock and mute races |
| Overall local mute avoided; granular controls permitted | SHOULD / MAY | Review existing music-note button in host mode |
| Host pause stops loop, rendering, audio, interactions and network; only host resume releases suspension | MUST | Missing; controller-only pause is insufficient |
| Host uses SDK lifecycle, not Page Visibility or similar APIs | MUST NOT / MUST | Current scene/input visibility handlers need conditional adapter |
| Submitted best score matches saved best, if scoring used | Conditional MUST | Optional API deferred; no leaderboard proposed |

Source: [integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration), updated2026-09-25. Lifecycle save handling must follow its pause/flush guidance; background gameplay/network polling is not permitted.

Official [setup guide](https://developers.google.com/youtube/gaming/playables/reference/getting_started?hl=en): root `index.html`; load `https://www.youtube.com/game_api/v1` before game code. SDK calls outside Playables can be no-ops, so localhost tests alone do not validate integration.

Relevant [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk?hl=en), updated2026-06-04:

| API | Planned boundary |
| --- | --- |
| `typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV` | Select real host adapter; do not overwrite global |
| `game.firstFrameReady()`, `game.gameReady()` | Ordered loading then interactive signals |
| `game.loadData(): Promise<string>` | Load once, distinguish empty success from failure |
| `game.saveData(data: string): Promise<void>` | Valid well-formed UTF-16 payload, serialized writes |
| `system.onPause`, `system.onResume` | Subscribe/unsubscribe host lifecycle; exit may have no resume |
| `system.isAudioEnabled()`, `system.onAudioEnabledChange` | Audio master permission |
| `system.getLanguage(): Promise<string>` | Optional language preference, not saved as progression |

Handle rejected promises and SDK error types; do not silently replace unavailable cloud data with empty progress. Proposed plain-TypeScript transport interfaces belong in `platform/` and `persistence/`, never Core.

## Packaging and performance limits

| Item | Mandatory | Recommended | Current evidence |
| --- | --- | --- | --- |
| Initial download through readiness | <30MiB | <15MiB | No host ingestion measurement |
| Total bundle | <250MiB default | Load minimum initially | Local dist ~1.94MiB |
| Individual file | <30MiB | <512KiB | JS ~1.93MiB: under mandatory, over recommendation |
| Save | <3MiB | <500KiB | No save implemented |
| Interactive load | — | <5s | No representative cold-device measurement |
| Peak JavaScript heap | ≤512MB | Minimize | Unmeasured |
| Files | ≤8,000; allowed filename characters alphanumeric, `_-.`; relative references only | — | Six local dist files; relative Vite output |
| Runtime | Standard Web APIs; all supported browsers plus Android/iOS YouTube apps; no reproducible crashes | — | Chromium baseline only; WebGL2 portability unverified |

Source: [stability/performance requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability), updated2026-06-16. **Use the normative body:** its generated page summary contradicts the initial-size rule. There is no universal mandatory60FPS threshold here. Our existing33.3ms median is evidence of roughly30FPS, not achievement of the60FPS design goal.

## Input, presentation and audience

Mandatory design rules: playability across aspect ratios, state-preserving resize, no orientation lock, all interactions via mouse and touch, clear graphics/text at screen densities, no `preventDefault()` on Escape, explicit final-content completion, required metadata, no external clickable content/share prompts/additional agreements, no app quit button or host-confusing neighboring icons. Keyboard and modal Escape dismissal are recommended. Centered letterboxing is allowed. Source: [design requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_design), updated2026-09-25.

Current three layout receipts are not coverage of9:32 through32:9. Audit HUD/modal reachability, safe areas, touch cancellation, density/clarity and browser zoom. The green **level exit** changes game state; it is not an application quit control. Final workshop already communicates completion; retain it. Submission thumbnails/title/description/genre/publisher fields need portal review; reference-game branding must not appear in product metadata.

Mandatory content positioning: suitable for a general audience13+, and not specifically made for kids; clear rights, original/authorized content, accurate metadata, terms/community compliance and restricted staging-link sharing. Source: [Trust and Safety](https://developers.google.com/youtube/gaming/playables/certification/requirements_trustsafety), updated2026-08-26. The cute, friendly art may remain; earlier child-oriented language needs publishing-positioning review rather than automatic reclassification. Original JAR source, text, music, characters and assets stay outside distribution. Reference-image rights are not a license to reproduce their pixels.

## Privacy, localization, accessibility and monetization

| Area | Official rule summary | Project implication |
| --- | --- | --- |
| Privacy/data | No external network except expressly required Google/YouTube resources; no PII/login, QR workaround or unauthorized clipboard. SPA; minification allowed, obfuscation prohibited. | Bundle procedural content locally, no CDN/analytics/account backend. Inspect transitive runtime network and shipped code. [Privacy/data](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata) |
| Language | English mandatory. SDK language optional; browser language APIs prohibited for this purpose. | Existing English retained; no localization dependency needed. [i18n/L10n](https://developers.google.com/youtube/gaming/playables/certification/requirements_i18n_l10n) |
| Accessibility | WCAG-AA effort and accurate accessibility tags recommended; inaccurate tags prohibited. | Keep visible focus, DOM labels, reduced motion, non-color cues; manually test assistive use before claiming tags. [Accessibility](https://developers.google.com/youtube/gaming/playables/certification/requirements_accessibility) |
| Monetization | No off-platform monetization/ads/purchases or real-world/tradeable rewards. YouTube ads optional; opted-in rewarded ads cannot block standard play; interstitials only natural transitions, not active play. | No ads proposed. “All advertising is banned” is outdated: read normative body, not generated summary. [Monetization](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization), updated2026-10-19 |

The SDK script is a documented platform exception, not permission for arbitrary network dependencies. No external account is necessary to play. Internal gold remains nontransferable game currency.

## Verification gate

Before release: automated fake-host contract tests, official [test suite](https://developers.google.com/youtube/gaming/playables/test_suite), bundle analyzer, ingested launch/save/mute/pause traces, representative physical Android/iOS tests, supported browser matrix, cold-load/heap/frame measurements, accessibility/content/rights and portal metadata review. Record tested device/browser versions, commit/build hash, network conditions, result and artifacts. Missing portal/device access leaves those rows **unverified**, not passed.

## Product hypotheses, separate from certification

| Target | Meaning / validation |
| --- | --- |
| First meaningful action1–3s | Observe first successful movement/strike from interactive readiness; separately record navigation-to-action |
| First gold5–10s; satisfying reward≤15s | Time real newcomers, note gold event and whether feedback was noticed |
| Loop understood≤30s | Ask participant to explain move/dig/collect/deepen without leading them |
| First meaningful choice≤60s | Observe optional route/tool decision and ask their reason |
| Satisfying session2–5min | Observe voluntary stopping/return intent; no forced timer |
| Smooth60FPS where practical | Measure frame intervals on a declared device tier; preserve fixed Core simulation at lower rendering rates |

These user-provided targets are not official limits or achieved results. Scripted solves and automated assertions cannot substitute for pacing/comprehension playtests. Collect consented minimal local observations; do not introduce remote telemetry to run this study.
