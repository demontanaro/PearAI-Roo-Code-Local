#!/usr/bin/env bash
set -euo pipefail

# Prepare an upgrade branch in an isolated worktree so local uncommitted work is safe.
#
# Usage:
#   scripts/prepare-upgrade-branch.sh <branch_name> [base_ref] [merge_ref]
#
# Example (sync against Roo main):
#   scripts/prepare-upgrade-branch.sh upgrade/roo-main-2026-07-11 upstream/main roo-official/main
#
# Example (sync from a Roo tag):
#   scripts/prepare-upgrade-branch.sh upgrade/roo-v3.54.0 upstream/main roo-official/v3.54.0

branch_name="${1:-}"
base_ref="${2:-upstream/main}"
merge_ref="${3:-roo-official/main}"

if [[ -z "$branch_name" ]]; then
  echo "Missing branch name."
  echo "Usage: scripts/prepare-upgrade-branch.sh <branch_name> [base_ref] [merge_ref]"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this script from inside a git repository."
  exit 1
fi

for remote_name in origin upstream roo-official; do
  if ! git remote | rg -qx "$remote_name"; then
    echo "Missing remote: $remote_name"
    exit 1
  fi
done

# Keep Roo remote tag fetching disabled to avoid clobber across remotes.
git config remote.roo-official.tagOpt --no-tags

git fetch origin --prune --tags
git fetch upstream --prune --no-tags
git fetch roo-official --prune --no-tags

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  echo "Base ref not found: $base_ref"
  exit 1
fi

if ! git rev-parse --verify "$merge_ref" >/dev/null 2>&1; then
  echo "Merge ref not found: $merge_ref"
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$branch_name"; then
  echo "Local branch already exists: $branch_name"
  exit 1
fi

safe_branch_dir="${branch_name//\//-}"
worktree_dir=".worktrees/$safe_branch_dir"

if [[ -e "$worktree_dir" ]]; then
  echo "Worktree path already exists: $worktree_dir"
  exit 1
fi

echo "Creating branch $branch_name from $base_ref in $worktree_dir"
git worktree add -b "$branch_name" "$worktree_dir" "$base_ref"

echo "Preparing merge (no commit): $merge_ref"
set +e
git -C "$worktree_dir" merge --no-ff --no-commit "$merge_ref"
merge_exit=$?
set -e

echo
echo "Preparation result"
if [[ $merge_exit -eq 0 ]]; then
  echo "- Merge staged successfully in worktree without commit."
else
  echo "- Merge produced conflicts in worktree (expected in many upgrades)."
fi

echo
echo "Next steps"
echo "- Review and resolve conflicts in: $worktree_dir"
echo "- Run validation checklist in worktree:"
echo "  1) nvm use 20.19.2"
echo "  2) corepack enable && corepack prepare pnpm@10.8.1 --activate"
echo "  3) pnpm --filter roo-cline check-types"
echo "  4) pnpm build"
echo "  5) pnpm test"
echo "  6) pnpm vsix"
echo "- Commit and push when ready:"
echo "  git -C $worktree_dir add -A"
echo "  git -C $worktree_dir commit -m 'chore: prepare $branch_name from $base_ref + $merge_ref'"
echo "  git -C $worktree_dir push -u origin $branch_name"

exit 0