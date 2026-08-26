# Repository Audit

_Last reviewed: 2026-08-26_

This document is a point-in-time health check of the `merge-bot` repository: what's open, what's outdated, what's risky, and what's just an observation. Re-run this audit periodically (see [BACKLOG.md](BACKLOG.md)) and update this file rather than letting it drift.

## Summary

The action works and its test suite passes, but the project has had no code changes since **2021-04-24** (5+ years) while still being actively consumed (it merges its own PRs via `.github/workflows/merge-bot.yml`). The most urgent issue — the GitHub Actions runtime it declared (`node12`) having been removed by GitHub — was fixed 2026-08-26.

| Area | Status |
|---|---|
| Tests | ✅ Passing (50/50), 100% statement/branch coverage across `index.js` and `lib/` (was untested for `index.js` and had several dark branches before v0.4.9) |
| Action runtime | ✅ Fixed — now declares `node20` |
| Dependencies | 🟠 Multiple majors behind, security advisories open |
| CI/CD | 🟠 Split across two unmonitored systems, one on EOL Node; a `dist/` staleness check is now in place |
| Open PRs | 🟠 8 open (incl. the `v0.4.8` fix PR above), oldest from 2019 |
| Open issues | 🟠 8 open, oldest from 2019; checked against current code — 7 of 8 describe gaps that still exist |
| Repo hygiene | ✅ Fixed — `node_modules` no longer committed, now bundled via `ncc`; 22 stale branches remain |
| Docs | 🟡 README solid but no CONTRIBUTING/CLAUDE/SECURITY |

## Critical items

1. ~~`action.yml` declares `runs.using: node12`~~ — **fixed 2026-08-26**: GitHub Actions had removed the Node 12 and Node 16 runtimes (supported runtimes are `node20`/`node24`). `action.yml` now declares `node20`; the existing test suite (39/39) was re-run and passes under Node 22, exercising the same `@actions/core`/`@actions/github` call paths. ([action.yml](action.yml))
2. ~~`node_modules/` is committed to git~~ — **fixed 2026-08-26** ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)): the 6,630 tracked `node_modules/` files were removed in favor of a single `@vercel/ncc`-bundled `dist/index.js`, built from `index.js`/`lib/` via `npm run build`. `action.yml`'s `runs.main` now points at `dist/index.js`, a `.gitignore` was added, and [`.github/workflows/build-check.yml`](.github/workflows/build-check.yml) fails any PR where `dist/` doesn't match a fresh build, so it can't silently drift the way `package.json`'s version once did. Only production `dependencies` get bundled — `jest`/Babel/etc. (the source of most `npm audit` findings, see below) never ship in the action at all now, not just "aren't committed."
3. ~~**`package.json` metadata is inconsistent with reality**~~ — **fixed 2026-08-26**: `license` was `"ISC"` vs. the actual MIT `LICENSE` file; `name` was the placeholder `"github-actions"`, not `merge-bot`. Both now read correctly.
   - ~~`version: "0.2.1"` vs. latest tag `v0.4.5`~~ — **fixed 2026-08-26**: `package.json` now reads `0.4.5`, the README example pins `@v0.4.5`, and [`.github/workflows/version-check.yml`](.github/workflows/version-check.yml) fails any future tag push whose version doesn't match `package.json`, so this can't silently drift again. Release with `npm version` (see [CONTRIBUTING.md](CONTRIBUTING.md)), not a manual edit + tag.

## Dependency / upgrade status

Prod dependencies (`npm outdated`):

