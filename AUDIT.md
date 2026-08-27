# Repository Audit

_Last reviewed: 2026-08-27_

This document is a point-in-time health check of the `merge-bot` repository: what's open, what's outdated, what's risky, and what's just an observation. Re-run this audit periodically (see [BACKLOG.md](BACKLOG.md)) and update this file rather than letting it drift.

## Summary

After the 2026-08-26 remediation push (v0.4.7 through v0.4.17: runtime fix, dependency upgrades, ESM migration, test coverage, `dist/` bundling, CI consolidation, `dependabot.yml`, `CODEOWNERS`/`SECURITY.md`) covered in this audit's prior revision, the same day's second half closed out the PR/issue backlog itself: all 9 open PRs were triaged to zero, one community feature (comment-triggered re-evaluation, #72) was ported to the current codebase and merged, a real bug it surfaced along the way was fixed, and a second, more fundamental bug was discovered and documented. A third pass (v0.5.1) then fixed #77, the confirmed crash-on-every-push bug that had been the top-priority open issue, and updated [BACKLOG.md](BACKLOG.md)'s shipping checklist to require linking/attributing/closing the GitHub issue behind any shipped item going forward. A fourth pass (v0.5.5, 2026-08-27) fixed #37's missing `requested_teams` handling and added a [MIGRATION.md](MIGRATION.md) guide for consumers still pinned to `v0.4.5`. A fifth pass (v0.6.0, 2026-08-27) closed #22 by re-fetching and re-evaluating a PR's associated pull requests on `check_suite` completion. **Zero PRs are open, zero stale branches remain on `origin`, and the two forks with any independent activity (`umegaya`, `comnoco`) have nothing left worth pulling in.** What remains is 5 long-standing community feature/bug issues (down from 8 — none of the rest touch code that moved this session) plus the still-open fork-merge-token limitation, all in [BACKLOG.md](BACKLOG.md).

| Area | Status |
|---|---|
| Tests | ✅ Passing (59/59), 100% statement/branch coverage across `index.js` and `lib/` |
| Action runtime | ✅ `node20` |
| Dependencies | ✅ `npm audit`: 0 vulnerabilities; `.github/dependabot.yml` scheduling weekly scans |
| CI/CD | ✅ `test.yml` / `build-check.yml` / `version-check.yml` / `merge-bot.yml` (now also triggers on `issue_comment`, see below) |
| Open PRs | 🟢 **0 open** — all 9 triaged this session (7 dependabot closed as superseded, #12 closed as stale, #72 ported and merged) |
| Open issues | 🟢 8 open on GitHub as of this writing, but #77 (v0.5.1), #37 (v0.5.5), and #22 (v0.6.0, this shipment) are fixed and will auto-close on merge, leaving 5 |
| Repo hygiene | ✅ Zero stale branches on `origin` (was 8); `CODEOWNERS`, `SECURITY.md`, `dependabot.yml` all present |
| Known issues (undocumented) | ✅ Fixed in v0.5.2: fork PRs couldn't be merged via the `labeled` trigger — a GitHub platform token restriction, not a code bug. See below. |
| Docs | 🟡 CLAUDE.md and CONTRIBUTING.md both contain **stale, incorrect** claims about the current octokit API shape and pinned dependency version — see "Documentation drift" below. |

## Documentation drift discovered this session

Both [CLAUDE.md](CLAUDE.md) ("Known constraints") and [CONTRIBUTING.md](CONTRIBUTING.md) ("Known rough edges") state that `@actions/github` is "pinned at v4" and that `index.js` calls octokit methods directly (e.g. `octokit.pulls.listReviews`) rather than under `.rest.*`. **Both claims are wrong as of the current code**: `package.json` has `@actions/github` at `^9.1.1`, and every call site in `index.js` already uses `.rest.*` (`octokit.rest.pulls.listReviews`, etc.) — this was fixed in the v0.4.11 ESM migration, which predates this session. Neither doc was updated when that migration landed, so both have been giving incorrect guidance (they'd steer a future contributor away from a `@actions/github` upgrade that's already been done, or cause confusion when the actual call shape doesn't match what's documented). Not fixed as part of this audit pass since it's out of this task's scope — worth a small dedicated doc-fix PR.

## Critical items (all fixed, kept for history)

1. ~~`action.yml` declares `runs.using: node12`~~ — fixed 2026-08-26. Now declares `node20`. ([action.yml](action.yml))
2. ~~`node_modules/` is committed to git~~ — fixed 2026-08-26 ([v0.4.8](https://github.com/squalrus/merge-bot/pull/81)): bundled via `@vercel/ncc` into `dist/index.js`, `.gitignore` added, [`build-check.yml`](.github/workflows/build-check.yml) guards against drift.
3. ~~`package.json` metadata inconsistent with reality~~ (license, name, version) — fixed 2026-08-26; [`version-check.yml`](.github/workflows/version-check.yml) now guards the version field against drift.

## Dependency / upgrade status

Unchanged since the v0.4.11 upgrade (`@actions/core` 1→3, `@actions/github` 4→9, `jest` 26→30) — no dependency work happened this session beyond what dependabot's own scheduled PRs will bring going forward.

`npm audit` (re-checked 2026-08-26): **0 vulnerabilities**.

**Dependabot PRs — resolved 2026-08-26.** The 7 long-open dependabot PRs (#64, #69–#71, #73–#75) were all closed as superseded: each target dependency was already at or past the proposed version, or no longer in the tree at all, following the v0.4.11 upgrade. [`.github/dependabot.yml`](.github/dependabot.yml) (added in v0.4.17) now schedules weekly `npm` scans with dev-dependency bumps grouped into a single PR, so future dependency PRs should arrive in scheduled batches instead of drifting open for years.

## CI/CD pipelines

Unchanged from the prior audit's fixed state (`test.yml`, `build-check.yml`, `version-check.yml`, Azure retired), plus one addition:

- **`.github/workflows/merge-bot.yml`** now also triggers on `issue_comment: [created]` (added in v0.4.18), gated by `if: github.event_name != 'issue_comment' || github.event.issue.pull_request` so it's a no-op for comments on plain issues. This exists to support #72's comment-triggered re-evaluation (see below) — useful for retrying after a transient "Base branch was modified" failure by commenting on the PR instead of re-labeling it.

## Open pull requests (0)

**All 9 triaged and closed out 2026-08-26** — none remain open.

| # | Title | Resolution |
|---|---|---|
| #64, #69, #70, #71, #73, #74, #75 | dependabot dependency bumps | Closed as superseded — target versions already met or packages no longer in the tree post-v0.4.11 |
| #12 | Resubmit reviews after push (squalrus, 2019) | Closed as stale — branch predated the ESM/`octokit.rest.*` rewrite and couldn't be rebased cleanly. Its idea (re-request review from prior approvers on push) is folded into the [Remove label / re-request review on commit](BACKLOG.md#remove-label--re-request-review-on-commit) backlog item as prior art |
| #72 | Make the action work with pull request comment event (umegaya, 2022) | Ported to the current ESM/`octokit.rest.*` codebase (original author kept as commit co-author), reviewed, CI verified green, **merged** as part of v0.5.0. Along the way, testing it live surfaced and led to fixing a real bug (below) and discovering a second, more fundamental one (also below) |

**Bug found and fixed while validating #72's checks:** [index.js](index.js#L33) queried `checks.listForRef` using the head *branch name*, which only resolves within the repo that branch lives in — for a fork PR (like #72) the branch lives in the fork, not the base repo, so the lookup 404'd with "No commit found for SHA: `<branch>`". Surfaced live by this repo's own dogfooding `Merge` workflow failing on #72. Fixed in v0.4.19 to query by the head SHA instead, which resolves regardless of which repo the branch physically lives in.

**Bug found and NOT yet fixed — fork PRs structurally can't be merged via the `labeled` trigger:** after the above fix, labeling #72 to trigger a merge got as far as `canMerge() === true` and then failed at the actual `octokit.rest.pulls.merge` call with "Resource not accessible by integration". This is a GitHub platform restriction, not a merge-bot bug: for `pull_request`-family events (`labeled`, `synchronize`, etc.) triggered by a PR from a forked repository, `GITHUB_TOKEN` is **always** read-only, regardless of the repo's own workflow-permissions default (confirmed this repo's default is "write" — doesn't matter here). #72 had to be merged manually via `gh pr merge` to work around it. This means **no fork-originated PR can be auto-merged by this bot today, regardless of labels** — likely relevant often, given 12 forks exist. Tracked as [Fork PRs can't be auto-merged via the labeled trigger](BACKLOG.md#fork-prs-cant-be-auto-merged-via-the-labeled-trigger) in the backlog; the fix is switching `merge-bot.yml`'s `pull_request:` trigger to `pull_request_target:`, which is safe here specifically because the workflow never checks out or executes the fork's code.

## Fork survey (2026-08-26)

Checked the two forks with any independent activity beyond a stock fork:

- **[umegaya/merge-bot](https://github.com/umegaya/merge-bot)** — nothing left to capture; its only unique work was #72, now merged.
- **[comnoco/merge-bot](https://github.com/comnoco/merge-bot)** — diverged independently in 2022–2023 and did its own Node 12→16→20 runtime upgrade and dependency bumps, but every bit of it is superseded by this repo's own history (already on `node20`; their three open dependabot branches propose *older* versions than what's already in `package.json`). Never opened a PR against this repo, so none of it was ever proposed here. Nothing worth backporting.

## Open issues (5, was 8)

Re-checked against current code (`lib/pull.js`, `lib/config.js`, `index.js`). #77 (v0.5.1), #37 (v0.5.5), and #22 (v0.6.0, this shipment) are fixed and will close automatically on merge (`Fixes #<n>` in each PR body) — the other 5 are unchanged, since none of this session's code changes touched the areas they report on.

| # | Title | Author | Opened | Still valid? |
|---|---|---|---|---|
| ~~[#77](https://github.com/squalrus/merge-bot/issues/77)~~ | Error: Cannot read properties of undefined (reading 'labels') | chickenandpork (community) | 2023-08-24 | ✅ **Fixed in v0.5.1** — `index.js` now guards on `payload.pull_request` existing before constructing `Pull`, no-oping cleanly on non-PR events (e.g. `push`) instead of crashing |
| [#59](https://github.com/squalrus/merge-bot/issues/59) | Time based allow/block of merges | alper (community) | 2021-06-15 | ✅ Still unimplemented |
| [#56](https://github.com/squalrus/merge-bot/issues/56) | Allow merges even if the base branch changes | RevolutionTech (community) | 2021-04-28 | ✅ Still unimplemented |
| ~~[#37](https://github.com/squalrus/merge-bot/issues/37)~~ | Not detecting reviews? | aaron-trout (community) | 2020-09-03 | ✅ **Fixed in v0.5.5** — `Pull` now reads `requested_teams` alongside `requested_reviewers`, so a pending CODEOWNERS team review blocks merge instead of being silently ignored |
| ~~[#22](https://github.com/squalrus/merge-bot/issues/22)~~ | Re-trigger Action when checks complete | squalrus (you) | 2020-01-26 | ✅ **Fixed in v0.6.0** — `index.js` now handles `check_suite` completion events, re-fetching and re-evaluating each associated pull request; the README's example workflow adds a `check_suite: [completed]` trigger |
| [#14](https://github.com/squalrus/merge-bot/issues/14) | follow the configured required review count | Evanion (community) | 2019-12-20 | ✅ Still true |
| [#13](https://github.com/squalrus/merge-bot/issues/13) | Update from base branch before merging. | Evanion (community) | 2019-12-20 | ✅ Still true |
| [#7](https://github.com/squalrus/merge-bot/issues/7) | Feature: on commit, remove label(?) or Re-request review(?) | squalrus (you) | 2019-09-27 | ✅ Still true |

**Recommendation:** with #77, #37, #22, and the fork-merge-token limitation all shipped (v0.5.1, v0.5.5, v0.6.0, v0.5.2), the remaining community feature/bug issues are all low-urgency at your own pace.

## Repository hygiene observations

- **Zero stale branches on `origin`** (re-checked 2026-08-26, was 8 in the prior audit): all 7 dependabot branches were auto-deleted by GitHub when their PRs closed; the one remaining (`resubmit-reviews`, backing #12) was manually deleted after that PR closed. `origin` now has exactly one branch: `main`. `.github/workflows/merge-bot.yml` still sets `delete_source_branch: false` for this repo's own bot-merged PRs — worth flipping to `true` if branch buildup becomes a recurring nuisance again.
- ~~No `SECURITY.md` or `CODEOWNERS`~~ — **fixed** (v0.4.15, predates this session but wasn't reflected in the prior audit's status table): both now exist.
- ~~No `.github/dependabot.yml`~~ — **fixed** (v0.4.17, predates this session): weekly `npm` scans, dev-dependency bumps grouped.
- **New this session:** CLAUDE.md and CONTRIBUTING.md both contain stale/incorrect claims about the octokit API shape and `@actions/github` version — see "Documentation drift" above.
- Issue templates exist (`bug_report.md`, `feature_request.md`); `bug_report.md` was tidied for a GitHub Action's actual fields in v0.4.13, `feature_request.md` is still the unmodified GitHub default.
- Test suite: 8 suites / 56 tests, 100% statement/branch/function/line coverage (was 50 tests two audits ago; +4 from `issue_comment` handling, fork-SHA regression, #72's own coverage, and #77's non-PR-payload regression, then +2 from v0.5.5's team-review-request coverage for #37).
- **New this session:** [BACKLOG.md](BACKLOG.md)'s "Shipping a backlog item" checklist now requires, for any item traced to a GitHub issue: linking the issue and crediting the reporter in the CHANGELOG entry, including `Fixes #<n>`/`Closes #<n>` in the shipping PR body, and verifying post-merge that the issue actually auto-closed.

## What's healthy / working well

- Core logic (`lib/pull.js`, `lib/config.js`, `lib/message.js`) and `index.js` are small, readable, and fully covered by tests.
- The "dogfooding" setup — using the action to merge its own PRs — caught two real bugs this session (the fork checks-lookup 404, and the fork merge-token restriction) that would otherwise have shipped silently and only surfaced when an external contributor's PR failed to merge.
- README input/output documentation is accurate and matches `action.yml`.
- Maintainer-can-modify was used successfully to update a stale external contribution (#72) in place while preserving the original author's commit and crediting them as co-author — worth remembering as the pattern for future stale-but-valuable community PRs.

## Suggested triage order

1. ~~Fix `action.yml` runtime, `node_modules`, `package.json` metadata, CI consolidation, dependency upgrades~~ — done (prior session, v0.4.7–v0.4.11).
2. ~~Triage the 9 open PRs~~ — done 2026-08-26 (this session): 7 dependabot closed, #12 closed, #72 ported and merged.
3. ~~Prune stale branches~~ — done 2026-08-26 (this session): zero remain on `origin`.
4. ~~Fix #77 (crash on non-PR events)~~ — done 2026-08-26, shipped as v0.5.1.
5. ~~Fix the fork-merge-token limitation~~ — done 2026-08-26, shipped as v0.5.2 (`pull_request` → `pull_request_target` in `merge-bot.yml`).
6. ~~Fix #37 (team-requested reviews not detected)~~ — done 2026-08-27, shipped as v0.5.5.
7. Fix the CLAUDE.md/CONTRIBUTING.md stale-claims doc drift — small, prevents a future contributor from being misled.
8. ~~Fix #22 (re-trigger on check completion)~~ — done 2026-08-27, shipped as v0.6.0.
9. Work through the remaining community feature requests (#7, #13, #14, #56, #59) at your own pace — none are urgent, all are still genuinely wanted as far as this audit can tell.

These are tracked as individual items in [BACKLOG.md](BACKLOG.md).
