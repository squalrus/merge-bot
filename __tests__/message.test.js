const Config = require('../lib/config');
const CoreDefault = require('../__mocks__/config/core-default');
const coreDefault = new CoreDefault();

const CoreNoLabels = require('../__mocks__/config/core-no-labels');
const coreNoLabels = new CoreNoLabels();

const Pull = require('../lib/pull');
const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadReviewers0 = require('../__mocks__/pull/payload-reviewers-0');
const reviewsApproved = require('../__mocks__/pull/reviews-approved');

const renderMessage = require('../lib/message');
const messageExpected = require('../__mocks__/message/message-expected');
const messageExpectedMergeable = require('../__mocks__/message/message-expected-mergeable');

test('render message, pull cannot merge', () => {
    const config = new Config(coreDefault);
    const pull = new Pull(payloadDefault);
    const received = renderMessage('foo', config, pull);

    expect(received).toBe(messageExpected);
});

test('render message, pull can merge', () => {
    const config = new Config(coreNoLabels);
    const pull = new Pull(payloadReviewers0);
    pull.compileReviews(reviewsApproved);
    const received = renderMessage('foo', config, pull);

    expect(received).toBe(messageExpectedMergeable);
});
