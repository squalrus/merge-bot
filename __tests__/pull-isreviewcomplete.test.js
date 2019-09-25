const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadReviewers0 = require('../__mocks__/pull/payload-reviewers-0');
const payloadReviewers1 = require('../__mocks__/pull/payload-reviewers-1');
const payloadReviewers2 = require('../__mocks__/pull/payload-reviewers-2');

const reviewsNone = require('../__mocks__/pull/reviews-none');
const reviewsDenied = require('../__mocks__/pull/reviews-denied');
const reviewsApproved = require('../__mocks__/pull/reviews-approved');

test('review not required', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews(reviewsNone);

    expect(pull.isReviewComplete(false)).toBe(true);
});

test('review required, no reviews requested, no reviews submitted', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsNone);

    expect(pull.isReviewComplete(true)).toBe(false);
});

test('review required, single review requested, no reviews submitted', () => {
    const pull = new Pull(payloadReviewers1);
    pull.compileReviews(reviewsNone);

    expect(pull.isReviewComplete(true)).toBe(false);
});

test('review required, multiple reviews requested, no reviews submitted', () => {
    const pull = new Pull(payloadReviewers2);
    pull.compileReviews(reviewsNone);

    expect(pull.isReviewComplete(true)).toBe(false);
});

test('review required, no reviews requested, denied reviews submitted', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsDenied);

    expect(pull.isReviewComplete(true)).toBe(false);
});

test('review required, no reviews requested, approved reviews submitted', () => {
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);

    expect(pull.isReviewComplete(true)).toBe(true);
});
