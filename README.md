# Synthetic Canaries

Application code for Synthetic Canaries that run in AWS to monitor products/services with public-facing web URLs.

## Structure

This is a monorepo that can hold all of the Synthetic Canary applications, each having its own top-level folder. At this time, there is one actual Synthetic Canary (`lambda_function_url_checker`) and one fake Synthetic Canary (`alb_url_checker`):

```sh
.
├── alb_url_checker
├── lambda_function_url_checker
├── Makefile
└── README.md
```

See the README in each folder for details on the specific application.

## Makefile

There is a `Makefile` at the root of the repository which a set of shared commands for all the projects/apps in the monorepo. This includes `make install` and `make update` to handle dependencies for Javascript/Node.js. This also includes `make test` to run `jest` tests for the Javascript apps. 

Finally, it includes `make deploy-dev PROJ=<folder>` which will package up the application in the `<folder>` and deploy it to an S3 bucket for use by Terraform. Note that the `make deploy-dev` command **requires** setting the `PROJ` value when calling the command and **requires** that a local ENV VAR named `S3BUCKET` is set (which should be the name of the S3 bucket where the `.zip` file should land).
