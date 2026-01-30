# Tests

The tests in this folder are intended for the behavior of GitHub Actions.

## Other Files In This Folder

There are other `.json` files in this directory that contain snippets of the GitHub Actions context for the various triggers (`pull_request`, `push`, `release`). These are here as reference for testing the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script and reviewing the GitHub Actions workflow files.

## generate-matrix.sh tests

Because this is a "monorepo", we need to do a bit of extra work to determine which application in this repo is actually getting updated in a pull request / merge / release flow. The [generate-matrix.sh](.github/scripts/generate-matrix.sh) script does this work when it is called by the GitHub Actions workflow.

To test the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script, we need to mimic enough of the GitHub Actions environment and context to ensure that everything is working properly.

A useful command to provide the list of commits with full SHAs in "oneline" mode (with short commit SHAs):

```bash
git log --pretty=oneline --abbrev-commit
```

It's important to note that for local testing of the `dev` and `stage` invocations of the [generate-matrix.sh](../.github/scripts/generate-matrix.sh) script, the assumption is that the developer is not in the `main` branch locally.

### Test Pull Request workflow (dev-deploy.yml)

The [dev-deploy.yml](.github/workflows/dev-deploy.yml) workflow uses the `pull_request` trigger. The reference file for the GitHub Actions context for this trigger is either [pr_open.json](./pr_open.json) for a new PR or [pr_update.json](./pr_update.json) for an additional commit on an open PR.

#### New Pull Request on New Branch

```bash
DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="opened" \
  ./.github/scripts/generate-matrix.sh
```

Here is a oneliner that automatically picks the correct SHAs to match how the workflow will run in GitHub Actions:

```bash
DEFAULT_BRANCH=main BASE_SHA=$(git rev-parse --short main) HEAD_SHA=$(git rev-parse --short HEAD) ACTION="opened" ./.github/scripts/generate-matrix.sh
```

#### Additional Commit on Open PR (dev-deploy.yml)

Once a PR is open, additional commits on the PR will also trigger the [dev-deploy.yml](.github/workflows/dev-deploy.yml) workflow. The reference file for the GitHub Actions context for this trigger is [pr_update.json](./pr_update.json) for an additional commit on an existing PR.

```bash
DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="synchronize" \
  ./.github/scripts/generate-matrix.sh
```

Here is a oneliner that automatically picks the correct SHAs to match how the workflow will run in GitHub Actions:

```bash
DEFAULT_BRANCH=main BASE_SHA=$(git rev-parse --short main) HEAD_SHA=$(git rev-parse --short HEAD) ACTION="synchronize" ./.github/scripts/generate-matrix.sh
```

### Test Merge PR to Main (stage-deploy.yml)

The [stage-deploy.yml](.github/workflows/stage-deploy.yml) workflow is triggered when an approved PR is merged to the `main` branch. The reference file for the GitHub Actions context for this trigger is [merge.json](./merge.json).

```bash
DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="push" \
  ./.github/scripts/generate-matrix.sh
```

Here is a oneliner that automatically picks the correct SHAs to match how the workflow will run in GitHub Actions:

```bash
DEFAULT_BRANCH=main BASE_SHA=$(git rev-parse --short main) HEAD_SHA=$(git rev-parse --short HEAD) ACTION="synchronize" ./.github/scripts/generate-matrix.sh
```

The big difference here is that while the SHA values are the same as the tests above, here the SHA values are coming from a different part of the GitHub Actions context.

### Test tagged release workflow (prod-deploy.yml)

There is a `bash` script, [test_release_workflow.sh](./test_release_workflow.sh) that can be used to test this workflow. From the root of the repository, just run `./tests/test_release_workflow.sh` to see what will happen. If you want to do this test manually or change some of the parameters, keep reading.

The [prod-deploy.yml](.github/workflows/prod-deploy.yml) workflow is triggered when an approved PR is merged to the `main` branch. The reference file for the GitHub Actions context for this trigger is [release.json](tests/release.json). Testing this is a little tricky! When this runs in GitHub Actions, the `actions/checkout` is defaulted to the `main` branch. If you are not in the `main` branch locally, the script will not run correctly.

Before running the command below for local testing, it's expected that a separate working directory for the `main` branch is created and set in the environment, like this:

```bash
export WORK_DIR=/tmp/gha-main && \
git fetch origin main --depth=10 --tags && \
git worktree remove "$WORK_DIR" --force || true && \
git worktree add "$WORK_DIR" main
```

Then, run the test:

```bash
DEFAULT_BRANCH=main \
  HEAD_SHA=<github_sha> \
  ACTION="published" \
  LOCAL_TEST=true \
  ./.github/scripts/generate-matrix.sh
```

Finally, clean up the WORK_DIR

```bash
git worktree remove "$WORK_DIR" --force && \
unset WORK_DIR
```
