const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');
const payloadDefaultExpected = require('../__mocks__/pull/payload-default-expected');

test('pull constructor, default settings', () => {
    const pull = new Pull(payloadDefault);
    const received = JSON.stringify(pull);
    const expected = JSON.stringify(payloadDefaultExpected);

    expect(received).toBe(expected);
});
