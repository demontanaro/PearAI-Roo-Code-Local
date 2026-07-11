# Upstream Update Playbook (PearAI Fork)

## Goal

Keep the fork aligned with upstream Roo Code while preserving the protected local LLM subsystem and minimizing technical debt.

## Merge Strategy

1. Create a dedicated upgrade branch from fork main:
    - `git checkout -b upgrade/roo-vX.Y.Z`
2. Add/update upstream remote and fetch tags:
    - `git remote add upstream https://github.com/RooCodeInc/Roo-Code.git` (once)
    - `git fetch upstream --tags`
3. Merge upstream tag into the upgrade branch:
    - `git merge --no-ff upstream/vX.Y.Z`
4. Conflict policy:
    - Default: upstream-first.
    - Exception: preserve protected local subsystem behavior (local OpenAI-compatible flow, PearAI-specific model discovery/UX hooks).
    - If a protected file has major API drift, rebase to upstream first, then re-apply local logic as a minimal patch.

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
