#!/usr/bin/env bash
set -euo pipefail

# Sync helper for PearAI fork remotes.
# Usage:
#   scripts/sync-remotes.sh [default_branch] [upgrade_branch] [roo_tag]
# Example:
#   scripts/sync-remotes.sh main upgrade/roo-v3.54.0 v3.54.0

default_branch="${1:-main}"
upgrade_branch="${2:-upgrade/roo-v3.54.0}"
roo_tag="${3:-}"

require_remote() {
  local remote_name="$1"
  if ! git remote | rg -qx "$remote_name"; then
    echo "Missing remote: $remote_name"
    exit 1
  fi
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this script from inside a git repository."
  exit 1
fi

require_remote "origin"
require_remote "upstream"
require_remote "roo-official"

current_branch="$(git branch --show-current)"
echo "Current branch: $current_branch"
echo "Default branch for comparisons: $default_branch"
echo "Upgrade branch for comparisons: $upgrade_branch"

# Avoid tag clobber issues between remotes with diverging tag targets.
git config remote.roo-official.tagOpt --no-tags

# Canonical tag source is origin for this local workspace.
git fetch origin --prune --tags

# Upstream and Roo official are fetched without tags to avoid conflicts.
git fetch upstream --prune --no-tags
git fetch roo-official --prune --no-tags

echo
echo "Remote HEAD branches"
git ls-remote --symref origin HEAD | head -n 1
git ls-remote --symref upstream HEAD | head -n 1
git ls-remote --symref roo-official HEAD | head -n 1

echo
echo "Divergence counts (left-right)"
echo "origin/$default_branch ... upstream/$default_branch"
git rev-list --left-right --count "origin/$default_branch...upstream/$default_branch"
echo "upstream/$default_branch ... roo-official/$default_branch"
git rev-list --left-right --count "upstream/$default_branch...roo-official/$default_branch"

if git show-ref --verify --quiet "refs/remotes/origin/$upgrade_branch"; then
  echo "origin/$upgrade_branch ... roo-official/$default_branch"
  git rev-list --left-right --count "origin/$upgrade_branch...roo-official/$default_branch"
fi

if [[ -n "$roo_tag" ]]; then
  echo
  echo "Tag status for $roo_tag"
  local_tag="$(git show-ref --tags | rg "refs/tags/$roo_tag$" || true)"
  origin_tag="$(git ls-remote --tags origin "refs/tags/$roo_tag" || true)"
  roo_tag_ref="$(git ls-remote --tags roo-official "refs/tags/$roo_tag" || true)"
  if [[ -n "$local_tag" ]]; then
    echo "local   $local_tag"
  else
    echo "local   missing"
  fi
  if [[ -n "$origin_tag" ]]; then
    echo "origin  $origin_tag"
  else
    echo "origin  missing"
  fi
  if [[ -n "$roo_tag_ref" ]]; then
    echo "roo     $roo_tag_ref"
  else
    echo "roo     missing"
  fi
fi

echo
echo "Recommended merge flow"
echo "1) git checkout -B upgrade/roo-<version> upstream/$default_branch"
echo "2) git merge --no-ff roo-official/<tag-or-branch>"
echo "3) resolve conflicts preserving protected local LLM subsystem"
echo "4) run validation (types, build, tests, vsix)"
echo "5) git push -u origin upgrade/roo-<version>"

echo
echo "GitHub branch URLs"
origin_url="$(git remote get-url origin | sed 's/\.git$//')"
upstream_url="$(git remote get-url upstream | sed 's/\.git$//')"
roo_url="$(git remote get-url roo-official | sed 's/\.git$//')"
echo "$origin_url/tree/$upgrade_branch"
echo "$upstream_url/tree/$default_branch"
echo "$roo_url/tree/$default_branch"
