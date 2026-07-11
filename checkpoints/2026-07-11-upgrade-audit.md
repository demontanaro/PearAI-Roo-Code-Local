# Upgrade Audit - 2026-07-11

## Objective
Upgrade from Roo Code v3.15.3 to latest official Roo Code stable release (v3.54.0) while preserving Local LLM fork behavior.

## Protected Subsystem (Do Not Replace)
The following files currently implement local OpenAI-compatible behavior and are treated as protected merge zones:

- src/api/providers/local/LocalProvider.ts
- src/api/providers/pearai/pearai.ts
- src/api/providers/pearai/pearaiGeneric.ts
- src/shared/backendConfig.ts
- src/shared/pearaiApi.ts
- src/core/webview/ClineProvider.ts
- src/core/webview/webviewMessageHandler.ts
- src/extension.ts
- src/services/mcp/McpHub.ts
- src/services/mcp/localMcpConfig.ts
- src/services/telemetry/PostHogClient.ts
- src/services/telemetry/TelemetryService.ts
- webview-ui/src/components/settings/ApiOptions.tsx
- webview-ui/src/context/ExtensionStateContext.tsx
- webview-ui/src/hooks/usePearAIModels.ts

## Architectural Inconsistencies To Resolve During Merge
1. Provider contract drift risk
- Upstream provider interfaces and model metadata contracts may have changed between v3.15.3 and v3.54.0.
- Local provider wrappers may require adaptation without changing behavior.

2. Tool subsystem API drift risk
- Tool parser/validator/executor signatures likely changed upstream.
- Custom webview/provider pathways may depend on old tool payload shapes.

3. Context and message serialization drift risk
- Upstream may introduce new content block schema or tool-call envelopes.
- Local backend OpenAI-compatible payload translation must remain intact.

4. MCP integration drift risk
- McpHub lifecycle and config schema may have changed.
- Local MCP defaults (including Brave Search and Filesystem flows) must be re-validated.

5. Settings/UI model selection drift risk
- UI state hooks for PearAI/local model discovery may conflict with upstream settings refactors.

6. Telemetry/auth workflow drift risk
- Local mode intentionally bypasses remote auth and key exchange behavior in specific paths.
- Upstream auth/telemetry updates must be merged without reintroducing cloud-only assumptions.

## Merge Policy
- Prefer upstream implementation for generic Roo subsystems.
- Keep local OpenAI-compatible code paths authoritative for PearAI/local mode.
- Resolve conflicts manually in protected files.
- Preserve offline workflow and custom base URL/auth behavior.
