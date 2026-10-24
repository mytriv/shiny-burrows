# Assets and third-party notices

Active v0.6.1 models, materials and effects are original local procedural geometry in src/presentation/three: seeded sculpted terrain/embedded stones/pits, continuous shallow soil pockets, articulated mole, claw animation poses, embedded faceted gold, wood ladders/platforms, irregular spherical boulders and a functional exit marker. Legacy bonus overlays use gold instead of crystal decoration. Nugget and claw HUD icons are original inline SVG. Three.js's MIT-licensed RoundedBoxGeometry supplies rounded box primitives. No third-party models, images, fonts or recorded audio. GameAudio synthesizes original short tones locally with Web Audio after user interaction. UI uses CSS and system fonts. No AI-generated bitmap art or runtime external network assets. Previous presentation lives in archive/v0.5-migration and is not bundled. QA contact sheets arrange captured browser frames without generating or substituting artwork.

Three tiny shared data textures are generated locally: 96×96 clay color, 96×96 clay normal and 32×32 radial gold illumination. The helmet/lamp is cosmetic original geometry. `StyleReference.png` and `StyleReference2.png` are user-supplied art-direction references; neither is bundled or sampled into runtime assets. The v0.6.1 isolated browser fixture is bundled in memory only by the test runner and is not shipped as an extra game scene.

Bundled application libraries:

| Library | Version | License | Included notice |
| --- | --- | --- | --- |
| Phaser | 3.90.0 | MIT | public/licenses/Phaser-MIT.txt |
| EventEmitter3 (Phaser dependency) | 5.0.4 | MIT | public/licenses/EventEmitter3-MIT.txt |
| Three.js | 0.180.0 | MIT | public/licenses/Three-MIT.txt |

The notices are copied into production output by Vite. Development tools are not bundled in the application: TypeScript (Apache-2.0), Vite/Vitest/ESLint/typescript-eslint (MIT), Playwright (Apache-2.0). Exact dependency versions and transitive licenses are recorded in `package-lock.json` and installed package license files.
