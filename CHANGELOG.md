# Changelog

User-visible changes, newest first. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [semver](https://semver.org/) versioning.

## [0.5.3] — 2026-08-26

### Added
- **Automated GitHub Releases.** No git tag or GitHub release had been created for any version since v0.4.5 — the shipping process bumps `package.json` and merges a PR, but nothing ever ran `npm version`/`gh release create` as `CONTRIBUTING.md`'s documented process assumed, so 17 versions (v0.4.6 through v0.5.2) went untagged and unreleased. `.github/workflows/release.yml` now watches every push to `main` that touches `package.json`; when it finds a version with no matching tag, it tags that commit, pushes the tag, and publishes a GitHub release using the corresponding `CHANGELOG.md` section as the notes. Backfilled tags and releases for all 17 missing versions retroactively at their original merge commits. (`.github/workflows/release.yml`, `CONTRIBUTING.md`, `CLAUDE.md`, `BACKLOG.md`)

## [0.5.2] — 2026-08-26

### Fixed
- **Fork PRs couldn't be auto-merged via the labeled trigger.** GitHub always issues a read-only `GITHUB_TOKEN` for `pull_request`-family events triggered by a PR from a forked repository, regardless of the repo's own workflow-permissions setting — so `octokit.rest.pulls.merge` failed with "Resource not accessible by integration" even when `canMerge()` correctly judged the PR mergeable. Discovered live merging PR #72 (a fork PR), which had to be merged manually as a workaround. `.github/workflows/merge-bot.yml` and the README's example workflow now trigger on `pull_request_target` instead of `pull_request`, which runs with the base repo's full-permission token even for fork PRs; safe here because the workflow never checks out or executes the fork's code. (`.github/workflows/merge-bot.yml`, `README.md`)

## [0.5.1] — 2026-08-26

### Fixed
- **Crash on events with no `pull_request` in the payload.** Reported in [#77](https://github.com/squalrus/merge-bot/issues/77) by [@chickenandpork](https://github.com/chickenandpork). `Pull`'s constructor read `payload.pull_request.labels` unconditionally; a workflow triggered on `push` (in addition to `pull_request`, as the reporter's was) delivers a payload with no `pull_request` object at all, crashing on every push. `index.js` now guards on `payload.pull_request` existing before constructing `Pull`, logging and no-oping cleanly on non-PR events instead. (`index.js`, `__tests__/index.test.js`)

### Changed
- **BACKLOG.md's shipping checklist now covers GitHub issues end-to-end.** For any shipped item traced to a GitHub issue: the CHANGELOG entry must link the issue and credit the reporter, the shipping PR body must include `Fixes #<n>`/`Closes #<n>` so merging auto-closes it, and a post-merge step verifies the close actually happened. (`BACKLOG.md`)
- **AUDIT.md refreshed** to reflect the completed PR/issue triage, the #72 merge and the two bugs it surfaced, the zero-stale-branch state, the fork-merge-token limitation, and stale claims found in CLAUDE.md/CONTRIBUTING.md about the octokit API shape. (`AUDIT.md`)

## [0.5.0] — 2026-08-26

### Added
- **Comment-triggered re-evaluation of a pull request.** Contributed by [Takehiro Iyatomi](https://github.com/umegaya) in #72. Merging can fail with a transient "Base branch was modified" error (typically when multiple merge-bot runs land close together); commenting on the pull request now re-triggers evaluation as a way to retry, once the workflow's triggers include `issue_comment` (see README's "Retrying via a PR comment" section for the required workflow config, added in v0.4.18). `issue_comment` events carry no `pull_request` object, so the action now fetches it via `octokit.rest.pulls.get` when the comment is on a pull request, and leaves plain issue comments alone. (`index.js`, `README.md`)

## [0.4.19] — 2026-08-26

### Fixed
- **Checks lookup failed for pull requests from forks.** [index.js](index.js#L33) queried `checks.listForRef` using the head *branch name*, which only resolves within the repo that branch lives in — for a fork PR the branch lives in the fork, not the base repo, so the base repo's API 404s with "No commit found for SHA: `<branch>`". Surfaced by this repo's own dogfooding `Merge` workflow failing on PR #72 (`umegaya/merge-bot:master`). Now queries by the head commit SHA instead, which resolves regardless of which repo the branch physically lives in. (`index.js`)

## [0.4.18] — 2026-08-26

### Changed
- **`.github/workflows/merge-bot.yml` now also triggers on `issue_comment`.** Prepares this repo's own dogfooding workflow to pick up PR #72's comment-triggered retry behavior once it merges — a comment on a pull request will re-run the merge check (useful for retrying after a transient "Base branch was modified" failure), gated by a job-level `if:` so it's a no-op for comments on plain issues. Since this workflow already points at `squalrus/merge-bot@main`, the trigger becomes fully live automatically once #72 merges; no further change needed here. (`.github/workflows/merge-bot.yml`)
- **BACKLOG.md's "Remove label / re-request review on commit" entry updated** to reference PR #12 ("Resubmit reviews after push", closed as stale) as prior art for the re-request-review half of that item. (`BACKLOG.md`)

### Fixed
- **Triaged all 9 open pull requests.** Closed the 7 dependabot bumps (#64, #69, #70, #71, #73, #74, #75) as superseded — each target version was already met, or the package no longer in the tree, following the v0.4.11 dependency upgrade. Closed #12 ("Resubmit reviews after push"), a 7-year-old branch from before the ESM/`octokit.rest.*` rewrite that couldn't be rebased cleanly; its idea lives on in the "Remove label / re-request review on commit" backlog entry. Reviewed #72 on its merits and pushed an update on top of the contributor's original commit (kept intact, credited as co-author) porting it to the current codebase. Only #72 remains open now, pending merge.

### Removed
- **Stale `origin/resubmit-reviews` branch.** Backed the now-closed #12 and no longer had an open PR; the 7 dependabot branches were already auto-deleted by GitHub when their PRs closed.

## [0.4.17] — 2026-08-26

### Added
- **`.github/dependabot.yml`.** No Dependabot config existed, yet Dependabot was already opening PRs via GitHub's automatic security updates — without a schedule or policy, 6+ dependency PRs sat open for years. Configures weekly `npm` ecosystem scans with dev-dependency bumps grouped into a single PR so future updates arrive in batches instead of one-off drips. (`.github/dependabot.yml`)

## [0.4.16] — 2026-08-26

### Changed
- **Renamed the default branch from `master` to `main`.** Renamed on GitHub (Settings → Branches), which auto-updated open PRs, branch protection, and old-name redirects. Updated every remaining `master` reference across the repo: `.github/workflows/test.yml` and `build-check.yml` now trigger on PRs to `main`; `.github/workflows/merge-bot.yml`'s self-referential `uses: squalrus/merge-bot@main` updated; CONTRIBUTING.md, CLAUDE.md, AUDIT.md, and BACKLOG.md updated wherever they described current state or gave branch-off instructions. Historical references in CHANGELOG.md and AUDIT.md's retired-pipeline note were left as-is since they describe the past accurately. (`.github/workflows/test.yml`, `.github/workflows/build-check.yml`, `.github/workflows/merge-bot.yml`, `CONTRIBUTING.md`, `CLAUDE.md`, `AUDIT.md`, `BACKLOG.md`)

## [0.4.15] — 2026-08-26

### Added
- **`.github/CODEOWNERS`.** No CODEOWNERS file existed, so PRs got no automatic reviewer assignment. Designates `@squalrus` as the default reviewer for all paths. (`.github/CODEOWNERS`)
- **`SECURITY.md`.** Establishes a security policy: private vulnerability reporting via GitHub Security Advisories, a 5-business-day initial response target, latest-release-only support (project is pre-1.0), and an MIT license statement. (`SECURITY.md`)

## [0.4.14] — 2026-08-26

### Added
- **ESLint config, `.editorconfig`, and an `engines.node` field.** No linter/formatter config existed, and `package.json` had no guardrail against developing against an unsupported Node version. Added `eslint.config.js` (flat config, ESLint 9.x pinned to the maintenance line since 10.x requires a newer Node patch version than several dev machines have) enforcing the project's existing conventions — 4-space indent, semicolons — plus `no-unused-vars`; fixture payloads under `__mocks__/` are excluded since they deliberately mirror raw JSON webhook shape. `.editorconfig` covers the same basics for editors that read it. `engines.node` is set to `>=20`, matching the `node20` runtime `action.yml` declares. A `lint` script (`npm run lint`) was added and wired into `.github/workflows/test.yml` so lint failures block PRs the same way test failures do, and `CONTRIBUTING.md`/`CLAUDE.md` updated to reference it. (`eslint.config.js`, `.editorconfig`, `package.json`, `.github/workflows/test.yml`, `CONTRIBUTING.md`, `CLAUDE.md`)

### Fixed
- **Lint violations surfaced by the new config.** Missing semicolons in `lib/pull.js` and `lib/message.js`, an unused loop variable in `lib/pull.js`'s review-compilation logic, and four dead imports left over in `__tests__/pull-canmerge.test.js`. No behavior change. (`lib/pull.js`, `lib/message.js`, `__tests__/pull-canmerge.test.js`)

## [0.4.13] — 2026-08-26

### Changed
- **Tidied the bug report issue template for a GitHub Action.** `.github/ISSUE_TEMPLATE/bug_report.md` was still the unmodified GitHub default, asking reporters for Desktop/Smartphone OS and browser info that doesn't apply to an Action. Replaced with fields relevant to merge-bot: workflow configuration (pinned version, inputs), triggering event, and actual vs. expected behavior. (`.github/ISSUE_TEMPLATE/bug_report.md`)

## [0.4.12] — 2026-08-26

### Changed
- **Consolidated CI onto GitHub Actions.** Tests now run via `.github/workflows/test.yml` (`npm test` on Node 20, triggered on PRs to `master`). Added because the previous `azure-pipelines.yml` pipeline — the only place `npm test` ran — was pinned to Node 10.x (EOL 2021) and had gone fully broken (Jest 30's `unrs-resolver` native dependency fails to install under Node 10.x). A status badge was added to the README pointing at the new workflow. (`.github/workflows/test.yml`, `README.md`)
- **AUDIT.md and BACKLOG.md refreshed.** Re-checked live PR/issue/branch state against GitHub and corrected several stale figures the audit had accumulated (a merged PR still shown as open, an auto-closed PR still listed, a stale-branch count inflated by deleted local tracking refs). Added backlog entries for the 8 open GitHub issues (one confirmed crash bug plus 7 feature requests) and previously-untracked hygiene gaps (linter/`engines` field, `CODEOWNERS`, `SECURITY.md`). (`AUDIT.md`, `BACKLOG.md`)

### Removed
- **`azure-pipelines.yml`.** Superseded by `.github/workflows/test.yml`; see above. (`azure-pipelines.yml`)

## [0.4.11] — 2026-08-26

### Changed
- **Migrated from CommonJS to ES modules.** `@actions/core@3` and `@actions/github@9` are ESM-only (no CommonJS export), whereas v1/v4 supported both. The codebase (`index.js`, `lib/`, `__tests__/`, `__mocks__/`) has been converted from `require()`/`module.exports` to `import`/`export`. `package.json` now declares `"type": "module"`. Jest runs with `--experimental-vm-modules` to support ESM test files. `@vercel/ncc` was upgraded to 0.45.0 to bundle ESM correctly. (`package.json`, `index.js`, `lib/`, `__tests__/`, `__mocks__/`, `dist/`)
- **Upgraded `jest` from 26.6.3 to 30.4.2.** Most npm audit findings were in jest's transitive dependency tree (Babel, `ws`, `jsdom`, etc.), not in production code. The new jest brings those transitive deps up to date. (`package.json`, `package-lock.json`)
- **Upgraded production dependencies.** `@actions/core` from 1.2.6 to 3.0.1 (includes a moderate security advisory fix) and `@actions/github` from 4.0.0 to 9.1.1. Octokit API call sites in `index.js` updated to use the `.rest.*` namespace (v9 requires this shape). All 50 tests pass under the new versions. (`package.json`, `index.js`, `package-lock.json`)
- **Upgraded `@vercel/ncc` from 0.38.4 to 0.45.0** to support ESM bundling. (`.json`)

### Fixed
- **npm audit: 54 vulnerabilities → 0.** All security advisories are now resolved. (`package-lock.json`)

## [0.4.10] — 2026-08-26

### Changed
- **`package.json` metadata reconciled with reality.** `name` was still the placeholder `"github-actions"`; now `"merge-bot"`, matching the repo. `license` was `"ISC"`, which didn't match the actual MIT `LICENSE` file; now `"MIT"`. (`package.json`, `package-lock.json`)

## [0.4.9] — 2026-08-26

### Added
- **Test coverage for `index.js`.** The action's entry point — reading the payload, fetching reviews/checks, choosing between commenting (test mode), merging, and deleting the source branch, including the fork-retains-branch and API-failure paths — had zero test coverage before this. `__tests__/index.test.js` now exercises it by mocking `@actions/core`/`@actions/github`, bringing overall coverage (statements/branches/functions/lines) to 100% across `index.js` and `lib/`. (`__tests__/index.test.js`)
- **Coverage output ignored.** `npm test -- --coverage` writes a `coverage/` directory; added to `.gitignore` so it can't get committed by accident. (`.gitignore`)

### Changed
- **`AUDIT.md` refreshed.** Test counts and coverage status updated to reflect the above; `npm audit`'s vulnerability count re-checked and corrected (54, not 56 — normal drift in upstream advisories, not a regression). (`AUDIT.md`)

### Fixed
- **Untested branches in `lib/`.** `Pull.compileReviews`'s out-of-order-resubmission guard (an older review arriving after a newer one for the same user), `Pull.compileChecks`'s missing-payload guard, and `renderMessage`'s "mergeable" (✅) case were exercised by the existing suite only for their default outcome, leaving the other branch dark. Added targeted tests and fixtures (`__mocks__/pull/reviews-out-of-order*.js`, `__mocks__/message/message-expected-mergeable.js`) for each. (`__tests__/pull-data.test.js`, `__tests__/message.test.js`)
- **`Config`'s `test`/`delete_source_branch` boolean mapping was never asserted `true`.** Every existing fixture passed `'false'` (or omitted the input) for these two flags, so the `getInput(...) === 'true'` mapping only had ever been checked in one direction. `__mocks__/config/core-complex.js` (and its expected output) now also flips these two. (`__mocks__/config/core-complex.js`, `__mocks__/config/config-complex.js`)
- **Stale `package-lock.json` version.** Drifted to `0.4.7` while `package.json` had already moved to `0.4.8`; re-synced.

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
