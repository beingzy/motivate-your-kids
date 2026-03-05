#!/bin/bash
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 0.2.0
#
# What this does:
#   1. Verify you're on develop with a clean tree
#   2. Bump package.json version
#   3. Commit the bump on develop
#   4. Push develop  →  GitHub Action deploys to staging
#   5. Merge develop → main (no-ff, preserves history)
#   6. Tag the merge commit
#   7. Push main + tag  →  GitHub Action deploys production + creates version alias
#   8. Return to develop

set -e

VERSION="$1"

# ── Validate input ────────────────────────────────────────────────────────────
if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.2.0"
  exit 1
fi

# Strip leading 'v' if supplied
VERSION="${VERSION#v}"
TAG="v$VERSION"

# ── Guard: must be on develop ─────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "develop" ]; then
  echo "Error: must be on the 'develop' branch (currently on '$BRANCH')"
  exit 1
fi

# ── Guard: clean working tree ─────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# ── Guard: tag must not already exist ────────────────────────────────────────
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag '$TAG' already exists."
  exit 1
fi

echo "──────────────────────────────────────────"
echo "  Releasing $TAG"
echo "──────────────────────────────────────────"

# ── 1. Bump version in package.json ──────────────────────────────────────────
echo "→ Bumping package.json to $VERSION"
npm version "$VERSION" --no-git-tag-version
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "chore: release $TAG"

# ── 2. Push develop → triggers staging deploy ────────────────────────────────
echo "→ Pushing develop (staging deploy will start)"
git push origin develop

# ── 3. Merge develop → main ──────────────────────────────────────────────────
echo "→ Merging develop → main"
git checkout main
git merge develop --no-ff -m "chore: release $TAG"

# ── 4. Tag ───────────────────────────────────────────────────────────────────
echo "→ Tagging $TAG"
git tag "$TAG"

# ── 5. Push main + tag → triggers production deploy + version alias ───────────
echo "→ Pushing main + tag (production deploy will start)"
git push origin main
git push origin "$TAG"

# ── 6. Return to develop ─────────────────────────────────────────────────────
git checkout develop

echo ""
echo "✓ Release $TAG complete."
echo ""
echo "  Production : https://motivateyourkids.vercel.app"
echo "  Staging    : https://motivateyourkids-staging.vercel.app"
echo "  Archive    : https://motivateyourkids-${TAG//./-}.vercel.app  (aliasing in ~1 min)"
echo ""
echo "  Watch the GitHub Action for progress:"
echo "  https://github.com/beingzy/motivate-your-kids/actions"
