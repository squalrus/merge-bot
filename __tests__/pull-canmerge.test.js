import Pull from '../lib/pull.js';

import checks from '../__mocks__/checks/check-4a.js';

import payloadDefault from '../__mocks__/pull/payload-default.js';
import payloadReviewers0 from '../__mocks__/pull/payload-reviewers-0.js';
import payloadReviewers1 from '../__mocks__/pull/payload-reviewers-1.js';
import payloadReviewers2 from '../__mocks__/pull/payload-reviewers-2.js';
import payloadDefaultExpected from '../__mocks__/pull/payload-default-expected.js';

import reviewsNone from '../__mocks__/pull/reviews-none.js';
import reviewsDenied from '../__mocks__/pull/reviews-denied.js';
import reviewsApproved from '../__mocks__/pull/reviews-approved.js';

import reviewData from '../__mocks__/pull/review-data.js';
import reviewDataExpected from '../__mocks__/pull/review-data-expected.js';

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
