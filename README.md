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
