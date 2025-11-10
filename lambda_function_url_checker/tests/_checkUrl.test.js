/**
 * Tests for _checkUrl() using mocked Lambda Function URL
 */
const { _checkUrl } = require('../index.js');
const https = require('https');

const TEST_URL = 'https://fake.url.com'
const TEST_DATA = JSON.stringify({ foo : 'bar' })

describe('_checkUrl tests', () => {
    let mockRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn()
        };

        jest.spyOn(https, 'request').mockImplementation((url, options, callback) => {
            return mockRequest;
        });
    });

    describe('✅ resolves when status code is 2xx', () => {
        it('resolves for HTTP 200 OK', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 200 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).resolves.toBe(200);
        });

        it('resolves for HTTP 201 Created', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 201 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).resolves.toBe(201);
        });

        it('resolves for HTTP 202 Accepted', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 202 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).resolves.toBe(202);
        });
    });

    describe('❌ rejects when status code is 3xx, 4xx, or 5xx', () => {
        it('rejects on HTTP 301 Moved Permanently', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 301 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Unexpected HTTP status code: 301');
        });

        it('rejects on HTTP 302 Found', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 302 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Unexpected HTTP status code: 302');
        });

        it('rejects on HTTP 401 Unauthorized', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 401 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Client error (4xx) received: 401');
        });

        it('rejects on HTTP 403 Forbidden', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 403 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Client error (4xx) received: 403');
        });

        it('rejects on HTTP 500 Internal Server Error', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 500 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Server error (5xx) received: 500');
        });

        it('rejects on HTTP 501 Not Implemented', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 501 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Server error (5xx) received: 501');
        });

        it('rejects on HTTP 502 Bad Gateway', async () => {
            https.request.mockImplementation((url, options, callback) => {
                process.nextTick(() => callback({ statusCode: 502 }));
                return mockRequest;
            });
            await expect(_checkUrl(TEST_URL, TEST_DATA)).rejects.toThrow('Server error (5xx) received: 502');
        });
    });
});
