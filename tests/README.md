# Tests

The tests in this folder are intended for the behavior of GitHub Actions.

## generate-matrix.sh tests

To test the [generate-matrix.sh](.github/scripts/generate-matrix.sh) script, we need to mimic enough of the GitHub Actions environment and context to ensure that everything is working properly.

Some useful starter bash/zsh commands:

Provide the list of commits with full SHAs in "oneline" mode:

```bash
git log --pretty=oneline --no-abbrev-commit
```

From that output, you can copy/paste SHAs into the following command to mimic a run of the script in GitHub Actions

```bash
BASE_SHA=<base_sha> \
  HEAD_SHA=<head_sha> \
  DEFAULT_BRANCH=main \
  GITHUB_SHA=<github_sha> \
  ./.github/scripts/generate-matrix.sh
```

It's important to note that the `GITHUB_SHA` value **always** exists in GitHub Actions, but the script itself does not use the value; it just uses the fact that it exists.

### Test tagged release workflow

```bash
GITHUB_SHA=<github_sha> \
  DEFAULT_BRANCH=main \
  HEAD_SHA=<head_sha> \
  ACTION="published" \
  ./.github/scripts/generate-matrix.sh
```