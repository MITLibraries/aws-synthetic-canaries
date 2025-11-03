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

There is a `Makefile` at the root of the repository which a set of shared commands for all the projects/apps in the monorepo. The targets in this `Makefile` are set to just run commands in `Makefiles` in all of the project subdirectories.

* `make install-all`: Dependency install for all project subfolders
* `make update-all`: Dependency updates for all proejct subfolders
* `make test-all`: Run tests for all the projects at once

For details on the project-specific `Makefile` targets, see the project-specific `README.md` files

## GitHub Actions

There are two GitHub Actions workflows, one for CI and one for deployment. 

The CI workflow, just executes the `make install-all` and `make test-all` for all the projects.

The deploy workflow is a bit more complicated. First, it builds a matrix of project folders that have changes and then runs the ZIP deploy for only the project folders with changes. The construction of the matrix is extracted to a `bash` script [generate-matrix.sh](.github/scripts/generate-matrix.sh) to make it a little easier to do local testing.

### generate-matrix.sh

The expectation is that [generate-matrix.sh](.github/scripts/generate-matrix.sh) will run in the context of a GitHub Action. So, testing this script requires setting some environment variables that would normally be set. For this script, the required GHA env vars are

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
