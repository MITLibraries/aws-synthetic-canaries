/**
 * Tests for main() using mocked Lambda Function URL
 */

jest.mock('Synthetics'); // Uses __mocks__/Synthetics.js
jest.mock('SyntheticsLogger'); // <- uses __mocks__/SyntheticsLogger.js

const { main } = require('../nodejs/index.js');
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const TEST_URL = 'https://fake.url.com'

describe('main() tests', () => {
    const ORIG_ENV = process.env

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...ORIG_ENV };
    });

    afterAll(() => {
        process.env = ORIG_ENV;
    });

    describe('❌ rejects when there are errors in the environment', () => {
        it('throws error if CANARY_URL is missing', async() => {
            delete process.env.CANARY_URL;
            process.env.CANARY_PAYLOAD = '{"foo":"bar"}';

            await expect(main()).rejects.toThrow("Environment variable CANARY_URL is not set.");
        });

        it('throws error if CANARY_PAYLOAD is missing', async () => {
            process.env.CANARY_URL = TEST_URL;
            delete process.env.CANARY_PAYLOAD;

            await expect(main()).rejects.toThrow("Environment variable CANARY_PAYLOAD is not set.");
        });

        it('throws error if CANARY_PAYLOAD contains invalid JSON', async () => {
            process.env.CANARY_URL = TEST_URL;
            process.env.CANARY_PAYLOAD = '{invalid-json';

            await expect(main()).rejects.toThrow(/Invalid JSON in CANARY_PAYLOAD/);
        });
    });

    describe('✅ successfully calls the _checkUrl function with correct environment', () => {
        it('calls synthetics.executeStep with valid env vars', async () => {
            process.env.CANARY_URL = TEST_URL;
            process.env.CANARY_PAYLOAD = JSON.stringify({ foo: 'bar' });

            // Prevent the real `_checkUrl` from being executed by having the
            // Synthetics mock capture the step function but NOT invoke it.
            let capturedFn;
            synthetics.executeStep.mockImplementation(async (_name, fn) => {
                capturedFn = fn; // store but don't call
                return; // resolves immediately
            });

            await expect(main()).resolves.not.toThrow();

            expect(synthetics.executeStep).toHaveBeenCalledWith(
                'check_lambda_function_url',
                expect.any(Function)
            );

            // The step function's source should include a call to `_checkUrl`,
            // which verifies that `main()` intends to call that internal helper
            // without actually invoking it.
            expect(typeof capturedFn).toBe('function');
            expect(capturedFn.toString()).toMatch(/_checkUrl\(/);

            expect(log.info).toHaveBeenCalled();
        });
    })
});
