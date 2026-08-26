const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');

const reviewData = require('../__mocks__/pull/review-data');
const reviewDataExpected = require('../__mocks__/pull/review-data-expected');

const reviewsOutOfOrder = require('../__mocks__/pull/reviews-out-of-order');
const reviewsOutOfOrderExpected = require('../__mocks__/pull/reviews-out-of-order-expected');

const checks0 = require('../__mocks__/checks/check-0');

test('parse valid reviews data', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews(reviewData);

    const received = JSON.stringify(pull.reviews);
    const expected = JSON.stringify(reviewDataExpected);

    expect(received).toStrictEqual(expected);
});

test('parse empty reviews data', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews({});

    const received = JSON.stringify(pull.reviews);
    const expected = JSON.stringify({});

    expect(received).toStrictEqual(expected);
});

test('parse invalid reviews data', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews({ "data": {} });

    const received = JSON.stringify(pull.reviews);
    const expected = JSON.stringify({});

    expect(received).toStrictEqual(expected);
});

test('parse reviews data with an out-of-order (older) resubmission ignored', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews(reviewsOutOfOrder);

    const received = JSON.stringify(pull.reviews);
    const expected = JSON.stringify(reviewsOutOfOrderExpected);

    expect(received).toStrictEqual(expected);
});

test('compile checks with undefined checks payload leaves checks unset', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(undefined);

    expect(pull.checks).toStrictEqual({});
});

test('compile checks with a payload missing data leaves checks unset', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks({});

    expect(pull.checks).toStrictEqual({});
});

test('compile checks with valid data overwrites a previously compiled value', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks0);
    pull.compileChecks(undefined);

    expect(pull.checks).toStrictEqual({ total: 0, completed: 0, success: 0 });
});
