const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');

const reviewData = require('../__mocks__/pull/review-data');
const reviewDataExpected = require('../__mocks__/pull/review-data-expected');

test('parse valid reviews data', () => {
    const pull = new Pull(payloadDefault);
    pull.compileReviews(reviewData);

    const received = JSON.stringify(pull.getCompletedReviewers());
    const expected = JSON.stringify(["octocat"]);

    expect(received).toStrictEqual(expected);
});