| Package | Current | Latest | Notes |
|---|---|---|---|
| `@actions/core` | 1.2.6 | 3.0.1 | Two majors behind; current version has a moderate advisory ([GHSA-7r3h-m5j6-3q42](https://github.com/advisories/GHSA-7r3h-m5j6-3q42)) fixed by upgrading. |
| `@actions/github` | 4.0.0 | 9.1.1 | Five majors behind. `index.js` calls REST methods directly on the octokit client (e.g. `octokit.pulls.listReviews`) rather than under `.rest.*`, which is the v4-era API shape — upgrading is a breaking change for this code, not a drop-in bump. |
| `jest` (dev) | 26.6.3 | 30.4.2 | Four majors behind. Most of the `npm audit` noise (Babel, `ws`, etc.) comes from this dependency's transitive tree, not from anything shipped in the action itself. |

`npm audit` totals (re-checked 2026-08-26): **54 vulnerabilities** (6 critical, 15 high, 32 moderate, 1 low) — drifted slightly from the previous count as upstream advisories shift, not from anything changed in this repo. The prod-facing surface is small (`@actions/core`, `@actions/github`, and their transitive deps); the bulk of the critical/high findings are in the `jest` 26 dev toolchain and would clear substantially by upgrading `jest` alone. As of [v0.4.8](https://github.com/squalrus/merge-bot/pull/81), the dev-toolchain findings no longer matter for what actually *runs*: `dist/index.js` is bundled with `@vercel/ncc`, which only pulls in `dependencies`, so `jest`/Babel/etc. never ship in the action regardless of this audit's local `npm audit` numbers. Upgrading `jest` is still worth doing for local dev hygiene, just no longer a runtime security question.

No `.github/dependabot.yml` exists in the repo, yet Dependabot has opened PRs (#68–#75) — this is GitHub's automatic security-update behavior, not a configured `version-updates` schedule. Without a config file there's no grouping, no schedule, and no policy for how these PRs get triaged, which is consistent with 6 of them sitting open since 2021–2023.

## CI/CD pipelines

Three separate systems exist, still not consolidated:

- **`azure-pipelines.yml`** — runs `npm install -g jest --save-dev && npm install && npm test` on `pool: ubuntu-latest`, pinned to **Node 10.x** (EOL April 2021). Triggers on PRs to `master`. **Confirmed active and currently broken (2026-08-26):** the global `jest` install pulls latest Jest (30.x), whose `jest-resolve` now depends on `unrs-resolver`, a native module whose postinstall fails under Node 10.x — every run currently errors before tests even execute. There is no badge or reference to it from the README. See the backlog item for the fix.
- **`.github/workflows/merge-bot.yml`** — this is the action *using itself* (`uses: squalrus/merge-bot@master`) to manage this repo's own PRs. It runs with `reviewers: false` and `checks_enabled: false`, meaning label alone (`ready`) is sufficient to auto-merge and delete branches on this repo. There is no separate GitHub Actions workflow that runs `npm test` on PRs — test execution depends entirely on the Azure pipeline being healthy.
- **`.github/workflows/build-check.yml`** — added in [v0.4.8](https://github.com/squalrus/merge-bot/pull/81). Rebuilds `dist/` on every PR to `master` and fails if it doesn't match a fresh `npm run build`, so the committed bundle can't drift from `index.js`/`lib/`. This doesn't run `npm test` — it only guards the build artifact, so the "no working CI test signal on PRs" gap below is unchanged by it.

**Recommendation:** consolidate onto a single GitHub Actions test workflow (`.github/workflows/test.yml`) matrixed across the Node versions actually supported by the declared `runs.using` value, and either retire `azure-pipelines.yml` or confirm it's still wired up. Add a status badge to the README either way.

## Open pull requests (8)

| # | Title | Author | Opened | Mergeable | Notes |
|---|---|---|---|---|---|
| [#81](https://github.com/squalrus/merge-bot/pull/81) | v0.4.8 — bundle with ncc, remove committed node_modules | squalrus (you) | 2026-08-26 | ✅ | The `node_modules`/`dist` fix described throughout this audit; awaiting merge. |
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

**Recommendation:** merge #81 (it's the fix this audit tracks). Most of the dependabot PRs are individually superseded by a single `jest`/`@actions/*` major-version upgrade — close them in favor of one consolidated dependency-update PR rather than merging piecemeal. #72 is the one PR that needs a real human decision (feature review), and #12 needs an explicit close-or-rebase call since it's your own stale work.

## Open issues (8)

Checked each against the current code (`lib/pull.js`, `lib/config.js`, `index.js`), not just left as reported — since none of it has changed since 2021, most are still exactly as described.

| # | Title | Author | Opened | Still valid? | Notes |
|---|---|---|---|---|---|
| [#77](https://github.com/squalrus/merge-bot/issues/77) | Error: Cannot read properties of undefined (reading 'labels') | chickenandpork (community) | 2023-08-24 | ✅ Confirmed, reproducible | [Pull's constructor](lib/pull.js#L3) does `payload.pull_request.labels.map(...)` unconditionally. The reporter's workflow triggers on `push` in addition to `pull_request`; a `push` event payload has no `pull_request` object at all, so this throws on every push. `index.js` never checks that `github.context.payload.pull_request` exists before constructing `Pull`. |
| [#59](https://github.com/squalrus/merge-bot/issues/59) | Time based allow/block of merges | alper (community) | 2021-06-15 | ✅ Still unimplemented | [lib/config.js](lib/config.js) has no time-window input, and nothing in `Pull.canMerge` consults a clock. Net-new feature — no work started. |
| [#56](https://github.com/squalrus/merge-bot/issues/56) | Allow merges even if the base branch changes | RevolutionTech (community) | 2021-04-28 | ✅ Still unimplemented | [index.js](index.js#L57) calls `octokit.pulls.merge` with no retry logic; a "base branch was modified" failure from a concurrent merge just bubbles up to `core.setFailed`. Nothing tolerates or retries on base drift. |
| [#37](https://github.com/squalrus/merge-bot/issues/37) | Not detecting reviews? | aaron-trout (community) | 2020-09-03 | 🟡 Partially explained | [Pull's constructor](lib/pull.js#L10) reads only `payload.pull_request.requested_reviewers` — it never looks at `requested_teams`. A CODEOWNERS rule assigning a *team* (as in the report) won't show up there. Combined with no re-trigger on review submission (see #22), a stale payload at merge time is the likely proximate cause, but the missing `requested_teams` handling is a real, still-current gap in its own right. |
| [#22](https://github.com/squalrus/merge-bot/issues/22) | Re-trigger Action when checks complete | squalrus (you) | 2020-01-26 | ✅ Still true | The action runs once per triggering event and never requeues itself; [.github/workflows/merge-bot.yml](.github/workflows/merge-bot.yml) doesn't listen for `check_suite`/`workflow_run`/`pull_request_review` completion, so a check finishing after the bot's last run won't cause a re-evaluation. |
| [#14](https://github.com/squalrus/merge-bot/issues/14) | follow the configured required review count | Evanion (community) | 2019-12-20 | ✅ Still true | [lib/config.js:6](lib/config.js#L6) `review_required` is a plain boolean; [Pull.isReviewComplete](lib/pull.js#L20) requires 100% of `requested_reviewers` to approve, with no concept of a numeric threshold or the repo's actual branch-protection required-approval count. |
| [#13](https://github.com/squalrus/merge-bot/issues/13) | Update from base branch before merging. | Evanion (community) | 2019-12-20 | ✅ Still true | No call to `pulls.updateBranch` (or equivalent) anywhere in the codebase — the bot never brings a PR branch up to date with base before merging. |
| [#7](https://github.com/squalrus/merge-bot/issues/7) | Feature: on commit, remove label(?) or Re-request review(?) | squalrus (you) | 2019-09-27 | ✅ Still true | No label-removal or re-review-request logic exists anywhere in `index.js`/`lib/`. |

**Recommendation:** #77 is the one that should be prioritized above the others — it's a confirmed crash-on-every-push bug affecting a real user today, not a feature request, and the fix (guard on `payload.pull_request` before constructing `Pull`, in [index.js](index.js#L16)) is small and self-contained. The rest are long-standing feature requests that are all still genuinely open against today's code; worth a pass to confirm which are still wanted versus safe to close as stale, but none can be closed as "already fixed."

## Repository hygiene observations

- **22 stale branches on `origin`** with no corresponding open PR (e.g. `add-jest`, `azure-pipelines`, `fork-support`, `octomkit-api`, `test-branch`, plus 9 `dependabot/npm_and_yarn/*` branches left over from merged/closed PRs). None are merged into `master`. Worth pruning. (This count predates the `v0.4.8` branch itself, which is expected to merge and be deleted normally.)
- ~~No `.gitignore` at all~~ — **fixed 2026-08-26**: added alongside the `node_modules` removal ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)); currently just ignores `node_modules/`.
- No linter/formatter config (no ESLint, Prettier, or `.editorconfig`) and no `engines` field in `package.json` pinning a supported Node version for local development.
- No `SECURITY.md` or `CODEOWNERS`.
- Issue templates exist (`bug_report.md`, `feature_request.md`) but are the unmodified GitHub defaults (still reference "Smartphone" / "Desktop" fields, irrelevant for a GitHub Action).
- ~~`index.js` (the action's entry point) had zero test coverage~~ — **fixed 2026-08-26** (v0.4.9): `__tests__/index.test.js` now mocks `@actions/core`/`@actions/github` and exercises test-mode commenting, merge + branch deletion, the fork-retains-branch path, the `canMerge=false` no-op path, and an API-failure → `core.setFailed` path. Combined with new tests closing a handful of previously-dark branches in `lib/` (an out-of-order review resubmission, a missing checks payload, `renderMessage`'s mergeable case, and `Config`'s `test`/`delete_source_branch` flags never having been asserted `true`), the suite is now 8 suites / 50 tests at 100% statement/branch/function/line coverage.
- Test suite itself is in good shape: reasonable mock fixtures under `__mocks__/`, one file per concern.

## What's healthy / working well

- Core logic (`lib/pull.js`, `lib/config.js`, `lib/message.js`) and the `index.js` entry point are small, readable, and fully covered by tests (100% statement/branch coverage as of v0.4.9).
- The "dogfooding" setup — using the action to merge its own PRs — is a nice validation loop when it's kept healthy.
- README input/output documentation is accurate and matches `action.yml` exactly.
- MIT license is clear and unambiguous, and `package.json` now correctly reflects it.

## Suggested triage order

1. ~~Fix `action.yml` runtime (`node12` → `node20`)~~ — done 2026-08-26.
2. ~~Reconcile remaining `package.json` fields (name, license) with reality~~ — done 2026-08-26; version was already fixed and guarded.
3. ~~Replace committed `node_modules` with an `ncc`-bundled `dist/` and a `.gitignore`~~ — done 2026-08-26 ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)).
4. Consolidate CI onto one GitHub Actions workflow (`npm test`, not just the new build-check); decide the fate of `azure-pipelines.yml`.
5. Upgrade `jest` to clear the bulk of `npm audit` findings; upgrade `@actions/core`/`@actions/github` deliberately (breaking API shape change).
6. Merge #81, then triage the remaining 7 open PRs (close superseded dependency bumps, review #72, resolve #12).
7. Prune the 22 stale origin branches.
8. Add `dependabot.yml` so future dependency PRs are scheduled/grouped instead of arriving ad hoc.

These are tracked as individual items in [BACKLOG.md](BACKLOG.md).
