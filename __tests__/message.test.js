import Config from '../lib/config.js';
import CoreDefault from '../__mocks__/config/core-default.js';
const coreDefault = new CoreDefault();

import CoreNoLabels from '../__mocks__/config/core-no-labels.js';
const coreNoLabels = new CoreNoLabels();

import Pull from '../lib/pull.js';
import payloadDefault from '../__mocks__/pull/payload-default.js';
import payloadReviewers0 from '../__mocks__/pull/payload-reviewers-0.js';
import reviewsApproved from '../__mocks__/pull/reviews-approved.js';

import renderMessage from '../lib/message.js';
import messageExpected from '../__mocks__/message/message-expected.js';
import messageExpectedMergeable from '../__mocks__/message/message-expected-mergeable.js';

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
