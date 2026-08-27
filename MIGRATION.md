# Migrating from v0.4.5 to v0.5.4

Bump your pin:

```diff
-      uses: squalrus/merge-bot@v0.4.5
+      uses: squalrus/merge-bot@v0.5.4
```

Inputs are unchanged — no config to update.

## Required if you merge PRs from forks

Change your workflow's trigger from `pull_request` to `pull_request_target`, or fork PRs will fail to merge (fork events get a read-only token under `pull_request`).

```diff
 on:
-  pull_request:
+  pull_request_target:
     types: [labeled, ready_for_review, review_request_removed, review_requested, synchronize, unlabeled]
```

Don't add a step that checks out `github.event.pull_request.head.sha` to this job — `pull_request_target` runs with write access, so that would execute untrusted fork code with write permissions.

Not merging fork PRs? Skip this, `pull_request` still works.

## Optional

**Retry via PR comment** — add an `issue_comment` trigger to retry a merge that failed with "Base branch was modified." See the README's [Retrying via a PR comment](README.md#retrying-via-a-pr-comment) section.

**Re-evaluate when checks complete** — add a `check_suite: [completed]` trigger (with a job guard) so a mergeable PR is picked up the moment its checks finish, instead of waiting for another event to happen to retrigger it. See the README's [Example usage](README.md#example-usage) section.

## Everything else

Node runtime, fork check lookups, a crash on non-PR events — all fixed transparently, nothing to do.
