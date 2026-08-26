# Repository Audit

_Last reviewed: 2026-08-26_

This document is a point-in-time health check of the `merge-bot` repository: what's open, what's outdated, what's risky, and what's just an observation. Re-run this audit periodically (see [BACKLOG.md](BACKLOG.md)) and update this file rather than letting it drift.

## Summary

The action works and its test suite passes, but the project has had no code changes since **2021-04-24** (5+ years) while still being actively consumed (it merges its own PRs via `.github/workflows/merge-bot.yml`). The most urgent issue — the GitHub Actions runtime it declared (`node12`) having been removed by GitHub — was fixed 2026-08-26.

| Area | Status |
|---|---|
| Tests | ✅ Passing (39/39) |
| Action runtime | ✅ Fixed — now declares `node20` |
| Dependencies | 🟠 Multiple majors behind, security advisories open |
| CI/CD | 🟠 Split across two unmonitored systems, one on EOL Node |
| Open PRs | 🟠 7 open, oldest from 2019 |
| Repo hygiene | 🟠 `node_modules` committed, 22 stale branches, no `.gitignore` |
| Docs | 🟡 README solid but no CONTRIBUTING/CLAUDE/SECURITY |

## Critical items

1. ~~`action.yml` declares `runs.using: node12`~~ — **fixed 2026-08-26**: GitHub Actions had removed the Node 12 and Node 16 runtimes (supported runtimes are `node20`/`node24`). `action.yml` now declares `node20`; the existing test suite (39/39) was re-run and passes under Node 22, exercising the same `@actions/core`/`@actions/github` call paths. ([action.yml](action.yml))
2. **`node_modules/` is committed to git** (6,630 tracked files) and there is no `.gitignore`. This bloats every clone/checkout, causes noisy diffs, and is the kind of thing that quietly reintroduces vulnerable code even after `package.json` is bumped, since the checked-in `node_modules` won't update itself. GitHub Actions still requires a JS action's dependencies to be present at runtime (there's no install step before `runs.main` executes), but committing raw `node_modules` is the outdated way of doing that — the current standard is to bundle with `@vercel/ncc` into a single `dist/index.js` containing only production dependencies, never `devDependencies`. See the backlog item for detail.
3. **`package.json` metadata is inconsistent with reality**:
   - `license: "ISC"` in `package.json` vs. the actual `LICENSE` file, which is MIT.
   - `name: "github-actions"` — a placeholder, not `merge-bot`.
   - ~~`version: "0.2.1"` vs. latest tag `v0.4.5`~~ — **fixed 2026-08-26**: `package.json` now reads `0.4.5`, the README example pins `@v0.4.5`, and [`.github/workflows/version-check.yml`](.github/workflows/version-check.yml) fails any future tag push whose version doesn't match `package.json`, so this can't silently drift again. Release with `npm version` (see [CONTRIBUTING.md](CONTRIBUTING.md)), not a manual edit + tag.

## Dependency / upgrade status

Prod dependencies (`npm outdated`):

| Package | Current | Latest | Notes |
|---|---|---|---|
| `@actions/core` | 1.2.6 | 3.0.1 | Two majors behind; current version has a moderate advisory ([GHSA-7r3h-m5j6-3q42](https://github.com/advisories/GHSA-7r3h-m5j6-3q42)) fixed by upgrading. |
| `@actions/github` | 4.0.0 | 9.1.1 | Five majors behind. `index.js` calls REST methods directly on the octokit client (e.g. `octokit.pulls.listReviews`) rather than under `.rest.*`, which is the v4-era API shape — upgrading is a breaking change for this code, not a drop-in bump. |
| `jest` (dev) | 26.6.3 | 30.4.2 | Four majors behind. Most of the `npm audit` noise (Babel, `ws`, etc.) comes from this dependency's transitive tree, not from anything shipped in the action itself. |

`npm audit` totals: **56 vulnerabilities** (6 critical, 16 high, 33 moderate, 1 low) across 533 total dependencies (22 prod / 512 dev). The prod-facing surface is small (`@actions/core`, `@actions/github`, and their transitive deps); the bulk of the critical/high findings are in the `jest` 26 dev toolchain and would clear substantially by upgrading `jest` alone.

No `.github/dependabot.yml` exists in the repo, yet Dependabot has opened PRs (#68–#75) — this is GitHub's automatic security-update behavior, not a configured `version-updates` schedule. Without a config file there's no grouping, no schedule, and no policy for how these PRs get triaged, which is consistent with 6 of them sitting open since 2021–2023.

## CI/CD pipelines

Two separate, disconnected systems exist:

- **`azure-pipelines.yml`** — runs `npm install -g jest --save-dev && npm install && npm test` on `pool: ubuntu-latest`, pinned to **Node 10.x** (EOL April 2021). Triggers on PRs to `master`. **Confirmed active and currently broken (2026-08-26):** the global `jest` install pulls latest Jest (30.x), whose `jest-resolve` now depends on `unrs-resolver`, a native module whose postinstall fails under Node 10.x — every run currently errors before tests even execute. There is no badge or reference to it from the README. See the backlog item for the fix.
- **`.github/workflows/merge-bot.yml`** — this is the action *using itself* (`uses: squalrus/merge-bot@master`) to manage this repo's own PRs. It runs with `reviewers: false` and `checks_enabled: false`, meaning label alone (`ready`) is sufficient to auto-merge and delete branches on this repo. There is no separate GitHub Actions workflow that runs `npm test` on PRs — test execution depends entirely on the Azure pipeline being healthy.

**Recommendation:** consolidate onto a single GitHub Actions test workflow (`.github/workflows/test.yml`) matrixed across the Node versions actually supported by the declared `runs.using` value, and either retire `azure-pipelines.yml` or confirm it's still wired up. Add a status badge to the README either way.

## Open pull requests (7)

| # | Title | Author | Opened | Mergeable | Notes |
|---|---|---|---|---|---|
| [#75](https://github.com/squalrus/merge-bot/pull/75) | Bump json5 from 2.2.0 to 2.2.3 | dependabot | 2023-01-07 | ✅ | dev dep |
| [#74](https://github.com/squalrus/merge-bot/pull/74) | Bump qs from 6.5.2 to 6.5.3 | dependabot | 2022-12-10 | ✅ | dev dep |
| [#73](https://github.com/squalrus/merge-bot/pull/73) | Bump decode-uri-component from 0.2.0 to 0.2.2 | dependabot | 2022-12-04 | ✅ | dev dep |
| [#72](https://github.com/squalrus/merge-bot/pull/72) | Make the action work with pull request comment event | umegaya (community) | 2022-11-04 | ✅ | Real feature contribution, unlabeled, never triaged |
| [#71](https://github.com/squalrus/merge-bot/pull/71) | Bump @actions/core from 1.2.6 to 1.9.1 | dependabot | 2022-08-18 | ✅ | Superseded by going straight to 3.0.1 |
| [#70](https://github.com/squalrus/merge-bot/pull/70) | Bump node-fetch from 2.6.1 to 2.6.7 | dependabot | 2022-06-25 | ✅ | dev dep |
| [#69](https://github.com/squalrus/merge-bot/pull/69) | Bump jsdom from 16.7.0 | dependabot | 2022-06-23 | ✅ | dev dep, superseded by a jest 30 upgrade |
| [#68](https://github.com/squalrus/merge-bot/pull/68) | Bump minimist from 1.2.5 to 1.2.6 | dependabot | 2022-03-24 | ✅ | dev dep |
| [#64](https://github.com/squalrus/merge-bot/pull/64) | Bump ansi-regex from 5.0.0 to 5.0.1 | dependabot | 2021-11-02 | ✅ | dev dep |
| [#12](https://github.com/squalrus/merge-bot/pull/12) | Resubmit reviews after push | squalrus (you) | 2019-10-04 | ❌ CONFLICTING | Your own 6-year-old branch, needs a decision: land or close |

**Recommendation:** most of the dependabot PRs are individually superseded by a single `jest`/`@actions/*` major-version upgrade — close them in favor of one consolidated dependency-update PR rather than merging piecemeal. #72 is the one PR that needs a real human decision (feature review), and #12 needs an explicit close-or-rebase call since it's your own stale work.

## Repository hygiene observations

- **22 stale branches on `origin`** with no corresponding open PR (e.g. `add-jest`, `azure-pipelines`, `fork-support`, `octomkit-api`, `test-branch`, plus 9 `dependabot/npm_and_yarn/*` branches left over from merged/closed PRs). None are merged into `master`. Worth pruning.
- No `.gitignore` at all — beyond `node_modules`, nothing is excluded from version control.
- No linter/formatter config (no ESLint, Prettier, or `.editorconfig`) and no `engines` field in `package.json` pinning a supported Node version for local development.
- No `SECURITY.md` or `CODEOWNERS`.
- Issue templates exist (`bug_report.md`, `feature_request.md`) but are the unmodified GitHub defaults (still reference "Smartphone" / "Desktop" fields, irrelevant for a GitHub Action).
- Test suite itself is in good shape: 7 suites, 39 tests, all passing, reasonable mock fixtures under `__mocks__/`.

## What's healthy / working well

- Core logic (`lib/pull.js`, `lib/config.js`, `lib/message.js`) is small, readable, and fully covered by tests.
- The "dogfooding" setup — using the action to merge its own PRs — is a nice validation loop when it's kept healthy.
- README input/output documentation is accurate and matches `action.yml` exactly.
- MIT license is clear and unambiguous (once `package.json` is corrected to match).

## Suggested triage order

1. ~~Fix `action.yml` runtime (`node12` → `node20`)~~ — done 2026-08-26.
2. Reconcile remaining `package.json` fields (name, license) with reality — version is now fixed and guarded.
3. Replace committed `node_modules` with an `ncc`-bundled `dist/` and a `.gitignore`.
4. Consolidate CI onto one GitHub Actions workflow; decide the fate of `azure-pipelines.yml`.
5. Upgrade `jest` to clear the bulk of `npm audit` findings; upgrade `@actions/core`/`@actions/github` deliberately (breaking API shape change).
6. Triage the 7 open PRs (close superseded dependency bumps, review #72, resolve #12).
7. Prune the 22 stale origin branches.
8. Add `dependabot.yml` so future dependency PRs are scheduled/grouped instead of arriving ad hoc.

These are tracked as individual items in [BACKLOG.md](BACKLOG.md).
