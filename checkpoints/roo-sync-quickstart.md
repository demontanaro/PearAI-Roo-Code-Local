# Roo Sync Quickstart

## Objective

Maintain the fork in a controlled way with Roo changes while preserving protected local subsystems.

## One-time setup

1. Ensure remotes exist:
    - `origin` -> publish target
    - `upstream` -> `trypear/PearAI-Roo-Code`
    - `roo-official` -> `RooCodeInc/Roo-Code`
2. Use the safe tag policy for Roo remote:
    - `git config remote.roo-official.tagOpt --no-tags`

## Recurring workflow

1. Inspect state and divergence:
    - `scripts/sync-remotes.sh main upgrade/roo-vX.Y.Z vX.Y.Z`
2. Prepare a new upgrade branch in an isolated worktree:
    - `scripts/prepare-upgrade-branch.sh upgrade/roo-main-YYYY-MM-DD upstream/main roo-official/main`
3. Resolve merge conflicts in the generated worktree.
4. Validate with Node 20.19.2:
    - `pnpm --filter roo-cline check-types`
    - `pnpm build`
    - `pnpm test`
    - `pnpm vsix`
5. Commit and push the prepared branch from the worktree:
    - `git -C .worktrees/<branch-dir> push -u origin <branch-name>`
6. Open PR from origin branch to the target branch.

## Why this works

- It follows Roo updates from `roo-official/main`.
- It integrates changes from a stable base (`upstream/main`).
- It avoids accidental breakage from direct mirroring.
- It protects custom local LLM behavior through explicit conflict resolution policy.
