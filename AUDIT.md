# Repository Audit

_Last reviewed: 2026-08-26_

This document is a point-in-time health check of the `merge-bot` repository: what's open, what's outdated, what's risky, and what's just an observation. Re-run this audit periodically (see [BACKLOG.md](BACKLOG.md)) and update this file rather than letting it drift.

## Summary

After 5+ years without a code change, the repository had a concentrated remediation push on **2026-08-26** (v0.4.7 through v0.4.11: runtime fix, dependency upgrades, ESM migration, test coverage, `dist/` bundling, `package.json` cleanup, CI consolidation) plus CLAUDE.md/CONTRIBUTING.md/CHANGELOG.md/BACKLOG.md scaffolding — none of which had been reflected in this file's own status table until now. Every item in this audit's original "Critical items" and CI/CD sections is now fixed; what remains is long-tail PR/issue triage and lower-value hygiene items tracked in [BACKLOG.md](BACKLOG.md).

| Area | Status |
|---|---|
| Tests | ✅ Passing (50/50), 100% statement/branch coverage across `index.js` and `lib/` (was untested for `index.js` and had several dark branches before v0.4.9) |
| Action runtime | ✅ Fixed — now declares `node20` |
| Dependencies | ✅ Fixed — jest 26→30, @actions/core 1→3, @actions/github 4→9; `npm audit` 54 vulnerabilities → 0 |
| CI/CD | ✅ Fixed — `.github/workflows/test.yml` runs `npm test` on PRs (Node 20); `azure-pipelines.yml` (EOL Node 10, actively broken) removed |
| Open PRs | 🟠 9 open, oldest from 2019. #68 auto-closed itself 2026-08-26 as predicted below (advisory no longer applied post-v0.4.11) |
| Open issues | 🟠 8 open, oldest from 2019; checked against current code — 7 of 8 describe gaps that still exist |
| Repo hygiene | ✅ Fixed — `node_modules` no longer committed, now bundled via `ncc`; stale-branch picture improved (see below) |
| Docs | 🟢 CONTRIBUTING.md, CLAUDE.md, CHANGELOG.md, BACKLOG.md all added; README solid; still no SECURITY.md |

## Critical items

1. ~~`action.yml` declares `runs.using: node12`~~ — **fixed 2026-08-26**: GitHub Actions had removed the Node 12 and Node 16 runtimes (supported runtimes are `node20`/`node24`). `action.yml` now declares `node20`; the existing test suite (39/39) was re-run and passes under Node 22, exercising the same `@actions/core`/`@actions/github` call paths. ([action.yml](action.yml))
2. ~~`node_modules/` is committed to git~~ — **fixed 2026-08-26** ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)): the 6,630 tracked `node_modules/` files were removed in favor of a single `@vercel/ncc`-bundled `dist/index.js`, built from `index.js`/`lib/` via `npm run build`. `action.yml`'s `runs.main` now points at `dist/index.js`, a `.gitignore` was added, and [`.github/workflows/build-check.yml`](.github/workflows/build-check.yml) fails any PR where `dist/` doesn't match a fresh build, so it can't silently drift the way `package.json`'s version once did. Only production `dependencies` get bundled — `jest`/Babel/etc. (the source of most `npm audit` findings, see below) never ship in the action at all now, not just "aren't committed."
3. ~~**`package.json` metadata is inconsistent with reality**~~ — **fixed 2026-08-26**: `license` was `"ISC"` vs. the actual MIT `LICENSE` file; `name` was the placeholder `"github-actions"`, not `merge-bot`. Both now read correctly.
   - ~~`version: "0.2.1"` vs. latest tag `v0.4.5`~~ — **fixed 2026-08-26**: `package.json` now reads `0.4.5`, the README example pins `@v0.4.5`, and [`.github/workflows/version-check.yml`](.github/workflows/version-check.yml) fails any future tag push whose version doesn't match `package.json`, so this can't silently drift again. Release with `npm version` (see [CONTRIBUTING.md](CONTRIBUTING.md)), not a manual edit + tag.

## Dependency / upgrade status

