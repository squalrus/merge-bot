const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadFork = require('../__mocks__/pull/payload-fork');
const reviewsNone = require('../__mocks__/pull/reviews-none');
const checks0 = require('../__mocks__/checks/check-0');

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
    return Object.assign({
        pulls: {
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
    }, overrides);
}

function makeGithub(payload, octokit) {
    return {
        context: { payload },
        getOctokit: jest.fn(() => octokit)
    };
}

// index.js runs immediately on require (no exported entry point), so each
// scenario needs a fresh module registry and fresh mocks.
async function runIndex({ inputs, payload, octokit }) {
    jest.resetModules();
    jest.doMock('@actions/core', () => makeCore(inputs));
    jest.doMock('@actions/github', () => makeGithub(payload, octokit));

    require('../index');

    // let the chain of awaits (listReviews -> listForRef -> merge/comment -> deleteRef) settle
    await flushPromises();
    await flushPromises();

    return {
        core: require('@actions/core'),
        github: require('@actions/github')
    };
}

afterEach(() => {
    jest.dontMock('@actions/core');
    jest.dontMock('@actions/github');
});

test('test mode comments instead of merging', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { test: 'true', labels: 'ready' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.issues.createComment).toHaveBeenCalledTimes(1);
    expect(octokit.issues.createComment).toHaveBeenCalledWith(expect.objectContaining({
        owner: 'squalrus',
        repo: 'merge-bot',
        issue_number: 20
    }));
    expect(octokit.issues.createComment.mock.calls[0][0].body).toEqual(expect.stringContaining('merge bot test mode'));

    expect(octokit.pulls.merge).not.toHaveBeenCalled();
    expect(octokit.git.deleteRef).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('eligible pull request is merged and its branch deleted', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'ready', method: 'squash', delete_source_branch: 'true' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.pulls.merge).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        pull_number: 20,
        merge_method: 'squash'
    });
    expect(octokit.git.deleteRef).toHaveBeenCalledWith({
        owner: 'squalrus',
        repo: 'merge-bot',
        ref: '1234724d27c4fae27b402212182b64fda77040b5'
    });
    expect(octokit.issues.createComment).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
});

test('delete_source_branch=false merges without deleting the branch', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: 'ready', delete_source_branch: 'false' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.pulls.merge).toHaveBeenCalledTimes(1);
    expect(octokit.git.deleteRef).not.toHaveBeenCalled();
});

test('branch from a fork is retained even when delete_source_branch=true', async () => {
    const octokit = makeOctokit();
    await runIndex({
        inputs: { labels: '', delete_source_branch: 'true' },
        payload: { action: 'synchronize', ...payloadFork },
        octokit
    });

    expect(octokit.pulls.merge).toHaveBeenCalledTimes(1);
    expect(octokit.git.deleteRef).not.toHaveBeenCalled();
});

test('pull request missing a required label is neither merged nor commented on', async () => {
    const octokit = makeOctokit();
    const { core } = await runIndex({
        inputs: { labels: 'integrate' },
        payload: { action: 'synchronize', ...payloadDefault },
        octokit
    });

    expect(octokit.pulls.merge).not.toHaveBeenCalled();
    expect(octokit.git.deleteRef).not.toHaveBeenCalled();
    expect(octokit.issues.createComment).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
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
    expect(octokit.pulls.merge).not.toHaveBeenCalled();
});
