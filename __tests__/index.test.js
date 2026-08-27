import { jest } from '@jest/globals';

import payloadDefault from '../__mocks__/pull/payload-default.js';
import payloadFork from '../__mocks__/pull/payload-fork.js';
import payloadIssueComment from '../__mocks__/pull/payload-issue-comment.js';
import payloadCheckSuite from '../__mocks__/pull/payload-check-suite.js';
import payloadCheckSuiteMulti from '../__mocks__/pull/payload-check-suite-multi.js';
import payloadCheckSuiteEmpty from '../__mocks__/pull/payload-check-suite-empty.js';
import reviewsNone from '../__mocks__/pull/reviews-none.js';
import checks0 from '../__mocks__/checks/check-0.js';

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

function makeCore(inputs) {
    const merged = Object.assign({
        blocking_labels: '',
        labels: '',
        method: 'merge',
        reviewers: 'false',
        checks_enabled: 'false',
        test: 'false',
        delete_source_branch: 'false',
        GITHUB_TOKEN: 'test-token'
    }, inputs);

    return {
        getInput: jest.fn((key) => merged[key]),
        setFailed: jest.fn()
    };
}

function makeOctokit(overrides) {
    return {
        rest: Object.assign({
            pulls: {
                get: jest.fn().mockResolvedValue({ data: payloadDefault.pull_request }),
                listReviews: jest.fn().mockResolvedValue(reviewsNone),
                merge: jest.fn().mockResolvedValue({})
            },
            checks: {
                listForRef: jest.fn().mockResolvedValue(checks0)
            },
            issues: {
                createComment: jest.fn().mockResolvedValue({})
            },
            git: {
                deleteRef: jest.fn().mockResolvedValue({})
            }
        }, overrides)
    };
}

function makeGithub(payload, octokit) {
    return {
        context: { payload },
        getOctokit: jest.fn(() => octokit)
    };
}

// index.js runs immediately on import (no exported entry point), so each
// scenario needs a fresh module registry and fresh mocks.
async function runIndex({ inputs, payload, octokit }) {
    jest.resetModules();
    jest.unstable_mockModule('@actions/core', () => makeCore(inputs));
    jest.unstable_mockModule('@actions/github', () => makeGithub(payload, octokit));

    await import('../index.js');

    // let the chain of awaits (listReviews -> listForRef -> merge/comment -> deleteRef) settle
    await flushPromises();
    await flushPromises();

    return {
        core: await import('@actions/core'),
        github: await import('@actions/github')
    };
}

test('test mode comments instead of merging', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { test: 'true', labels: 'ready' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith(expect.objectContaining({
        owner: 'squalrus',
        repo: 'merge-bot',
        issue_number: 20
    }));
    expect(octokit.rest.issues.createComment.mock.calls[0][0].body).toEqual(expect.stringContaining('merge bot test mode'));

    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
    expect(octokit.rest.git.deleteRef).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('eligible pull request is merged and its branch deleted', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'ready', method: 'squash', delete_source_branch: 'true' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.rest.pulls.merge).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        pull_number: 20,
        merge_method: 'squash'
    });
    expect(octokit.rest.git.deleteRef).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        ref: '1234724d27c4fae27b402212182b64fda77040b5'
    });
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('comment on a pull request fetches it and merges it', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: 'ready' },
        payload: payloadIssueComment,
        octokit
    });

    expect(octokit.rest.pulls.get).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        pull_number: 20
    });
    expect(octokit.rest.pulls.merge).toHaveBeenCalledWith(expect.objectContaining({
        pull_number: 20
    }));
});

test('check suite completion fetches its associated pull request and merges it', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: 'ready' },
        payload: payloadCheckSuite,
        octokit
    });

    expect(octokit.rest.pulls.get).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        pull_number: 20
    });
    expect(octokit.rest.pulls.merge).toHaveBeenCalledWith(expect.objectContaining({
        pull_number: 20
    }));
});

test('check suite completion re-evaluates every associated pull request', async () => {
    const octokit = makeOctokit({
        pulls: {
            get: jest.fn((params) => Promise.resolve({
                data: { ...payloadDefault.pull_request, number: params.pull_number }
            })),
            listReviews: jest.fn().mockResolvedValue(reviewsNone),
            merge: jest.fn().mockResolvedValue({})
        }
    });

    await runIndex({
        inputs: { labels: 'ready' },
        payload: payloadCheckSuiteMulti,
        octokit
    });

    expect(octokit.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 20 }));
    expect(octokit.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 21 }));
    expect(octokit.rest.pulls.merge).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 20 }));
    expect(octokit.rest.pulls.merge).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 21 }));
});

test('check suite completion with no associated pull requests is a clean no-op', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'ready' },
        payload: payloadCheckSuiteEmpty,
        octokit
    });

    expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('comment on a plain issue does not attempt to fetch a pull request', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'ready' },
        payload: { action: 'created', issue: { number: 5 }, repository: payloadDefault.repository },
        octokit
    });

    expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('a payload with no pull_request at all (e.g. a push event) is a clean no-op', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'ready' },
        payload: { action: null, repository: payloadDefault.repository },
        octokit
    });

    expect(octokit.rest.pulls.listReviews).not.toHaveBeenCalled();
    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('delete_source_branch=false merges without deleting the branch', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: 'ready', delete_source_branch: 'false' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.rest.pulls.merge).toHaveBeenCalledTimes(1);
    expect(octokit.rest.git.deleteRef).not.toHaveBeenCalled();
});

test('branch from a fork is retained even when delete_source_branch=true', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: '', delete_source_branch: 'true' },
        payload: { action: 'synchronize', ...payloadFork },
        octokit
    });

    expect(octokit.rest.pulls.merge).toHaveBeenCalledTimes(1);
    expect(octokit.rest.git.deleteRef).not.toHaveBeenCalled();
});

test('pull request missing a required label is neither merged nor commented on', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'integrate' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
    expect(octokit.rest.git.deleteRef).not.toHaveBeenCalled();
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('checks are requested by head SHA, not branch name', async () => {
    // a branch name only resolves within the repo it lives in; for a fork
    // PR the head branch exists on the fork, not the base repo, so
    // checks.listForRef must be queried by the (globally resolvable) SHA
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: '' },
        payload: { action: 'synchronize', ...payloadFork },
        octokit
    });

    expect(octokit.rest.checks.listForRef).toHaveBeenCalledWith(expect.objectContaining({
        ref: '05ca724d27c4fae27b402212182b64fda77040b5'
    }));
});

test('an API failure is reported via core.setFailed instead of throwing', async () => {
    const octokit = makeOctokit({
        pulls: {
            listReviews: jest.fn().mockRejectedValue(new Error('boom')),
            merge: jest.fn().mockResolvedValue({})
        }
    });

    const { core } = await runIndex({
        inputs: { labels: 'ready' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(core.setFailed).toHaveBeenCalledWith('boom');
    expect(octokit.rest.pulls.merge).not.toHaveBeenCalled();
});
