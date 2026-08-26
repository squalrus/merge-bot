# Backlog

Tracks future features, improvements, and known bugs. Items here are not committed work — they're candidates.

## Shipping a backlog item

1. Branch off `master` named for the target version (`vX.Y.Z`). Never commit directly to `master`.
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
| [Maintain a floating major-version tag](#maintain-a-floating-major-version-tag) | S | M |

### Improvements

| Title | Effort | Value |
|---|---|---|
| [Consolidate CI onto a single GitHub Actions workflow](#consolidate-ci-onto-a-single-github-actions-workflow) | M | H |
| [Reconcile package.json metadata with reality](#reconcile-packagejson-metadata-with-reality) | S | M |
| [Upgrade jest to clear most npm audit findings](#upgrade-jest-to-clear-most-npm-audit-findings) | S | M |
| [Add dependabot.yml for scheduled dependency updates](#add-dependabotyml-for-scheduled-dependency-updates) | S | M |
| [Upgrade @actions/core and @actions/github deliberately](#upgrade-actionscore-and-actionsgithub-deliberately) | M | M |
| [Prune stale origin branches](#prune-stale-origin-branches) | S | L |
| [Rename default branch from master to main](#rename-default-branch-from-master-to-main) | M | L |
| [Tidy issue templates for a GitHub Action](#tidy-issue-templates-for-a-github-action) | S | L |

### Known issues

| Title | Effort | Value |
|---|---|---|
| [Triage the 7 open pull requests](#triage-the-7-open-pull-requests) | S | M |

### Limitations

No open limitations.

---

## Open

### Maintain a floating major-version tag
**Type:** Feature
**Why** — Consumers currently either pin an exact tag (`@v0.4.5`) or float on `@master`. A moving major tag (e.g. `v0`) lets them pin `squalrus/merge-bot@v0` and pick up patch/minor releases automatically without tracking every release — the common convention for GitHub Actions (see `actions/checkout@v4`, etc.).
**Notes:** On release, after `npm version` creates the exact tag, force-move the major tag to point at the new commit and push it: `git tag -f v0 <new-tag> && git push origin v0 --force`. Add this as a step in [CONTRIBUTING.md](CONTRIBUTING.md)'s release process, ideally automated in a release workflow rather than manual. Consider updating the README's example usage to recommend pinning the major tag instead of an exact version once this exists.

### Triage the 7 open pull requests
**Type:** Known issue
**Why** — 7 PRs are open, ranging from 2019 (your own, now conflicting) to 2023 (dependabot). Several dependabot bumps are individually superseded by a single dependency-upgrade pass, and one real community feature contribution (#72) has never been reviewed.
**Notes:** Close #68, #69, #70, #71, #73, #74, #75 in favor of one consolidated `jest`/`@actions/*` upgrade PR (see [Upgrade jest](#upgrade-jest-to-clear-most-npm-audit-findings) and [Upgrade @actions/core and @actions/github](#upgrade-actionscore-and-actionsgithub-deliberately)). Review #72 ("make the action work with pull request comment event") on its merits. Decide whether to rebase or close #12 ("Resubmit reviews after push"), which is your own branch and currently conflicting with `master`.

### Reconcile package.json metadata with reality
**Type:** Improvement
**Why** — `package.json` still says `name: "github-actions"` (placeholder) and `license: "ISC"` (actual LICENSE file is MIT). Misleading to anyone inspecting the package. (The `version` field was fixed 2026-08-26 — it now tracks the latest tag and is guarded by [`.github/workflows/version-check.yml`](.github/workflows/version-check.yml); see [CONTRIBUTING.md](CONTRIBUTING.md)'s `npm version` release step.)
**Notes:** Set `name` to `merge-bot` and `license` to `MIT`.

### Upgrade jest to clear most npm audit findings
**Type:** Improvement
**Why** — `jest` is pinned at 26.6.3 (latest 30.4.2). Most of the 56 `npm audit` findings (Babel, `ws`, etc.) come from this dev-dependency's transitive tree, not from anything shipped in the action itself.
**Notes:** Bump `jest` to latest, run `npm test`, fix any breaking config/API changes (Jest 27+ changed some defaults, e.g. test environment). Re-run `npm audit` after to confirm the reduction.

### Add dependabot.yml for scheduled dependency updates
**Type:** Improvement
**Why** — There's no `.github/dependabot.yml`, yet Dependabot has been opening PRs (via GitHub's automatic security updates). Without a config there's no schedule, grouping, or policy, which is part of why 6+ dependency PRs sat open for years.
**Notes:** Add a `version-updates` config for the `npm` ecosystem with a weekly/monthly schedule and grouping (e.g. group all dev-dependency bumps together) so future PRs arrive in batches instead of one-off drips.

### Upgrade @actions/core and @actions/github deliberately
**Type:** Improvement
**Why** — `@actions/core` is 2 majors behind (1.2.6 → 3.0.1, includes a moderate CVE fix); `@actions/github` is 5 majors behind (4.0.0 → 9.1.1).
**Notes:** Not a drop-in bump — `index.js` currently calls REST methods directly on the octokit client (`octokit.pulls.listReviews`, `octokit.checks.listForRef`) rather than under `.rest.*`, which is the v4-era shape. Upgrading requires updating those call sites and re-running the full test suite.

### Consolidate CI onto a single GitHub Actions workflow
**Type:** Improvement
**Why** — Tests currently only run via `azure-pipelines.yml`, pinned to Node 10.x (EOL 2021). This is no longer just a staleness concern — the pipeline is **actively broken as of 2026-08-26**: its `npm install -g jest --save-dev` step installs the latest Jest (30.x, not the project's pinned `26.6.3`), whose `jest-resolve` now depends on `unrs-resolver`, a native module. `unrs-resolver`'s postinstall script fails outright under Node 10.x, so every pipeline run currently errors with `ELIFECYCLE` / "Failed at the unrs-resolver@1.12.2 postinstall script." The GitHub Actions workflow in this repo (`merge-bot.yml`) only runs the action itself, not `npm test`, so there is currently no working CI test signal on PRs at all.
**Notes:** Add `.github/workflows/test.yml` running `npm test` on PRs to `master` (or `main`, if [the branch rename](#rename-default-branch-from-master-to-main) lands first), on a current Node LTS. Retire `azure-pipelines.yml` — no need to fix it first; the `npm install -g jest` line is redundant regardless (`npm run test` already resolves the project's own pinned `jest` from `node_modules` without a global install) and the underlying Node 10.x pin needs replacing either way. Add a status badge to the README once the new workflow exists.

### Prune stale origin branches
**Type:** Improvement
**Why** — 22 branches on `origin` have no corresponding open PR and are not merged into `master` (leftover feature branches plus 9 closed/merged `dependabot/npm_and_yarn/*` branches). Pure clutter.
**Notes:** Confirm each has no open PR before deleting (`gh pr list --state all --head <branch>`). Low risk, low urgency — good filler task.

### Rename default branch from master to main
**Type:** Cleanup
**Why** — This repo's default branch is still `master`; most tooling, templates, and the backlog/changelog skills used here default to `main`. Consistency reduces the friction of copy-pasting commands and following generic docs/skill instructions verbatim.
**Notes:** GitHub has a built-in "rename branch" tool (repo Settings → Branches) that updates open PRs, branch protection rules, and redirects `git push`/`git pull` on the old name automatically — safer than a manual rename. After renaming, update every reference to `master` across the repo: `azure-pipelines.yml` (`pr: [master]`), `.github/workflows/merge-bot.yml` if it targets a branch, and the docs that mention it by name (README.md, CONTRIBUTING.md, CLAUDE.md, BACKLOG.md, AUDIT.md, this file). Also confirm the `squalrus/merge-bot@master` floating-branch reference some consumers may use still resolves (GitHub's redirect handles this, but worth a spot check). Coordinate with anyone holding local clones or open forks/PRs, since their local `master` won't auto-rename.

### Tidy issue templates for a GitHub Action
**Type:** Improvement
**Why** — `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md` are unmodified GitHub defaults, including "Desktop"/"Smartphone" fields that don't apply to a GitHub Action.
**Notes:** Trim to fields relevant to an Action (e.g. workflow YAML used, inputs configured, expected vs. actual behavior) instead of browser/OS/device fields.
