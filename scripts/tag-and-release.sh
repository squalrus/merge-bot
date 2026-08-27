#!/usr/bin/env bash
# Tags the current HEAD as vX.Y.Z (from package.json) and publishes a GitHub
# release with a short bullet-point summary distilled from the matching
# CHANGELOG.md section, unless that tag already exists. Safe to run
# unconditionally — a no-op when nothing new shipped.
set -euo pipefail

VERSION="$(node -p "require('./package.json').version")"
TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Tag $TAG already exists, nothing to release."
    exit 0
fi

CHANGELOG_SECTION="$(awk -v heading="## [$VERSION]" '
    index($0, heading) == 1 { found=1; next }
    found && index($0, "## [") == 1 { exit }
    found { print }
' CHANGELOG.md)"

if [ -z "$CHANGELOG_SECTION" ]; then
    echo "::error::No CHANGELOG.md section found for $VERSION (expected a '## [$VERSION]' heading). Add one before merging a version bump."
    exit 1
fi

# Release notes are a short bullet list for scanning, not the full CHANGELOG
# entry: pull just the bold lead sentence off each "- **Lead.** Detail..."
# bullet. The full explanation stays in CHANGELOG.md for anyone who wants it.
NOTES="$(echo "$CHANGELOG_SECTION" | sed -n -E 's/^- \*\*([^*]*)\*\*.*/- \1/p')"

if [ -z "$NOTES" ]; then
    echo "::error::CHANGELOG.md's $VERSION section has no '- **Lead.** ...' bullets to extract release notes from."
    exit 1
fi

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git tag -a "$TAG" -m "$TAG"
git push origin "$TAG"

echo "$NOTES" > release-notes.md
gh release create "$TAG" --title "$TAG" --notes-file release-notes.md
