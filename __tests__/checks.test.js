const Pull = require('../lib/pull');

const payloadDefault = require('../__mocks__/pull/payload-default');
const configChecks = require('../__mocks__/config/config-checks');

const checks0 = require('../__mocks__/checks/check-0');
const checks1a = require('../__mocks__/checks/check-1a');
const checks1b = require('../__mocks__/checks/check-1b');
const checks2a = require('../__mocks__/checks/check-2a');
const checks2b = require('../__mocks__/checks/check-2b');
const checks2c = require('../__mocks__/checks/check-2c');
const checks3a = require('../__mocks__/checks/check-3a');
const checks3b = require('../__mocks__/checks/check-3b');
const checks4a = require('../__mocks__/checks/check-4a');

test('empty checks data', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks0);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data queued, in_progress, completed (success)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks1a);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data queued, in_progress, completed (failure)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks1b);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data in_progress, completed 2x (success)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks2a);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(true);
});

test('checks data in_progress, completed 2x (success, failure)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks2b);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data in_progress, completed 2x (failure)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks2c);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data completed 3x (success)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks3a);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(true);
});

test('checks data completed 3x (failure)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks3b);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(false);
});

test('checks data in_progress, completed 6x (success)', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks4a);

    expect(pull.isChecksComplete(configChecks.checks_enabled)).toBe(true);
});

test('checks data in_progress, completed 6x (success) + checks_enabled = false', () => {
    const pull = new Pull(payloadDefault);
    pull.compileChecks(checks4a);

    expect(pull.isChecksComplete(false)).toBe(true);
});
