# Canary to check Lambda Function URLs

A generic-ish CloudWatch Synthetic Canary to health-check Lambda Function URLs using HTTP POST.

## Overview

This canary can be used to test any deployed Lambda that has a Function URL. This is acheived by making an HTTP post request with a JSON payload to the Lambda's Function URL and then monitoring just the HTTP response code.

**Note**: The Canary itself will be deployed by the same Terraform repository that deploys the Lambda. That Terraform repo will set the URL and payload string environment variables as part of the definition of the Canary.

Broadly speaking, a 200 response is all that's required to demonstrate the lambda is not idle.

This CloudWatch Synthetic Canary application that is built on Javascript/Nodejs/Puppeteer and expects the `syn-nodejs-puppeteer-13.1` runtime. The following file structure is expected for an application like this:

```bash
.
├── .runtime
├── index.js
├── Makefile
├── package-lock.json
├── package.json
├── README.md
├── tests/
└── zipmanifest.txt
```

* [index.js](./index.js): the actual application
* [.runtime](./.runtime): designates the expected runtime in CloudWatch Synthetics. See [AWS: Synthetics runtime versions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_Library.html) for details
* [zipmanifest.txt](./zipmanifest.txt): The list of files/folders to be zipped together when publishing the app to the S3 bucket

## Development

It is very difficult to run local integration tests for AWS CloudWatch Synthetic Canaries. AWS has some documentation for this, but it does not appear to work well. So, any development work will involve locally zipping the code and manually uploading to S3 and then triggering the Canary to update and run.

It is possible to run unit tests with `jest` locally. Just be sure to set the following in your local environment (a `.env` in the folder will work):

```shell
NODE_ENV=test
CANARY_URL=https://a.fake.url
CANARY_PAYLOAD={"foo":"bar"}
```

There is a `Makefile` with a short list of useful commands/targets. To use `make dev-publish`, you must be authenticated to AWS on the CLI.

## Runtime

When deploying a CloudWatch Synthetic Canary, a runtime must be specified. The runtime for this canary is `syn-nodejs-puppeteer-x.y` and is set in the [`.runtime`](./.runtime) file in this folder. The deployment automation in GitHub Actions will push the key to the ZIP file and the designated runtime value to SSM Parameter Store so that Terraform can pick up these values programmatically. Typically, the canary is deployed with Terraform:

```hcl
resource "aws_synthetics_canary" "js_node_puppet" {
  name                 = "<name-of-canary>"
  artifact_s3_location = "s3://<artifact_bucket_name>/path/to/canary/artifacts"
  execution_role_arn   = aws_iam_role.canary_execution_role.arn
  handler              = "index.handler"
  start_canary         = true
  runtime_version      = data.aws_ssm_parameter.lambda_function_url_checker_runtime.value
  s3_bucket            = data.aws_ssm_parameter.shared_bucket_id.value
  s3_key               = data.aws_ssm_parameter.lambda_function_url_checker_key.value
  schedule {
    expression = "rate(99 minutes)"
  }
  run_config {
    timeout_in_seconds = 60
    environment_variables = {
      CANARY_URL     = data.aws_ssm_parameter.lambda_function_url.value
      CANARY_PAYLOAD = jsonencode(data.aws_ssm_parameter.lambda_fuction_payload.value)
    }
  }
}
```

Starting with the `syn-nodejs-puppeteer-11.0` runtime, the only thing that needs to be zipped is the `index.js` file itself. In the Terraform, the `handler` must be the name of the `.js` file followed by `.handler`. So, if our Javascript file was `canary.js`, the `handler` value in the Terraform would be

```hcl
  handler = "canary.handler"
```

To see the list of available Nodejs/Puppeteer runtimes, the following AWS CLI command is the quickest option:

```bash
aws synthetics describe-runtime-versions | grep syn-nodejs-puppeteer
```

## Dependencies / Environment

This AWS CloudWatch Synthetic Canary requires two environment variables:

```shell
CANARY_URL = ### A full URL, including the https:// at the font
CANARY_PAYLOAD = ### A simple one-line JSON string like {'foo':'bar'}
```

The Canary executes a `POST` to the Lambda Function at `CANARY_URL` with the `CANARY_PAYLOAD` JSON-formatted payload. It ignores the content of the response but captures the HTTP response code and logs that in CloudWatch metrics.
