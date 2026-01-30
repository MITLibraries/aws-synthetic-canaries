#!/usr/bin/env bash
set -euo pipefail

## This script will simulate the published release workflow environment thw
## same way that actions/checkout works.

echo "=== Testing Release Workflow (Simulating actions/checkout) ==="

ORIG_DIR=$(pwd)
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Simulate the actions/checkout behavior, setting the origin to the local
# copy of the repository
git init
git remote add origin "$ORIG_DIR"

# The two following lines need to match the actions/checkout options in the 
# generate-matrix job in prod-deploy.yml
git fetch --depth=10 origin main
git fetch --tags origin

git checkout FETCH_HEAD

# IMPORTANT: Copy the script from your feature branch to test YOUR changes
echo "Copying modified script from feature branch..."
mkdir -p .github/scripts
cp "$ORIG_DIR/.github/scripts/generate-matrix.sh" .github/scripts/generate-matrix.sh
chmod +x .github/scripts/generate-matrix.sh

# Set the rest of the environment variables that we need (this is a small subset
# of the actual environment variables in GHA)
export DEFAULT_BRANCH="main"
export HEAD_SHA=$(git rev-parse HEAD)
export ACTION="published"

# The same commands from the id: prev-release step in the generate-matrix job
echo "=== Testing the ability to set the PREV_TAG ==="
PREV_TAG=$(git tag --sort=-version:refname | sed -n '2p')
if [ -z "$PREV_TAG" ]; then
    echo "=== Testing: this is the first release ==="
    export FIRST_RELEASE="true"
    export BASE_SHA=""
else
    echo "=== Testing: not the first release ==="
    echo "Previous tag: $PREV_TAG"
    export BASE_SHA=$(git rev-list -n 1 "$PREV_TAG")
    export FIRST_RELEASE="false"
fi

echo "HEAD_SHA: $HEAD_SHA"
echo "BASE_SHA: $BASE_SHA"
echo ""

bash ./.github/scripts/generate-matrix.sh

# Cleanup
echo "Cleaning up"
cd "$ORIG_DIR"
rm -rf "$TEST_DIR"

echo "=== Testing Complete ==="
