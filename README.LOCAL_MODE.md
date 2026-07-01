# PearAI Roo Code Local Mode

This fork removes runtime dependency on PearAI remote services and runs with a local OpenAI-compatible backend.

## What Changed

- Added central local backend config in src/shared/backendConfig.ts.
- Reworked PearAI provider path to use a local OpenAI-compatible provider wrapper.
- Replaced proprietary model discovery calls with GET /v1/models.
- Replaced PearAI remote MCP defaults/removals fetches with local static MCP config.
- Disabled remote account auth flow in extension/webview paths.
- Telemetry is disabled by default and gated by a central flag.
- CSP/connect-src updated to allow local backend origin.

## Default Backend

Default base URL is:

- http://localhost:8080/v1

This is intentionally portable for public users. It is not tied to a personal LAN IP.

## How To Use Your Own Backend

In the extension settings (provider = pearai):

- Set Local OpenAI-compatible Base URL to your backend, for example:
  - http://127.0.0.1:8080/v1
  - http://192.168.x.x:8080/v1
  - https://your-host.example/v1

The extension expects:

- GET /models
- POST /chat/completions

## Build Artifact

VSIX output:

- bin/pearai-roo-cline-3.15.3.vsix

## Notes For Publishing

- This repo can be public safely; no personal host is hardcoded now.
- Users must configure their own backend URL if not using localhost:8080.
- If PearAI already bundles the same extension ID, installing this VSIX updates/replaces it for the user profile.
