# Checkpoint - 2026-06-30 - Local Mode Fork

## Scope

Convert the fork to run without PearAI runtime server dependency, using a local OpenAI-compatible backend path.

## Main Functional Outcome

- Extension compiles and packages.
- VSIX build available and installable.
- Runtime path uses local OpenAI-compatible endpoints.
- Webview CSP backend origin now follows user settings (pearaiBaseUrl), not a fixed host.

## Core Files Changed

### Backend and provider routing

- src/shared/backendConfig.ts
  - Added central local-mode flags and defaults.
  - Default base URL: http://localhost:8080/v1
  - Added LOCAL_API_ORIGIN and telemetry/integration flags.

- src/shared/pearaiApi.ts
  - PEARAI_URL now derived from LOCAL_API_BASE.
  - Added OpenAI-compatible model discovery and mapping helpers.
  - Added buildPearAIAgentModelsConfig and fetchOpenAICompatibleModelIds.

- src/api/providers/local/LocalProvider.ts
  - New local OpenAI-compatible provider wrapper.

- src/api/providers/pearai/pearai.ts
  - Refactored PearAI handler to route through LocalProvider.
  - Removed remote auth/token gate logic from runtime path.

- src/api/providers/pearai/pearaiGeneric.ts
  - Removed remote-branding header dependencies.

### Webview and settings behavior

- src/core/webview/ClineProvider.ts
  - Replaced proprietary model fetch path with OpenAI-compatible model discovery.
  - Updated CSP connect-src handling for local mode.
  - Added getConfiguredLocalApiOrigin() to derive allowed origin from pearaiBaseUrl setting.
  - Local backend origin now updates with user settings.

- webview-ui/src/components/settings/ApiOptions.tsx
  - PearAI section now exposes Local OpenAI-compatible Base URL.

- webview-ui/src/hooks/usePearAIModels.ts
  - Model list now uses GET /models via shared helper.

- webview-ui/src/context/ExtensionStateContext.tsx
  - Updated defaults for local-mode behavior and telemetry default.

### MCP and auth-related runtime changes

- src/services/mcp/localMcpConfig.ts
  - New local static MCP defaults/removals source.

- src/services/mcp/McpHub.ts
  - Removed remote fetch default/remove flows.
  - MCP add/remove logic now uses local config.
  - PearAI key update/clear routines no-op in local mode.

- src/core/webview/webviewMessageHandler.ts
  - openPearAIAuth action now informs local mode instead of remote redirect.

- src/extension.ts
  - Pear extension integration made optional/lazy behind flag.
  - Remote auth command paths removed/no-op for local mode.

### Telemetry

- src/services/telemetry/TelemetryService.ts
  - Initialization gated by central ENABLE_TELEMETRY flag.

- src/services/telemetry/PostHogClient.ts
  - Removed Pear extension user-id coupling.
  - Telemetry behavior aligned to local-mode flags and opt-in.

### Tests and docs

- src/core/webview/__tests__/ClineProvider.test.ts
  - CSP expectation updated to local default origin.

- README.md
  - Added consolidated Local Mode technical documentation.
  - Removed process-internal wording.

## Build and Validation

Commands run during this workstream (successful at final state):

- npm run compile
- npm run vsix
- rg searches for legacy remote endpoint patterns

Checks performed:

- Compile passed after final patches.
- VSIX packaging passed.
- Target legacy patterns returned no runtime-path matches in source for required terms.

## Build Artifact

- bin/pearai-roo-cline-3.15.3.vsix

## Git Traceability

Recent commits for this work:

- 994a7d3b feat: local-only mode with settings-driven backend origin
- c0190ede docs: expand local-mode fork README in English
- e248a298 docs: move local mode notes into main README
- bd33984f docs: remove internal hardcoding references from README

## Operational Notes

- If backend URL is changed by user in extension settings, runtime webview connections follow that configured origin.
- For non-localhost deployments, users must set Local OpenAI-compatible Base URL explicitly.
- Expected backend API compatibility:
  - GET /models
  - POST /chat/completions
