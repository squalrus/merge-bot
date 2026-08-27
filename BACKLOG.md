# Backlog

Tracks future features, improvements, and known bugs. Items here are not committed work — they're candidates.

## Shipping a backlog item

1. Branch off `main` named for the target version (`vX.Y.Z`). Never commit directly to `main`.
2. Move the entry to CHANGELOG.md with a version block (date, classification, user-facing summary). Remove it from here. If the item traces to a GitHub issue, link it (`#<n>`) and credit the reporter by `@username` in the entry — most "Why" sections already have both, so this is usually just carrying them over.
3. Update docs where reality changed (README, CONTRIBUTING, etc.).
4. Pick the version by semver: feature → minor; bug / improvement / cleanup → patch; breaking → major.
5. Bump the version in whichever location CLAUDE.md documents (package.json, VERSION file, or CHANGELOG.md only).
6. Run the build as the correctness gate.
7. Commit and push the branch, then open a PR with `gh pr create`. If the item traces to a GitHub issue, include `Fixes #<n>` (or `Closes #<n>`) in the PR body so merging auto-closes it — GitHub links the issue to the PR either way. Requires [GitHub CLI](https://cli.github.com) installed and authenticated (`gh auth login`).
8. After merging, verify the linked issue actually closed (auto-close only fires if the PR merged into the repo's *default* branch — confirm `main` is set as default, or close manually with `gh issue close <n> --comment "Fixed in <PR link>"` if it didn't).
9. A git tag and GitHub release are created automatically by [`.github/workflows/release.yml`](.github/workflows/release.yml) once the version bump lands on `main` — nothing further to do.

## Suggested execution order

- **Effort**: S = single turn, M = full session, L = multi-session
- **Value**: H = high user impact, M = moderate, L = polish / upkeep

### Features

| Title | Effort | Value |
|---|---|---|
| [Maintain a floating major-version tag](#maintain-a-floating-major-version-tag) | S | M |
| [Allow merges even if the base branch changes](#allow-merges-even-if-the-base-branch-changes) | S | M |
| [Follow the configured required review count](#follow-the-configured-required-review-count) | S | M |
| [Update from base branch before merging](#update-from-base-branch-before-merging) | M | M |
| [Time based allow/block of merges](#time-based-allowblock-of-merges) | M | L |
| [Remove label / re-request review on commit](#remove-label--re-request-review-on-commit) | M | L |

### Improvements

No open improvements.

### Known issues

No open known issues.

### Limitations

No open limitations.

---

## Open

### Maintain a floating major-version tag
**Type:** Feature
**Why** — Consumers currently either pin an exact tag (`@v0.4.5`) or float on `@main`. A moving major tag (e.g. `v0`) lets them pin `squalrus/merge-bot@v0` and pick up patch/minor releases automatically without tracking every release — the common convention for GitHub Actions (see `actions/checkout@v4`, etc.).
**Notes:** On release, after `npm version` creates the exact tag, force-move the major tag to point at the new commit and push it: `git tag -f v0 <new-tag> && git push origin v0 --force`. Add this as a step in [CONTRIBUTING.md](CONTRIBUTING.md)'s release process, ideally automated in a release workflow rather than manual. Consider updating the README's example usage to recommend pinning the major tag instead of an exact version once this exists.

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
**Notes:** Would trigger on `push`/`synchronize` (already a `merge-bot.yml` trigger) and call `issues.removeLabel` and/or `octokit.rest.pulls.requestReviewers` conditionally. Worth checking whether standard GitHub branch protection settings already cover part of this without code changes. [PR #12](https://github.com/squalrus/merge-bot/pull/12) ("Resubmit reviews after push", closed as stale 2026-08-26) attempted the re-request-review half of this in 2019 — its approach (re-request from anyone in `pull.reviews` on a `push` event) is a reasonable starting point, but the branch itself predates the ESM/`octokit.rest.*` rewrite and can't be rebased cleanly; reimplement fresh against current `lib/pull.js` rather than resurrecting it.
