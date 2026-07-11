# Upstream Update Playbook (PearAI Fork)

## Goal

Keep the fork aligned with upstream Roo Code while preserving the protected local LLM subsystem and minimizing technical debt.

## Does This Keep The Fork Updated?

Yes, with one caveat: this keeps the fork operationally aligned with Roo when run on a recurring cadence.

- `roo-official/main` is the source of Roo changes.
- `upstream/main` is the fork base where integration starts.
- `origin/*` is your publish target.

This is not an automatic mirror. It is a controlled integration flow to avoid regressions in protected PearAI-local behavior.

## Remote Map

- `roo-official` points to the official Roo Code repository and is read-only for source comparison.
- `upstream` points to the PearAI fork source (`trypear/PearAI-Roo-Code`) and is the main fork used for comparison.
- `origin` points to the publish target in `demontanaro/PearAI-Roo-Code-Local` and is the only remote used for branch/release publication.

## Tag Conflict Policy

- Canonical tags in this workspace are fetched from `origin`.
- Keep `roo-official` fetched with `--no-tags` (or `git config remote.roo-official.tagOpt --no-tags`) to avoid tag clobber conflicts.
- If the same tag name points to different commits across remotes, preserve both pointers locally:
    - Backup current local tag before replacement, for example `v3.54.0-localbackup-YYYYMMDD-HHMMSS`.
    - Store Roo official pointer under a namespaced local tag, for example `roo-official/v3.54.0`.
- Never force-push or rewrite remote tags in `origin`, `upstream`, or `roo-official`.

## Sync Flow (roo-official -> upstream -> origin)

1. Fetch remotes with safe tag policy:
    - `git config remote.roo-official.tagOpt --no-tags`
    - `git fetch origin --prune --tags`
    - `git fetch upstream --prune --no-tags`
    - `git fetch roo-official --prune --no-tags`
2. Create upgrade branch from fork base:
    - `git checkout -B upgrade/roo-vX.Y.Z upstream/main`
3. Merge official Roo source:
    - `git merge --no-ff roo-official/vX.Y.Z`
4. Resolve conflicts using protected subsystem policy (Local LLM paths are preserved).
5. Run required validation checklist.
6. Publish to `origin`:
    - `git push -u origin upgrade/roo-vX.Y.Z`
7. Open PR from `origin/upgrade/roo-vX.Y.Z` into the target fork branch.

Helper script:

- `scripts/sync-remotes.sh main upgrade/roo-vX.Y.Z vX.Y.Z`
- `scripts/prepare-upgrade-branch.sh upgrade/roo-main-YYYY-MM-DD upstream/main roo-official/main`

## Suggested Cadence

1. Weekly or bi-weekly: run `scripts/sync-remotes.sh` to inspect divergence.
2. If Roo moved: prepare a fresh integration branch with `scripts/prepare-upgrade-branch.sh`.
3. Resolve conflicts, run validations, push branch, and open PR.
4. Record preserved local deltas in `checkpoints/` for auditability.

## Merge Strategy

1. Create a dedicated upgrade branch from fork main:
    - `git checkout -b upgrade/roo-vX.Y.Z`
2. Add/update the official Roo remote and fetch tags:
    - `git remote add roo-official https://github.com/RooCodeInc/Roo-Code.git` (once)
    - `git fetch roo-official --tags`
3. Merge the official Roo tag into the upgrade branch:
    - `git merge --no-ff roo-official/vX.Y.Z`
4. Conflict policy:
    - Default: official upstream-first.
    - Exception: preserve protected local subsystem behavior (local OpenAI-compatible flow, PearAI-specific model discovery/UX hooks).
    - If a protected file has major API drift, rebase to the official Roo implementation first, then re-apply local logic as a minimal patch.

## Required Validation Checklist

Run all checks with Node `20.19.2`.

1. Environment
    - `nvm use 20.19.2`
    - `corepack enable && corepack prepare pnpm@10.8.1 --activate`
2. Types
    - `pnpm --filter roo-cline check-types`
3. Build
    - `pnpm build`
4. Tests
    - `pnpm test`
5. Packaging
    - `pnpm vsix`
6. Safety scan on changed files
    - Verify no user-specific paths, keys, or hardcoded local secrets.

## Pre-Release Rules

- Do not bypass hooks (`--no-verify`) unless there is an explicit blocker and it is documented.
- Release notes must be in English and written from a markdown file (`--notes-file`) to avoid escaped newline issues.
- Include validation summary and known limitations.

## Technical Debt Guardrails

- Keep PearAI-only option fields behind narrow local extension types (avoid broad `any` spread).
- Prefer wrappers/adapters over copying old provider implementations.
- Remove dead/legacy imports and paths during each upgrade pass.
- Keep a short "delta log" in `checkpoints/` describing what was preserved locally and why.
- Publish only to the demontanaro remote; never create branches, tags, or releases on the official Roo repository.
