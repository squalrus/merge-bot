# PR Merge Bot

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
      uses: squalrus/merge-bot@v0.1.0
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        test: true
        reviewers: true
        labels: ready, merge
        blocking_labels: do not merge
        checks_enabled: true
        method: squash
```
