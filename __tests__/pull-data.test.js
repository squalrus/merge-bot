const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');

const reviewData = require('../__mocks__/pull/review-data');
const reviewDataExpected = require('../__mocks__/pull/review-data-expected');

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
