# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`merge-bot` is a GitHub Action (published as `squalrus/merge-bot`) that auto-merges pull requests once configured conditions are met (required labels, absence of blocking labels, reviewer sign-off, checks passing), then optionally deletes the source branch. It's a small, self-contained Node.js action — no framework, minimal build step (an `ncc` bundle, see below).

## Architecture

- [index.js](index.js) — entry point. Reads the webhook payload via `@actions/github`, builds a `Config` and a `Pull`, fetches reviews/checks via Octokit, decides whether to comment (test mode) or actually merge + delete the branch.
- [lib/config.js](lib/config.js) — reads action inputs (`core.getInput(...)`) into a plain `Config` object. If you add an input, update it here, in [action.yml](action.yml), and in the README's Inputs section — all three must stay in sync.
- [lib/pull.js](lib/pull.js) — the core decision logic (`Pull` class): parses the PR payload, compiles reviews/checks, and exposes `canMerge(config)`. This is the file to touch for any change in merge eligibility rules, and it should stay fully covered by tests.
- [lib/message.js](lib/message.js) — renders the test-mode PR comment (HTML tables in Markdown).
- `__tests__/` + `__mocks__/` — Jest tests against fixture webhook payloads. Run with `npm test`.

## Working in this repo

- Run `npm test` after any change to `lib/` or `index.js` — the suite is fast (~40s) and should stay green.
- If you touch an action input, update `action.yml`, `lib/config.js`, and the README's Inputs section together — they're expected to match exactly and nothing enforces that automatically.
- The action runs from `dist/index.js`, a single file bundled from `index.js` + `lib/` with `@vercel/ncc` (`npm run build`) — that's what `action.yml`'s `runs.main` points at, not `index.js` directly. After any change to `index.js` or `lib/`, rebuild and commit `dist/index.js`; [`.github/workflows/build-check.yml`](.github/workflows/build-check.yml) fails the PR if it's stale. `node_modules/` is gitignored and not committed — only `dist/` is.
- Run `npm run lint` (ESLint, config in `eslint.config.js`) to check style (4-space indent, semicolons). `.editorconfig` covers the same basics for editors that read it.

## Known constraints — read before proposing dependency/runtime upgrades

- `action.yml` declares `runs.using: node20`. Changing the runtime is its own deliberate PR, never a side effect of an unrelated change, since it affects how the action is invoked.
- `@actions/github` is at v9; `index.js` calls REST methods under `octokit.rest.*` (`octokit.rest.pulls.listReviews`, etc.). A major bump of `@actions/github` or `@actions/core` changes what's bundled into `dist/index.js` — treat it as a breaking-change upgrade, not a version bump.
- `package.json` has `overrides` forcing `glob@>=9` → `^14.0.4` and `minimatch@>=7` → `^11.0.8` inside jest's dev-only tree, to clear `npm audit` advisories jest hasn't picked up yet. Drop them once jest's own ranges reach patched versions (check with `npm ls glob minimatch`). `deepmerge` (via `jest-config`) has a low-severity advisory with no patched release — accepted, dev-only.

## Where things are tracked

- [AUDIT.md](AUDIT.md) — point-in-time repo health check (dependencies, CI, open PRs, hygiene). Re-read it before starting infrastructure/upgrade work so you're not duplicating a known item, and update it when the picture materially changes.
- [BACKLOG.md](BACKLOG.md) — prioritized follow-up work. Use the `add-to-backlog` skill to add new items and `pick-from-backlog` to start one.
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor-facing workflow (branching, testing, releasing).

## Version tracking

Version is tracked in `package.json` (the `"version"` field), bumped by hand as part of shipping. [`.github/workflows/release.yml`](.github/workflows/release.yml) tags and publishes a GitHub release automatically whenever a version bump lands on `main`, and [`.github/workflows/version-check.yml`](.github/workflows/version-check.yml) fails loudly if a tag and `package.json` ever disagree. See [CONTRIBUTING.md](CONTRIBUTING.md)'s Releasing section.

## Working with the backlog

[BACKLOG.md](./BACKLOG.md) tracks proposed work. Items are candidates, not commitments.

When shipping a backlog item: branch off `main` as `vX.Y.Z`, move the entry to CHANGELOG.md, bump `version` in `package.json`, build, commit, push, then open a PR with `gh pr create`. Requires [GitHub CLI](https://cli.github.com) installed and authenticated (`gh auth login`).
