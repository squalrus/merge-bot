const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadDefaultExpected = require('../__mocks__/pull/payload-default-expected');

const payloadFork = require('../__mocks__/pull/payload-fork');
const payloadForkExpected = require('../__mocks__/pull/payload-fork-expected');

const payloadPullRequest = require('../__mocks__/pull_request/payload');
const payloadPullRequestExpected = require('../__mocks__/pull/payload-pull_request-expected');

const payloadPullRequestReview = require('../__mocks__/pull_request_review/payload');
const payloadPullRequestReviewExpected = require('../__mocks__/pull/payload-pull_request_review-expected');

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
