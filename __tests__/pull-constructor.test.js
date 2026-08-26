import Pull from '../lib/pull.js';

import payloadDefault from '../__mocks__/pull/payload-default.js';
import payloadDefaultExpected from '../__mocks__/pull/payload-default-expected.js';

import payloadFork from '../__mocks__/pull/payload-fork.js';
import payloadForkExpected from '../__mocks__/pull/payload-fork-expected.js';

import payloadPullRequest from '../__mocks__/pull_request/payload.js';
import payloadPullRequestExpected from '../__mocks__/pull/payload-pull_request-expected.js';

import payloadPullRequestReview from '../__mocks__/pull_request_review/payload.js';
import payloadPullRequestReviewExpected from '../__mocks__/pull/payload-pull_request_review-expected.js';

test('pull constructor, default settings', () => {
    const pull = new Pull(payloadDefault);
    const received = JSON.stringify(pull);
    const expected = JSON.stringify(payloadDefaultExpected);

    expect(received).toBe(expected);
});

test('pull constructor, fork settings', () => {
    const pull = new Pull(payloadFork);
    const received = JSON.stringify(pull);
    const expected = JSON.stringify(payloadForkExpected);

    expect(received).toBe(expected);
});

test('pull constructor, pull_request payload', () => {
    const pull = new Pull(payloadPullRequest);
    const received = JSON.stringify(pull);
    const expected = JSON.stringify(payloadPullRequestExpected);

    expect(received).toBe(expected);
});

test('pull constructor, pull_request_review payload', () => {
    const pull = new Pull(payloadPullRequestReview);
    const received = JSON.stringify(pull);
    const expected = JSON.stringify(payloadPullRequestReviewExpected);

    expect(received).toBe(expected);
});
