# Tests

The tests in this folder are intended for the behavior of GitHub Actions.

## Other Files In This Folder

There are other `.json` files in this directory that contain snippets of the GitHub Actions context for the various triggers (`pull_request`, `push`, `release`). These are here as reference for testing the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script and reviewing the GitHub Actions workflow files.

## generate-matrix.sh tests

Because this is a "monorepo", we need to do a bit of extra work to determine which application in this repo is actually getting updated in a pull request / merge / release flow. The [generate-matrix.sh](.github/scripts/generate-matrix.sh) script does this work when it is called by the GitHub Actions workflow.

To test the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script, we need to mimic enough of the GitHub Actions environment and context to ensure that everything is working properly.

A useful command to provide the list of commits with full SHAs in "oneline" mode:

```bash
git log --pretty=oneline --no-abbrev-commit
```

### Test New Pull Request workflow (dev-deploy.yml)

The [dev-deploy.yml](.github/workflows/dev-deploy.yml) workflow uses the `pull_request` trigger. The reference file for the GitHub Actions context for this trigger is either [pr_open.json](tests/pr_open.json) for a new PR.


```bash
GITHUB_SHA=<github_sha> \
  DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="opened" \
  ./.github/scripts/generate-matrix.sh
```

### Test Additional Commit on Open PR (dev-deploy.yml)

Once a PR is open, additional commits on the PR will also trigger the [dev-deploy.yml](.github/workflows/dev-deploy.yml) workflow. The reference file for the GitHub Actions context for this trigger is [pr_update.json](tests/pr_update.json) for an additional commit on an existing PR.

```bash
GITHUB_SHA=<github_sha> \
  DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="synchronize" \
  ./.github/scripts/generate-matrix.sh
```

### Test Merge PR to Main (stage-deploy.yml)

The [stage-deploy.yml](.github/workflows/stage-deploy.yml) workflow is triggered when an approved PR is merged to the `main` branch. The reference file for the GitHub Actions context for this trigger is [merge.json](tests/merge.json).

```bash
GITHUB_SHA=<github_sha> \
  DEFAULT_BRANCH=main \
  BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  ACTION="push" \
  ./.github/scripts/generate-matrix.sh
```

### Test tagged release workflow (prod-deploy.yml)

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
GITHUB_SHA=<github_sha> \
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
