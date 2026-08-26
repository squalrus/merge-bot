import Pull from '../lib/pull.js';

import payloadDefault from '../__mocks__/pull/payload-default.js';
import payloadReviewers0 from '../__mocks__/pull/payload-reviewers-0.js';
import payloadReviewers1 from '../__mocks__/pull/payload-reviewers-1.js';
import payloadReviewers2 from '../__mocks__/pull/payload-reviewers-2.js';

import reviewsNone from '../__mocks__/pull/reviews-none.js';
import reviewsDenied from '../__mocks__/pull/reviews-denied.js';
import reviewsApproved from '../__mocks__/pull/reviews-approved.js';

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
