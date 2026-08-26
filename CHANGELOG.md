# Changelog

User-visible changes, newest first. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [semver](https://semver.org/) versioning.

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
