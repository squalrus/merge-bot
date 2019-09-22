# Merge bot

The action will merge PRs when certain conditions are met:

- specified labels are adde to a pull request

## Inputs

### `test`

Runs in test mode and will comment rather than merge. Default is `false`.

### `labels`

Labels required for integration. Default is `"ready"`.

### `method`

Merge method to use. Possible values are `merge`, `squash` or `rebase`. Default is `merge`.

## Example usage

```yaml
name: Merge Bot

on:
  pull_request_review:
    types: [submitted, dismissed]
  pull_request:
    types: [labeled, unlabeled]

jobs:
  merge:
    runs-on: ubuntu-latest
    name: Merge
    steps:
    - name: Integration check
      uses: squalrus/merge-bot@master
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        test: true
        labels: ready, merge
        method: 'squash'
```
