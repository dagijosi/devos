#!/usr/bin/env bash
set -euo pipefail

# DevOS Release Script
# Usage: ./scripts/release.sh [patch|minor|major]

VERSION_TYPE="${1:-patch}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> DevOS Release ($VERSION_TYPE)"

# 1. Run full checks
echo "==> Running linter..."
npm run lint

echo "==> Running TypeScript check..."
npx tsc --noEmit

echo "==> Running production build..."
npm run build

# 2. Bump version
echo "==> Bumping version ($VERSION_TYPE)..."
NEW_VERSION=$(npm version "$VERSION_TYPE" --no-git-tag-version)
echo "New version: $NEW_VERSION"

# Sync Tauri version
TAURI_VERSION="${NEW_VERSION#v}"
jq --arg v "$TAURI_VERSION" '.version = $v' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp
mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json

# 3. Build Tauri app
echo "==> Building Tauri app..."
npx tauri build

echo "==> Release $NEW_VERSION ready!"
echo "Artifacts in src-tauri/target/release/"
echo "Next steps:"
echo "  1. Create git tag: git tag $NEW_VERSION"
echo "  2. Push: git push && git push --tags"
echo "  3. Create GitHub release with artifacts"
