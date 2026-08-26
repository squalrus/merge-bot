# Changelog

User-visible changes, newest first. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [semver](https://semver.org/) versioning.

## [0.4.8] — 2026-08-26

### Added
- **Bundled build.** The action now runs from `dist/index.js`, generated from `index.js` + `lib/` with [`@vercel/ncc`](https://github.com/vercel/ncc) via a new `npm run build` script. Only production `dependencies` get bundled — `devDependencies` like `jest` never ship. (`package.json`, `dist/index.js`)
- **Build staleness check.** `.github/workflows/build-check.yml` rebuilds `dist/` on every PR to `master` and fails if it doesn't match a fresh build from source, so the bundle can't silently drift from `index.js`/`lib/`. (`.github/workflows/build-check.yml`)

### Changed
- **`action.yml` entry point.** `runs.main` now points at `dist/index.js` instead of `index.js`. (`action.yml`)
- **Docs.** README, CONTRIBUTING, and CLAUDE.md updated to describe the bundle step and the requirement to rebuild `dist/` after touching `index.js` or `lib/`. (`README.md`, `CONTRIBUTING.md`, `CLAUDE.md`)
- **Open issues reviewed.** `AUDIT.md` now cross-checks all 8 open GitHub issues against the current code instead of just listing them — most describe gaps still present today, and #77 (a crash on `push` events) was confirmed as a live, reproducible bug. (`AUDIT.md`)

### Removed
- **Committed `node_modules/`.** 6,630 tracked files removed from git in favor of the bundled `dist/index.js`; added `.gitignore`. (`.gitignore`)

## [0.4.7] — 2026-08-26

### Fixed
- **Action runtime.** `action.yml`'s `runs.using` was `node12`, a runtime GitHub Actions has removed — any consumer on a current runner risked the action failing outright. Changed to `node20`; full test suite (39/39) re-verified passing under Node 22 against the existing `@actions/core`/`@actions/github` v4 call shape. (`action.yml`)

### Changed
- **Audit and backlog docs.** `AUDIT.md` and `BACKLOG.md` updated to reflect the runtime fix above (no longer listed as the top critical item / open known issue) and to record that `azure-pipelines.yml` is confirmed actively broken under Node 10.x due to a transitive native-module dependency in Jest 30. (`AUDIT.md`, `BACKLOG.md`)

## [0.4.6] — 2026-08-26

### Added
- **Repository audit.** `AUDIT.md` — a point-in-time health check covering dependency/runtime status, CI/CD, open PRs, and repo hygiene, with a suggested triage order.
- **Backlog.** `BACKLOG.md` — tracked follow-up work, seeded with 12 items from the audit (runtime upgrade, dependency upgrades, CI consolidation, PR triage, branch cleanup, etc.).
- **Contributor guide.** `CONTRIBUTING.md` — dev setup, PR workflow, and the release process.
- **Claude Code guidance.** `CLAUDE.md` — architecture map, known constraints, and pointers to the audit/backlog/changelog so future sessions don't duplicate tracked work.
- **Version consistency guard.** `.github/workflows/version-check.yml` — fails a tag push if the tag doesn't match `package.json`'s version.

### Changed
- **README.** Added Development, Contributing, Project status, and License sections; bumped the example usage from the stale `@v0.1.0` to `@v0.4.5`.
- **Release process.** Documented in `CONTRIBUTING.md`: cut releases with `npm version` (bumps `package.json`, commits, and tags in one step) instead of editing `package.json` and tagging separately.

### Fixed
- **`package.json` version drift.** `version` was stuck at `0.2.1` while the latest published tag was `v0.4.5`. Corrected to `0.4.5` as the baseline for the new version-check guard above.
