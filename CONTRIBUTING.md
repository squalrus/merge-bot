# Contributing

Thanks for taking an interest in `merge-bot`. This is a small GitHub Action — the bar for contributing is low, but a few conventions keep it maintainable.

## Getting set up

```bash
git clone https://github.com/squalrus/merge-bot.git
cd merge-bot
npm install
npm test
```

`index.js` requires `lib/config.js`, `lib/pull.js`, and `lib/message.js` directly and runs on plain Node.js. What actually ships is `dist/index.js`, a single file bundled from those sources with [`@vercel/ncc`](https://github.com/vercel/ncc) — that's what `action.yml`'s `runs.main` points at, not `index.js` directly.

## Making a change

1. Branch off `main`.
2. Add or update tests under `__tests__/` for any behavior change — `lib/pull.js` in particular (labels, reviews, checks, merge eligibility) should stay fully covered. Fixture payloads live in `__mocks__/` and mirror real GitHub webhook payload shapes; add new fixtures there rather than inlining large payload objects in test files.
3. Run `npm test` and `npm run lint` and make sure both pass — CI (`.github/workflows/test.yml`) runs both on every PR. ESLint's config is in [eslint.config.js](eslint.config.js) and enforces the existing style (4-space indent, semicolons); `.editorconfig` covers the same basics for editors that read it.
4. If you changed `index.js` or anything under `lib/`, run `npm run build` and commit the resulting `dist/index.js` — CI (`.github/workflows/build-check.yml`) fails the PR if `dist/` is stale relative to source.
5. If you change an input's name, default, or meaning, update it in **both** `action.yml` and the README's Inputs section — they're expected to match exactly.
6. Open a PR against `main`.

## How PRs get merged here

This repo uses itself: `.github/workflows/merge-bot.yml` runs `merge-bot` against its own PRs. As of this writing that workflow only requires the `ready` label (reviews and checks are not enforced on this repo — see [AUDIT.md](AUDIT.md)), so a maintainer applies `ready` once a PR looks good.

## Releasing

Releases are git tags (`vX.Y.Z`) plus a GitHub release; there's no publish step beyond that since consumers reference a tag or branch directly (e.g. `squalrus/merge-bot@v0.4.5`).

`package.json`'s `version` and the release tag have drifted out of sync before, so always cut a release with `npm version` rather than editing `package.json` and tagging separately — it bumps the version, commits it, and creates the matching tag in one step:

```bash
npm version patch   # or minor / major
git push --follow-tags
gh release create v$(node -p "require('./package.json').version")
```

`.github/workflows/version-check.yml` runs on every pushed tag and fails loudly if the tag doesn't match `package.json`'s version — it's a safety net for catching a manual mistake, not a hard block on the tag existing (GitHub doesn't gate tag pushes on status checks the way it does branches). If it fails, delete the bad tag, fix the version, and re-tag.

If the README's example usage pins a version, update it to the new tag as part of the release.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. Note they're currently the unmodified GitHub defaults and include some fields (device/browser) that don't really apply to a GitHub Action — feel free to ignore those fields when filing, or help tidy the templates themselves (tracked in [BACKLOG.md](BACKLOG.md)).

## Known rough edges

Before proposing an upgrade to `@actions/github`, note that `index.js` calls REST methods directly on the octokit client (e.g. `octokit.pulls.listReviews`) rather than under `.rest.*`. That's the shape of the API in the currently-pinned major version — a version bump is a breaking API-shape change here, not a drop-in update. See [AUDIT.md](AUDIT.md) for the full dependency/runtime picture before starting infrastructure work, so you're not duplicating a tracked item.
