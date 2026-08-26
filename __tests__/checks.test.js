import Pull from '../lib/pull.js';

import payloadDefault from '../__mocks__/pull/payload-default.js';
import configChecks from '../__mocks__/config/config-checks.js';

import checks0 from '../__mocks__/checks/check-0.js';
import checks1a from '../__mocks__/checks/check-1a.js';
import checks1b from '../__mocks__/checks/check-1b.js';
import checks2a from '../__mocks__/checks/check-2a.js';
import checks2b from '../__mocks__/checks/check-2b.js';
import checks2c from '../__mocks__/checks/check-2c.js';
import checks3a from '../__mocks__/checks/check-3a.js';
import checks3b from '../__mocks__/checks/check-3b.js';
import checks4a from '../__mocks__/checks/check-4a.js';

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
