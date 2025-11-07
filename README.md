# Synthetic Canaries

Application code for Synthetic Canaries that run in AWS to monitor products/services with public-facing web URLs.

## Structure

This is a monorepo that holds all of the Synthetic Canary applications, each having its own top-level folder. At this time, there is one actual Synthetic Canary (`lambda_function_url_checker`) and one fake Synthetic Canary (`alb_url_checker`):

```sh
.
├── alb_url_checker/
├── lambda_function_url_checker/
├── Makefile
└── README.md
```

See the `README.md` in each folder for details on the specific application.

## Development Overview

* Creating a new canary is as simple as creating a root level folder
* A single canary may perform checking for one or many applications; it provides a method but is agnostic to what application it's used to check
* Each canary in this repository (that is, each top-level folder) will have a few hard requirements:
  * A `.runtime` file in the folder that designates the expected Synthetics Canary runtime (see [AWS: Synthetics runtime versions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_Library.html))
  * A `Makefile` with (at a minimum) `install`, `update`, and `test` targets (as these are expected by the root [Makefile](./Makefile))
  * A `zipmanifest.txt` file that designates how the ZIP will be built for loading into a Synthetics Canary (different Synthetic Canary runtimes have different requirements for the structure of the ZIP file)

## Deployment Overview

Deploying (or building) in this repository simply means copying a ZIP file of an application to a shared S3 bucket in AWS. That ZIP file is like a blueprint (or template) application that can be loaded into a Synthetic Canary that is built by Terraform to monitor an HTTP/HTTPS endpoint. It will be helpful to have both a `zip` and a `dev-publish` targets in the canary folder `Makefile` so that it will be easy for the developer to deploy the ZIP to Dev1 for testing in AWS.

The rest of the deployment process is handled by GitHub Actions, following the MITL typical GitHub-flow:

* Opening a PR to `main` will deploy the ZIP to our dev AWS account (and create/update SSM Parameters)
* Merging a PR to `main` will deploy the ZIP to our stage AWS account (and create/update SSM Parameters)
* Tagging a release on `main` will deploy the ZIP to our prod AWS account (and create/update SSM Parameters)

## General Overview

The general idea of this repository is to de-couple the actual CloudWatch Synthetic Canary application code from the Terraform repositories that will deploy the Canary to monitor web services. Since the application code is decoupled from the Terraform repositories, it means that we can write fewer applications that are more generic (they are like blueprints or templates). We can customize the generic applications in each Terraform repository that builds the Canary infrastructure by using environment variables that can be set by Terraform. This requires that we export some critical information from the deployment process for this repository to SSM Parameter Store so that the dependent Terraform repositories can read this information to build the infrastructure for the Canary correctly.

In particular, the following values are exported for each application (e.g., folder) here:

* `<application_name>_key`: This is the S3 key in the shared files S3 bucket where the ZIP file is saved by the automated deployment process. This information is required by Terraform to correctly build the Canary.
* `<application_name>_runtime`: This is the expected runtime for the application that is designated in the `.runtime` file in the application folder. This information is required by Terraform to correctly build the Canary.

Because different Canary runtimes required different ZIP file/folder structure, the developer must also create a `zipmanifest.txt` file to list the files/folders that should be ZIPped for the specified runtime. For example, the `syn-node-puppeteer-10.0` runtime required a nested folder structure for the Javascript files, but `syn-node-puppeteer-11.0` just needs the single `.js` file zipped up, with no folder structure.

## Makefile

There is a `Makefile` at the root of the repository which has a set of shared commands for all the projects/apps in the monorepo. The targets in this `Makefile` are set to just run commands in `Makefiles` in all of the project subdirectories.

* `make install-all`: Dependency install for all project subfolders (it just runs `make install` in each folder)
* `make update-all`: Dependency updates for all proejct subfolders (it just runs `make update` in each folder)
* `make test-all`: Run tests for all the projects at once (it just runs `make test` in each folder)

For details on the project-specific `Makefile` targets, see the project-specific `README.md` files

## GitHub Actions

There are four GitHub Actions workflows in total, one for CI and three for deployment (dev, stage, and prod).

The CI workflow, just executes the `make install-all` and `make test-all` for all the projects.

The deploy workflow is a bit more complicated. First, using the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script, it creates a list of all the top-level folders that have changes in the current commit/branch in GitHub. That list gets passed to the next job in the workflow as a matrix, so that the Action will run the deployment steps for each folder with changes. If the feature branch only has changes in one canary folder, only one deployment will get pushed to AWS. If there are changes across multiple top level folders, the deployment workflow will deploy each of those applications to S3 during the Action run.

### generate-matrix.sh

The [generate-matrix.sh](.github/scripts/generate-matrix.sh) script generates a list of top level folders that have changes, as determined by `git diff` between two different commit SHAs. It saves the list as a JSON object so that it can be used by the `strategy.matrix` method in GitHub actions. For more details on `strategy.matrix`, see [GitHub: Running variations of a job in a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations).

The expectation is that [generate-matrix.sh](.github/scripts/generate-matrix.sh) will run in the context of a GitHub Action. So, testing this script locally requires setting some environment variables that would normally be set in the context of a GitHub Action. For this script, the required GHA env vars are

* `GITHUB_EVENT_CREATED`: This is false unless this is the first push of a new branch to GitHub
* `GITHUB_EVENT_BEFORE`: The commit SHA of the branch before the push (for `on: push`) or the the previous commit SHA for the `HEAD` of the branch being merged (for `on: pull_request`)
* `GITHUB_SHA`: The SHA of the commit that triggered the workflow (it's the `HEAD` commit for `on: push`, it's a temporary merge commit for `on: pull_request`, it's the most recent commit on the selected branch for `on: workflow_disptach)

To run a local test, this is the easiest method:

```bash
GITHUB_EVENT_CREATED=false \
  GITHUB_SHA=<commit_sha> \ 
  GITHUB_EVENT_BEFORE=<earlier_commit_sha> \
  ./.github/scripts/generate-matrix.sh
```

To test what happens on the first push of a new branch, just use this instead:

```bash
GITHUB_EVENT_CREATED=true \
  GITHUB_SHA=<commit_sha> \ 
  GITHUB_EVENT_BEFORE=<earlier_commit_sha> \
  ./.github/scripts/generate-matrix.sh
```

To verify that the script is properly exporting the matrix, use this:

```bash
export GITHUB_OUTPUT=$(mktemp) && \
  GITHUB_EVENT_CREATED=false \
  GITHUB_SHA=<commit_sha> \
  GITHUB_EVENT_BEFORE=<earlier_commit_sha> \
  ./.github/scripts/generate-matrix.sh && \
  cat $GITHUB_OUTPUT
```

## Related Assets

This section provides descriptions of any infrastructure and application github repositories that this infrastructure application is related to.

### This Repsitory Depends On

* [mitlib-tf-workloads-init](https://github.com/mitlibraries/mitlib-tf-workloads-init) The "init" repo builds the OIDC Role/Policy/Configuration that is used by GitHub Actions in this repository. The Actions here cannot run without the "init" infrastructure already in place.

## Depends On This Repository

* [mitlib-tf-workloads-apt](https://github.com/mitlibraries/mitlib-tf-workloads-apt): The APT infrastructure repository creates a Canary to monitor the APT Lambda Function URL (using the code in [lambda_function_url_checker](./lambda_function_url_checker/).

## Maintainers

* Owner: See [CODEOWNERS](./.github/CODEOWNERS)
* Team: See [CODEOWNERS](./.github/CODEOWNERS)
* Last Maintenance: 2025-11
