const Config = require('../lib/config');
const CoreDefault = require('../__mocks__/config/core-default');
const CoreComplex = require('../__mocks__/config/core-complex');

const coreDefault = new CoreDefault();
const coreComplex = new CoreComplex();

const configDefault = require('../__mocks__/config/config-default');
const configComplex = require('../__mocks__/config/config-complex');

test('config constructor, default settings', () => {
    const config = new Config(coreDefault);
    const received = JSON.stringify(config);
    const expected = JSON.stringify(configDefault);

    expect(received).toBe(expected);
});

test('config constructor, complex settings', () => {
    const config = new Config(coreComplex);
    const received = JSON.stringify(config);
    const expected = JSON.stringify(configComplex);

    expect(received).toBe(expected);
});
