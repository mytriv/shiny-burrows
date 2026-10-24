# GitHub Pages

Repository: https://github.com/mytriv/shiny-burrows

Game: https://mytriv.github.io/shiny-burrows/

Pushes to `main` run `.github/workflows/pages.yml`: install the locked dependencies with Node22, run unit tests/typecheck/lint, build Vite, and deploy only `dist/` through the official Pages artifact workflow. Vite's existing relative base (`./`) supports the repository subpath without a custom domain or runtime server. No gameplay/engine changes are required.

Source, tests, notices and development evidence are versioned. Dependencies, generated bundles/browser results and local reference images are ignored. Core/content Git attributes preserve exact bytes across Windows/Linux because preservation regressions check source hashes.

Full browser/performance regressions remain available via `npm run test:browser`; their historical software-renderer limitations remain documented. Deployment CI gates deterministic unit/type/lint/build checks. Published-site input and asset verification is recorded in the latest implementation status; this is not YouTube or physical-device certification.
