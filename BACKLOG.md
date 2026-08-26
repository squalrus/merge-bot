# Backlog

Tracks future features, improvements, and known bugs. Items here are not committed work — they're candidates.

## Shipping a backlog item

1. Branch off `main` named for the target version (`vX.Y.Z`). Never commit directly to `main`.
2. Move the entry to CHANGELOG.md with a version block (date, classification, user-facing summary). Remove it from here.
3. Update docs where reality changed (README, CONTRIBUTING, etc.).
4. Pick the version by semver: feature → minor; bug / improvement / cleanup → patch; breaking → major.
5. Bump the version in whichever location CLAUDE.md documents (package.json, VERSION file, or CHANGELOG.md only).
6. Run the build as the correctness gate.
7. Commit and push the branch, then open a PR with `gh pr create`. Requires [GitHub CLI](https://cli.github.com) installed and authenticated (`gh auth login`).

## Suggested execution order

- **Effort**: S = single turn, M = full session, L = multi-session
- **Value**: H = high user impact, M = moderate, L = polish / upkeep

### Features

| Title | Effort | Value |
|---|---|---|
| [Re-trigger Action when checks complete](#re-trigger-action-when-checks-complete) | M | H |
| [Maintain a floating major-version tag](#maintain-a-floating-major-version-tag) | S | M |
| [Allow merges even if the base branch changes](#allow-merges-even-if-the-base-branch-changes) | S | M |
| [Follow the configured required review count](#follow-the-configured-required-review-count) | S | M |
| [Update from base branch before merging](#update-from-base-branch-before-merging) | M | M |
| [Time based allow/block of merges](#time-based-allowblock-of-merges) | M | L |
| [Remove label / re-request review on commit](#remove-label--re-request-review-on-commit) | M | L |

### Improvements

| Title | Effort | Value |
|---|---|---|
| [Add dependabot.yml for scheduled dependency updates](#add-dependabotyml-for-scheduled-dependency-updates) | S | M |
| [Prune stale origin branches](#prune-stale-origin-branches) | S | L |

### Known issues

| Title | Effort | Value |
|---|---|---|
| [Crash on non-PR events (missing pull_request payload)](#crash-on-non-pr-events-missing-pull_request-payload) | S | H |
| [Triage the open pull requests](#triage-the-open-pull-requests) | S | M |
| [Not detecting team-requested reviews](#not-detecting-team-requested-reviews) | S | M |

### Limitations

No open limitations.

---

## Open

### Maintain a floating major-version tag
**Type:** Feature
**Why** — Consumers currently either pin an exact tag (`@v0.4.5`) or float on `@main`. A moving major tag (e.g. `v0`) lets them pin `squalrus/merge-bot@v0` and pick up patch/minor releases automatically without tracking every release — the common convention for GitHub Actions (see `actions/checkout@v4`, etc.).
**Notes:** On release, after `npm version` creates the exact tag, force-move the major tag to point at the new commit and push it: `git tag -f v0 <new-tag> && git push origin v0 --force`. Add this as a step in [CONTRIBUTING.md](CONTRIBUTING.md)'s release process, ideally automated in a release workflow rather than manual. Consider updating the README's example usage to recommend pinning the major tag instead of an exact version once this exists.

### Crash on non-PR events (missing pull_request payload)
**Type:** Bug
**Why** — Confirmed reproducible crash reported in [#77](https://github.com/squalrus/merge-bot/issues/77): `Pull`'s constructor ([lib/pull.js](lib/pull.js#L3)) does `payload.pull_request.labels.map(...)` unconditionally. A workflow triggered on `push` (in addition to `pull_request`, as the reporter's is) delivers a payload with no `pull_request` object at all, so this throws on every push. Real user impact today, not a hypothetical — flagged by the audit as the single highest-priority item outstanding.
**Notes:** Guard on `github.context.payload.pull_request` existing before constructing `Pull` in [index.js](index.js#L16); no-op cleanly on non-PR events instead of crashing. Small, self-contained fix.

### Triage the open pull requests
**Type:** Known issue
**Why** — 9 PRs are open (re-checked 2026-08-26 via `gh pr list`), ranging from 2019 (your own, conflicting) to 2023 (dependabot). #68 already auto-closed itself once its advisory no longer applied post-v0.4.11 — the remaining 7 dependabot bumps (#64, #69, #70, #71, #73, #74, #75) are all now CONFLICTING and individually superseded by the v0.4.11 `jest`/`@actions/*` upgrade. One real community feature contribution ([#72](https://github.com/squalrus/merge-bot/pull/72)) has never been reviewed.
**Notes:** Close #64, #69, #70, #71, #73, #74, #75 in favor of v0.4.11. Review #72 ("make the action work with pull request comment event") on its merits. Decide whether to rebase or close #12 ("Resubmit reviews after push"), your own branch, currently conflicting with `main`. Title deliberately drops the PR count — it kept drifting out of sync as PRs closed on their own.

### Not detecting team-requested reviews
**Type:** Bug
**Why** — Reported in [#37](https://github.com/squalrus/merge-bot/issues/37). [Pull's constructor](lib/pull.js#L10) reads only `payload.pull_request.requested_reviewers`, never `requested_teams` — a CODEOWNERS rule assigning a *team* (as in the original report) won't register as a pending reviewer, so the bot can consider reviews complete while a team review is genuinely still outstanding.
**Notes:** Add `requested_teams` handling alongside `requested_reviewers` in `Pull`'s review-compilation logic. Likely compounds with [Re-trigger Action when checks complete](#re-trigger-action-when-checks-complete) (a stale payload at merge time) — worth fixing together since the original report probably hit both.

### Add dependabot.yml for scheduled dependency updates
**Type:** Improvement
**Why** — There's no `.github/dependabot.yml`, yet Dependabot has been opening PRs (via GitHub's automatic security updates). Without a config there's no schedule, grouping, or policy, which is part of why 6+ dependency PRs sat open for years.
**Notes:** Add a `version-updates` config for the `npm` ecosystem with a weekly/monthly schedule and grouping (e.g. group all dev-dependency bumps together) so future PRs arrive in batches instead of one-off drips.

### Prune stale origin branches
**Type:** Improvement
**Why** — Re-checked 2026-08-26: the original "22 branches with no open PR" figure was itself stale — it included local tracking refs for branches already deleted on GitHub. The real current count of unmerged branches on `origin` is 8, and every one of them backs a currently open PR (the 7 dependabot branches plus `resubmit-reviews` for #12) — so by this item's own definition, there's nothing to prune right now.
**Notes:** Blocked on [Triage the open pull requests](#triage-the-open-pull-requests) landing first — once those PRs are closed, re-run `git fetch --prune && git branch -r --no-merged origin/main` and prune whatever's left without an open PR. Separately, `.github/workflows/merge-bot.yml` sets `delete_source_branch: false`, so this repo's own bot-merged PRs don't get branch cleanup for free — consider flipping to `true` to prevent future buildup.

### Re-trigger Action when checks complete
**Type:** Feature
**Why** — Reported in [#22](https://github.com/squalrus/merge-bot/issues/22). The action runs once per triggering event and never requeues itself; `.github/workflows/merge-bot.yml` doesn't listen for `check_suite`/`workflow_run` completion, so a check finishing after the bot's last run won't cause a re-evaluation — a PR can sit mergeable-but-unmerged until some unrelated event happens to retrigger it.
**Notes:** Add `check_suite: [completed]` (and/or `workflow_run`) to the trigger list in `merge-bot.yml`. This is a core reliability gap for the action's primary use case (auto-merge gated on checks passing) — highest-value item in this section.

### Allow merges even if the base branch changes
**Type:** Feature
**Why** — Reported in [#56](https://github.com/squalrus/merge-bot/issues/56). [index.js](index.js#L57) calls `octokit.pulls.merge` with no retry logic; a "base branch was modified" failure from a concurrent merge just bubbles up to `core.setFailed`, forcing a manual re-run instead of the bot recovering on its own.
**Notes:** Catch the specific GitHub API error for base-branch-changed and retry the merge (possibly after re-fetching PR state), bounded to a small number of attempts.

### Follow the configured required review count
**Type:** Feature
**Why** — Reported in [#14](https://github.com/squalrus/merge-bot/issues/14). [lib/config.js:6](lib/config.js#L6) `review_required` is a plain boolean; [Pull.isReviewComplete](lib/pull.js#L20) requires 100% of `requested_reviewers` to approve, with no way to configure a numeric threshold matching the repo's actual branch-protection required-approval count.
**Notes:** Add a `required_review_count` (or similar) input to `action.yml`/`lib/config.js`, and change `isReviewComplete` to compare approval count against that threshold instead of requiring unanimous approval from every requested reviewer.

### Update from base branch before merging
**Type:** Feature
**Why** — Reported in [#13](https://github.com/squalrus/merge-bot/issues/13). No call to `pulls.updateBranch` (or equivalent) exists anywhere in the codebase — the bot never brings a PR branch up to date with its base before merging, which can let stale branches merge or miss checks that would have run against the updated code.
**Notes:** Call `octokit.pulls.updateBranch` before merging when the PR is behind base, accounting for the update being processed asynchronously by GitHub before proceeding to merge.

### Time based allow/block of merges
**Type:** Feature
**Why** — Reported in [#59](https://github.com/squalrus/merge-bot/issues/59). No time-window input exists; nothing in `Pull.canMerge` consults a clock. Requested so merges can be restricted to certain hours (e.g. no merges on weekends or outside business hours).
**Notes:** Net-new feature, no work started. Would need a new `lib/config.js` input (e.g. `merge_window`) and a clock check in `Pull.canMerge`. Niche request (single requester since 2021) — worth confirming continued interest before investing effort.

### Remove label / re-request review on commit
**Type:** Feature
**Why** — Reported in [#7](https://github.com/squalrus/merge-bot/issues/7). No label-removal or re-review-request logic exists anywhere in `index.js`/`lib/`. Requested so pushing new commits to a PR could automatically remove a "ready" label or re-request reviews, preventing a stale approval from letting an unreviewed change merge.
**Notes:** Would trigger on `synchronize` (already a `merge-bot.yml` trigger) and call `issues.removeLabel` and/or `pulls.requestReviewers` conditionally. Worth checking whether standard GitHub branch protection settings already cover part of this without code changes.
