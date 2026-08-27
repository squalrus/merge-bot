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

Releases are git tags (`vX.Y.Z`) plus a GitHub release; there's no publish step beyond that since consumers reference a tag or branch directly (e.g. `squalrus/merge-bot@v0.5.4`).

This is automatic: [`scripts/tag-and-release.sh`](scripts/tag-and-release.sh) reads `package.json`'s version, and if there's no matching `vX.Y.Z` tag yet, tags the current commit, pushes the tag, and creates a GitHub release. The release notes are a short bullet list, not the full CHANGELOG entry: the script pulls just the bold lead sentence off each `- **Lead.** Detail...` bullet in the corresponding `## [X.Y.Z]` section of [CHANGELOG.md](CHANGELOG.md) (failing loudly if that section is missing, or has no bullets in that shape, rather than publishing an empty release). Write CHANGELOG entries with that in mind — the bold lead should stand alone as a scannable summary. Full detail (why, files touched) stays in CHANGELOG.md; release notes are for a quick "what changed" scan. It runs from two places, because GitHub doesn't trigger new workflow runs from a push made with the default `GITHUB_TOKEN` — which is how merge-bot merges PRs:
- [`.github/workflows/merge-bot.yml`](.github/workflows/merge-bot.yml) runs it directly, right after merge-bot's own merge step — this is the path that fires for the normal `ready`-label flow.
- [`.github/workflows/release.yml`](.github/workflows/release.yml) runs it on any other push to `main` that touches `package.json` — a fallback for a version bump landing some other way (e.g. a maintainer merging by hand).

Either way, the standard flow — bump `package.json`'s version, add the CHANGELOG entry, merge to `main` — is sufficient; nothing further to run by hand.

`.github/workflows/version-check.yml` runs on every pushed tag and fails loudly if the tag doesn't match `package.json`'s version — for the automated path the two can't drift, but it remains a safety net for a manually-pushed tag (e.g. releasing directly without going through `main`, via `npm version patch && git push --follow-tags`). If it fails, delete the bad tag, fix the version, and re-tag.

If the README's example usage pins a version, update it to the new tag as part of the release.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. Note they're currently the unmodified GitHub defaults and include some fields (device/browser) that don't really apply to a GitHub Action — feel free to ignore those fields when filing, or help tidy the templates themselves (tracked in [BACKLOG.md](BACKLOG.md)).

## Known rough edges

Before proposing an upgrade to `@actions/github`, note that `index.js` calls REST methods directly on the octokit client (e.g. `octokit.pulls.listReviews`) rather than under `.rest.*`. That's the shape of the API in the currently-pinned major version — a version bump is a breaking API-shape change here, not a drop-in update. See [AUDIT.md](AUDIT.md) for the full dependency/runtime picture before starting infrastructure work, so you're not duplicating a tracked item.
