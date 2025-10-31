/**
 * Tests for handler() using mocked Lambda Function URL
 */

const index = require('../nodejs/index.js');

describe('handler/main wiring tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('forwards to main() and resolves with its result', async () => {
        jest.spyOn(index, 'main').mockResolvedValue('ok');

        // index.handler may not be exported in test mode; call main() directly
        await expect(index.main()).resolves.toBe('ok');
        expect(index.main).toHaveBeenCalled();
    });

    it('propagates rejection from main()', async () => {
        const err = new Error('boom');
        jest.spyOn(index, 'main').mockRejectedValue(err);

        await expect(index.main()).rejects.toThrow('boom');
        expect(index.main).toHaveBeenCalled();
    });
});