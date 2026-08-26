# PR Merge Bot

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Test](https://github.com/squalrus/merge-bot/actions/workflows/test.yml/badge.svg)](https://github.com/squalrus/merge-bot/actions/workflows/test.yml)

This action manages pull request integrations by allowing a structured workflow to be defined.

The workflow can use required labels, blocking labels, and require that reviewers sign-off for determining if a pull request should be integrated. By default the pull request will be blocked by incomplete/failing checks.

Once conditions are met the pull request will be integrated and branch deleted.

![merged GitHub pull request and deleted branch](./assets/integrate.png)

## Inputs

### `test`

Runs in test mode and will comment rather than merge. This allows you to experiment with the settings without integrating a pull request. Default is `false`.

![test mode comment left by the bot](./assets/test-mode.png)

### `reviewers`

Reviewers required, and reviewers must all approve. This enforces a reviewer mode where there cannot be any pending reviews and the submitted reviews must be in an "approved" state. Default is `true`.

![reviewer has signed-off on pull request](./assets/reviewer.png)

### `labels`

One or more labels required for integration. Default is `"ready"`.

![merge and sign-off GitHub labels](./assets/labels.png)

### `blocking_labels`

One or more labels that block the integration. Default is `"do not merge"`.

![do not merge GitHub label](./assets/blocking-label.png)

### `checks_enabled`

All checks must be completed to be eligible to integrate (this does not include the currently running Action). Note, if triggering multiple runs simultaneously (like adding two labels) this will not pass -- USE WITH CAUTION. Default is `false`.

### `method`

Merge method to use. Possible values are `merge`, `squash` or `rebase`. Default is `merge`.

### `delete_source_branch`

Delete the source branch of the pull request after merging. Set to `false` when "Automatically delete head branches" is enabled on your repo. Default is `true`.

_NOTE: if enabled, merge-bot is unable to delete a branch from a fork._

![Automatically delete head branches enabled](./assets/delete-branches.png)

## Example usage

You can use PR Merge Bot by configuring a YAML-based workflow file, e.g. `.github/workflows/merge-bot.yml`.

```yaml
name: Merge Bot

on:
  pull_request:
    types:
      - labeled
      - ready_for_review
      - review_request_removed
      - review_requested
      - synchronize
      - unlabeled
  pull_request_review:
    types:
      - dismissed
      - submitted

jobs:
  merge:
    runs-on: ubuntu-latest
    name: Merge
    steps:
    - name: Integration check
      uses: squalrus/merge-bot@v0.4.5
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        test: true
        reviewers: true
        labels: ready, merge
        blocking_labels: do not merge
        checks_enabled: true
        method: squash
        delete_source_branch: true
```

## Development

```bash
npm install
npm test
```

Tests live in `__tests__/` and use fixture payloads from `__mocks__/`.

The action itself runs from a bundled `dist/index.js`, generated from `index.js` and `lib/` with [`@vercel/ncc`](https://github.com/vercel/ncc) — that's what [`action.yml`](action.yml) points at. After changing `index.js` or anything under `lib/`, rebuild and commit the result:

```bash
npm run build
```

A CI check ([`.github/workflows/build-check.yml`](.github/workflows/build-check.yml)) fails the PR if `dist/` is out of date with source.

## Contributing

Bug reports, feature requests, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, and [CLAUDE.md](CLAUDE.md) if you're working in this repo with Claude Code.

## Project status

This repo currently has open items around its GitHub Actions runtime version, dependency freshness, and open PR triage — see [AUDIT.md](AUDIT.md) for a full health check and [BACKLOG.md](BACKLOG.md) for tracked follow-up work.

## License

[MIT](LICENSE)
