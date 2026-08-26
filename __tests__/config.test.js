import Config from '../lib/config.js';
import CoreDefault from '../__mocks__/config/core-default.js';
import CoreComplex from '../__mocks__/config/core-complex.js';
import CoreNoLabels from '../__mocks__/config/core-no-labels.js';

const coreDefault = new CoreDefault();
const coreComplex = new CoreComplex();
const coreNoLabels = new CoreNoLabels();

import configDefault from '../__mocks__/config/config-default.js';
import configComplex from '../__mocks__/config/config-complex.js';
import configNoLabels from '../__mocks__/config/config-no-labels.js';

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

test('config constructor, complex settings', () => {
    const config = new Config(coreNoLabels);
    const received = JSON.stringify(config);
    const expected = JSON.stringify(configNoLabels);

    expect(received).toBe(expected);
});