Prod dependencies — **fixed in v0.4.11** ([released 2026-08-26](https://github.com/squalrus/merge-bot/compare/v0.4.10...v0.4.11)):

| Package | Old | New | Notes |
|---|---|---|---|
| `@actions/core` | 1.2.6 | 3.0.1 | **Upgraded.** Old version had a moderate advisory ([GHSA-7r3h-m5j6-3q42](https://github.com/advisories/GHSA-7r3h-m5j6-3q42)). No code changes required (API stable). |
| `@actions/github` | 4.0.0 | 9.1.1 | **Upgraded.** Octokit call sites in `index.js` updated from direct method calls (e.g. `octokit.pulls.listReviews`) to `.rest.*` namespace (v5+/v9 requires this shape). |
| `jest` (dev) | 26.6.3 | 30.4.2 | **Upgraded.** Bulk of `npm audit` findings (Babel, `ws`, `jsdom`, etc.) resolved. Jest 27+ config changes applied (test environment defaults, etc.). |
| `@vercel/ncc` (dev) | 0.38.4 | 0.45.0 | **Upgraded** to support ESM bundling (required because prod dependencies are now ESM-only). |

**ESM migration:** `@actions/core@3` and `@actions/github@9` export only ESM (`"type": "module"`), no CommonJS fallback. The entire codebase (`index.js`, `lib/`, tests, mocks) was converted from `require()`/`module.exports` to `import`/`export` to match. `package.json` declares `"type": "module"`. Jest runs with `--experimental-vm-modules` to support ESM test modules. This is a breaking change for any direct consumers of the source code (the npm package is not published; consumers import the bundled action via GitHub Actions only).

`npm audit` totals (re-checked 2026-08-26): **0 vulnerabilities** — down from 54. As of v0.4.8, dev-dependency advisories don't affect runtime anyway (`dist/index.js` bundles only production dependencies via `@vercel/ncc`), but clearing the local `npm audit` score improves CI/CD signaling and local dev hygiene.

Dependabot security-alert PRs (#64, #69–#75, open since 2021–2023) — #68 already auto-closed on 2026-08-26 as GitHub re-scanned the default branch post-v0.4.11 and found its advisory no longer applied; expect the rest to follow the same way over time, though they can also just be closed manually now. No `.github/dependabot.yml` exists (yet), so no version-updates schedule; the backlog has an item to add one.

## CI/CD pipelines

**Fixed 2026-08-26:** `azure-pipelines.yml` has been deleted and `.github/workflows/test.yml` added (`npm ci && npm test` on `actions/setup-node@v4` with `node-version: 20`, triggered on PRs to `master`), matching the pattern already used by `build-check.yml`. Verified locally: 50/50 tests pass under Node 20. A status badge was added to the README. This closes the backlog item "Consolidate CI onto a single GitHub Actions workflow."

Four systems now exist on GitHub Actions (no more Azure dependency):

- **`.github/workflows/test.yml`** *(new)* — runs `npm test` on PRs to `master`, Node 20. This is the CI test signal that was previously missing entirely (the old Azure pipeline was the only thing running `npm test`, and it was broken — see history below).
- **`.github/workflows/merge-bot.yml`** — the action *using itself* (`uses: squalrus/merge-bot@master`) to manage this repo's own PRs. Runs with `reviewers: false` and `checks_enabled: false`, meaning label alone (`ready`) is sufficient to auto-merge, and `delete_source_branch: false` — this repo's own bot-merged PRs do **not** get their branches deleted, which is one contributor to the stale-branch count below (though not the dominant one currently).
- **`.github/workflows/build-check.yml`** — added in [v0.4.8](https://github.com/squalrus/merge-bot/pull/81). Rebuilds `dist/` on every PR to `master` and fails if it doesn't match a fresh `npm run build`.
- **`.github/workflows/version-check.yml`** — added alongside the `package.json` version fix. Fails a tag push if it doesn't match `package.json`'s version.

**Retired:** `azure-pipelines.yml` (ran `npm install -g jest --save-dev && npm install && npm test` on **Node 10.x**, EOL April 2021, triggered on PRs to `master`). It was actively broken as of 2026-08-26: the global `npm install -g jest` step pulled Jest 30.x, whose `jest-resolve` dependency (`unrs-resolver`, a native module) fails its postinstall script under Node 10.x. No fix was applied — it was deleted outright, since `test.yml` supersedes it and the Node 10.x pin was obsolete regardless.

## Open pull requests (9)

**Status update (2026-08-26):** #81 (the `node_modules`/`dist` bundling fix) has since merged as v0.4.8, and #68 ("Bump minimist") auto-closed itself today, exactly as this audit previously predicted — its advisory no longer applies now that dev dependencies don't ship in `dist/`. Re-checked live via `gh pr list`; 9 remain open, table below reflects current state.

| # | Title | Author | Opened | Mergeable | Notes |
|---|---|---|---|---|---|
| [#75](https://github.com/squalrus/merge-bot/pull/75) | Bump json5 from 2.2.0 to 2.2.3 | dependabot | 2023-01-07 | ❌ CONFLICTING | dev dep |
| [#74](https://github.com/squalrus/merge-bot/pull/74) | Bump qs from 6.5.2 to 6.5.3 | dependabot | 2022-12-10 | ❌ CONFLICTING | dev dep |
| [#73](https://github.com/squalrus/merge-bot/pull/73) | Bump decode-uri-component from 0.2.0 to 0.2.2 | dependabot | 2022-12-04 | ❌ CONFLICTING | dev dep |
| [#72](https://github.com/squalrus/merge-bot/pull/72) | Make the action work with pull request comment event | umegaya (community) | 2022-11-04 | ⚠️ UNKNOWN | Real feature contribution, unlabeled, never triaged |
| [#71](https://github.com/squalrus/merge-bot/pull/71) | Bump @actions/core from 1.2.6 to 1.9.1 | dependabot | 2022-08-18 | ❌ CONFLICTING | Superseded by going straight to 3.0.1 |
| [#70](https://github.com/squalrus/merge-bot/pull/70) | Bump node-fetch from 2.6.1 to 2.6.7 | dependabot | 2022-06-25 | ❌ CONFLICTING | dev dep |
| [#69](https://github.com/squalrus/merge-bot/pull/69) | Bump jsdom from 16.4.0 to 16.7.0 | dependabot | 2022-06-23 | ❌ CONFLICTING | dev dep, superseded by the jest 30 upgrade |
| [#64](https://github.com/squalrus/merge-bot/pull/64) | Bump ansi-regex from 5.0.0 to 5.0.1 | dependabot | 2021-11-02 | ❌ CONFLICTING | dev dep |
| [#12](https://github.com/squalrus/merge-bot/pull/12) | Resubmit reviews after push | squalrus (you) | 2019-10-04 | ⚠️ UNKNOWN | Your own 6-year-old branch, needs a decision: land or close |

**Recommendation:** all 7 remaining dependabot PRs now show CONFLICTING (they've drifted further as `package.json`/`package-lock.json` changed underneath them this session) and are individually superseded by the v0.4.11 `jest`/`@actions/*` upgrade — close them rather than attempting to rebase and merge piecemeal. #72 is the one PR that needs a real human decision (feature review), and #12 needs an explicit close-or-rebase call since it's your own stale work. This matches the backlog item "Triage the 7 open pull requests" (written when #68 was still counted; it's now 6 dependabot PRs plus #64, which the backlog text omitted).

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

- **Stale-branch picture re-checked 2026-08-26** (`git fetch --prune` + `git branch -r --no-merged`): the "22 stale branches" figure was stale itself — it included local tracking refs for branches already deleted on GitHub. The real current count on `origin` is 7 (`dependabot/npm_and_yarn/*`) + 1 (`resubmit-reviews`), and **every one of them backs a currently-open PR** (the 7 dependabot PRs plus #12) — so by the backlog item's own definition ("no corresponding open PR"), there are zero prunable branches on `origin` right now. Pruning is blocked on the PR triage above, not a standalone task; revisit the branch list once those PRs are closed. (The `aaron-trout/*` branches seen in a naive `git branch -r` are on a separate fork remote added to this local clone for reviewing #72 — not part of `squalrus/merge-bot` and not this repo's to prune.) Separately, `.github/workflows/merge-bot.yml` sets `delete_source_branch: false`, so this repo's own bot-merged PRs (labeled `ready`) don't get branch cleanup for free — worth flipping to `true` if branch buildup becomes a recurring nuisance.
- ~~No `.gitignore` at all~~ — **fixed 2026-08-26**: added alongside the `node_modules` removal ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)); currently just ignores `node_modules/`.
- ~~No linter/formatter config (no ESLint, Prettier, or `.editorconfig`) and no `engines` field in `package.json` pinning a supported Node version for local development~~ — **fixed 2026-08-26** (v0.4.14): added `eslint.config.js` (ESLint 9.x, pinned to the maintenance line since 10.x needs a newer Node patch than some dev machines have) enforcing the documented 4-space-indent/semicolon style, plus `.editorconfig` and `engines.node: ">=20"` matching `action.yml`'s runtime.
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
4. ~~Consolidate CI onto one GitHub Actions workflow; decide the fate of `azure-pipelines.yml`~~ — done 2026-08-26: `.github/workflows/test.yml` added, `azure-pipelines.yml` removed.
5. ~~Upgrade `jest` to clear the bulk of `npm audit` findings; upgrade `@actions/core`/`@actions/github` deliberately~~ — done 2026-08-26 (v0.4.11).
6. Triage the 9 remaining open PRs (close the 7 superseded dependency bumps, review #72's feature contribution on its merits, resolve #12 close-or-rebase).
7. Add `dependabot.yml` so future dependency PRs are scheduled/grouped instead of arriving ad hoc.
8. Revisit stale-branch pruning once #6 lands — currently zero `origin` branches lack an open PR, so there's nothing to prune yet.

These are tracked as individual items in [BACKLOG.md](BACKLOG.md).
