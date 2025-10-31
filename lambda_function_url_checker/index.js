const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const https = require('https');

/**
 * For local testing, using a .env file
 */
if (process.env.NODE_ENV === 'test') {
    require('dotenv').config();
}


/**
 * The internal helper function that make the HTTPS POST to the Lambda Function
 * URL and processes the HTTP Response Code
 */
const _checkUrl = async (url, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AWS-Synthetics-Canary',
                'Content-Length': data.length
            },
            timeout: 10000 // 10 seconds
        };

        const req = https.request(url, options, (res) => {
            const statusCode = res.statusCode;
            log.info(`Received HTTP status code: ${statusCode}`);

            if (statusCode >= 300 && statusCode < 400) {
                return reject(new Error(`Unexpected HTTP status code: ${statusCode}`));
            } else if (statusCode >= 400 && statusCode < 500) {
                return reject(new Error(`Client error (4xx) received: ${statusCode}`));
            } else if (statusCode >= 500 && statusCode < 600) {
                return reject(new Error(`Server error (5xx) received: ${statusCode}`));
            } else {
                resolve(statusCode);
            }
        });

        req.on('error', (e) => {
            reject(new Error(`Request error: ${e.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(data);
        req.end();
    });
};

/**
 * Load and test environment variables and prep for POST to Lambda Function URL
 */
const main = async () => {
    const url = process.env.CANARY_URL;
    const payloadEnv = process.env.CANARY_PAYLOAD;

    if (!url) throw new Error("Environment variable CANARY_URL is not set.");
    if (!payloadEnv) throw new Error("Environment variable CANARY_PAYLOAD is not set.");

    let payload;
    try {
        payload = JSON.parse(payloadEnv);
    } catch (e) {
        throw new Error(`Invalid JSON in CANARY_PAYLOAD: ${e.message}`);
    }

    const data = JSON.stringify(payload);
    log.info(`Checking Lambda Function URL: ${url} with payload ${data}`);

    const start = Date.now();
    await synthetics.executeStep('check_lambda_function_url', async () => {
        await _checkUrl(url, data);
    });
    const elapsed = Date.now() - start;
    log.info(`Check completed in ${elapsed} ms`);
};

/**
 * 
 * The AWS Synthetics Canary entry point (index.handler)
 */
exports.handler = async () => {
    return await main();
};

if (process.env.NODE_ENV === 'test') {
    module.exports = { _checkUrl, main };
}
