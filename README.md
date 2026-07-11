# PearAI's Integration of Roo Code / Cline, a coding agent. Name attribution will always be kept in tact.

## Local Setup & Development

1. **Clone** the repo:
    ```bash
    git clone https://github.com/RooVetGit/Roo-Code.git
    ```
2. **Download esbuild problem matchers**
   Install https://market.trypear.ai/items?itemName=connor4312.esbuild-problem-matchers
3. **Install dependencies**:
    ```bash
    npm run install:all
    ```
4. **Build** the extension:

    ```bash
    npm run build
    ```

    - A `.vsix` file will appear in the `bin/` directory.

5. **Start the webview (Vite/React app with HMR)**:
    ```bash
    npm run dev
    ```
6. **Debug**:
    - Press `F5` (or **Run** → **Start Debugging**) in VSCode to open a new session with Roo Code loaded.

Changes to the webview will appear immediately. Changes to the core extension will require a restart of the extension host.

Alternatively you can build a .vsix and install it directly in VSCode:

```sh
npm run build
```

A `.vsix` file will appear in the `bin/` directory which can be installed with:

```sh
code --install-extension bin/roo-cline-<version>.vsix
```

We use [changesets](https://github.com/changesets/changesets) for versioning and publishing. Check our `CHANGELOG.md` for release notes.

**Install** the `.vsix` manually if desired:
`bash
    code --install-extension bin/roo-code-4.0.0.vsix
    `
|

## Local Mode Fork Notes

This fork is focused on one goal: run the agent without runtime dependency on PearAI hosted services, using a local OpenAI-compatible backend.

### Motivation

The upstream integration path expected PearAI-specific remote endpoints for model discovery, account login flows, and some provider wiring.

This fork replaces those runtime dependencies with a local-first path that works with any OpenAI-compatible server.

### Scope Of Changes

1. Central local backend configuration

- Added a single configuration source at src/shared/backendConfig.ts.
- Default backend is: http://localhost:8080/v1.

2. PearAI provider path refactored to local provider

- Added src/api/providers/local/LocalProvider.ts.
- PearAI handler now routes to a local OpenAI-compatible provider flow.
- Removed mandatory PearAI account/token dependency in runtime execution.

3. Model discovery migrated to OpenAI-compatible API

- Replaced proprietary model list calls with GET /models.
- Shared model mapping helpers were added in src/shared/pearaiApi.ts.

4. MCP defaults no longer fetched remotely

- Added src/services/mcp/localMcpConfig.ts for local static defaults/removals.
- McpHub no longer fetches default MCP settings from PearAI remote endpoints.

5. Remote auth flow removed from core runtime paths

- Login/account redirect flow was removed from the extension/webview runtime path.
- Local mode now informs users that remote login is not required.

6. Telemetry behavior changed

- Telemetry is disabled by default.
- Telemetry initialization is gated by a central flag.

7. CSP/connect-src now follows user settings

- Webview CSP allowlist uses the configured backend origin from extension settings.
- If a user changes Local OpenAI-compatible Base URL in settings, webview requests follow that value.

### Installation

Install the packaged extension from:

- bin/pearai-roo-cline-3.15.3.vsix

In VS Code / PearAI:

1. Open Command Palette.
2. Run Extensions: Install from VSIX...
3. Select the VSIX file above.
4. Reload the window if prompted.

### Runtime Requirements

Your backend must be OpenAI-compatible and expose at least:

- GET /models
- POST /chat/completions

### User Configuration

In extension settings (provider = pearai), set Local OpenAI-compatible Base URL to your backend, for example:

- http://localhost:8080/v1
- http://127.0.0.1:8080/v1
- http://192.168.x.x:8080/v1
- https://your-host.example/v1

### Validation Status

- Build and VSIX packaging pass in this fork.
- Since local backends vary, users should still verify compatibility with their specific server/model setup.

### Compatibility Notes

- If PearAI bundles an extension with the same extension ID, installing this VSIX updates/replaces it in the user profile.
- This fork is intended for local/self-hosted OpenAI-compatible deployments.

<!-- END CONTRIBUTORS SECTION -->

## License

[Apache 2.0 © 2025 Roo Veterinary, Inc.](./LICENSE)
