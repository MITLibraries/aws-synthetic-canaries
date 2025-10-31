# Canary to check Lambda Function URLs

A generic-ish CloudWatch Synthetic Canary to health-check Lambda Function URLs using HTTP POST.

## Development

It is very difficult to run local tests for AWS CloudWatch Synthetic Canaries. AWS has some documentation for this, but it does not appear to work well. So, any development work will involve locally zipping the code and manually uploading to S3 and then triggering the Canary to update and run.

It is possible to run `jest` tests locally. Just be sure to set the following in your local environment (a `.env` in the `nodejs/` folder will work)

```shell
NODE_ENV=test
CANARY_URL=https://a.fake.url
CANARY_PAYLOAD={"foo":"bar"}
```

## Runtime

When deploying a CloudWatch Synthetic Canary, a runtime must be specified. The runtime for this canary is `syn-nodejs-puppeteer-11.0`. Typically, the canary is deployed with Terraform:

```hcl
resource "aws_synthetics_canary" "js_node_puppet" {
  name                 = "<name-of-canary>"
  artifact_s3_location = "s3://<artifact_bucket_name>/path/to/canary/artifacts"
  execution_role_arn   = aws_iam_role.canary_execution_role.arn
  handler              = "index.handler"
  start_canary         = true
  runtime_version      = "syn-nodejs-puppeteer-11.0"
  s3_bucket            = "s3://<source_bucket_name>"
  s3_key               = "path/to/canary.zip"
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

For the `syn-nodejs-puppeteer-11.0` runtime, the only thing that needs to be zipped is the `index.js` file itself. In the Terraform, the `handler` must be the name of the `.js` file followed by `.handler`. So, if our Javascript file was `canary.js`, the `handler` value in the Terraform would be 

```hcl
  handler = "canary.handler"
```

## Dependencies / Environment

This AWS CloudWatch Synthetic Canary requires two environment variables:

```shell
CANARY_URL = ### A full URL, including the https:// at the font
CANARY_PAYLOAD = ### A simple one-line JSON string like {'foo':'bar'}
```
