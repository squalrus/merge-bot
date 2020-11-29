const Pull = require('../lib/pull');

const checks = require('../__mocks__/checks/check-4a');

const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadReviewers0 = require('../__mocks__/pull/payload-reviewers-0');
const payloadReviewers1 = require('../__mocks__/pull/payload-reviewers-1');
const payloadReviewers2 = require('../__mocks__/pull/payload-reviewers-2');
const payloadDefaultExpected = require('../__mocks__/pull/payload-default-expected');

const reviewsNone = require('../__mocks__/pull/reviews-none');
const reviewsDenied = require('../__mocks__/pull/reviews-denied');
const reviewsApproved = require('../__mocks__/pull/reviews-approved');

const reviewData = require('../__mocks__/pull/review-data');
const reviewDataExpected = require('../__mocks__/pull/review-data-expected');

test('merge when a single required label matches', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": [ "ready" ],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(true);
});

test('merge when multiple required labels match', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready" , "foo"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(true);
});

test('do not merge when required label missing', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready", "foo", "integrate"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('do not merge when blocking label matches', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready", "foo"],
        "blocking_labels": ["bar"],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('merge when blocking label does not match', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready", "foo"],
        "blocking_labels": ["do not integrate"],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(true);
});

test('do not merge when pending reviewer', () => {
    const pull = new Pull(payloadReviewers1);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('do not merge when pending reviewers', () => {
    const pull = new Pull(payloadReviewers2);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('do not merge when reviews denied', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsDenied);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('do not merge when reviews missing', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsNone);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": ["ready"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('merge when reviews not required, labels match', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsNone);
    pull.compileChecks(checks);

    const config = {
        "review_required": false,
        "labels": ["ready"],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(true);
});

test('do not merge when reviews not required, blocking labels match', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsNone);
    pull.compileChecks(checks);

    const config = {
        "review_required": false,
        "labels": ["ready"],
        "blocking_labels": ["foo"],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(false);
});

test('merge when labels not required, reviews required', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    pull.compileChecks(checks);

    const config = {
        "review_required": true,
        "labels": [],
        "blocking_labels": [],
        "checks_enabled": true
    };

    expect(pull.canMerge(config)).toBe(true);
});
