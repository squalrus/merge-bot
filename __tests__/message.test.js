const Config = require('../lib/config');
const CoreDefault = require('../__mocks__/config/core-default');
const coreDefault = new CoreDefault();

const Pull = require('../lib/pull');
const payloadDefault = require('../__mocks__/pull/payload-default');

const renderMessage = require('../lib/message');
const messageExpected = require('../__mocks__/message/message-expected');

test('render message', () => {
    const config = new Config(coreDefault);
    const pull = new Pull(payloadDefault);
    const received = renderMessage('foo', config, pull);

    expect(received).toBe(messageExpected);
});
