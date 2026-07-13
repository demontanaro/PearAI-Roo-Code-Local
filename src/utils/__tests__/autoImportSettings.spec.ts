vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(),
	},
	window: {
		showInformationMessage: vi.fn(),
		showWarningMessage: vi.fn(),
	},
}))

import { autoImportSettings } from "../autoImportSettings"
import * as vscode from "vscode"

describe("autoImportSettings", () => {
	let mockOutputChannel: any
	let mockExtensionContext: any
	let mockProviderSettingsManager: any
	let mockContextProxy: any
	let mockCustomModesManager: any

	beforeEach(() => {
		vi.clearAllMocks()

		mockOutputChannel = {
			appendLine: vi.fn(),
		}

		mockExtensionContext = {
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		}

		mockProviderSettingsManager = {}
		mockContextProxy = {}
		mockCustomModesManager = {}

		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn().mockReturnValue(""),
		} as any)
	})

	it("does nothing when no path is configured", async () => {
		await autoImportSettings(mockOutputChannel, mockExtensionContext, {
			providerSettingsManager: mockProviderSettingsManager,
			contextProxy: mockContextProxy,
			customModesManager: mockCustomModesManager,
		})

		expect(mockOutputChannel.appendLine).not.toHaveBeenCalled()
		expect(mockExtensionContext.globalState.update).not.toHaveBeenCalled()
	})

	it("ignores a configured path without importing settings", async () => {
		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn().mockReturnValue("~/Documents/roo-code-settings.json"),
		} as any)

		await autoImportSettings(mockOutputChannel, mockExtensionContext, {
			providerSettingsManager: mockProviderSettingsManager,
			contextProxy: mockContextProxy,
			customModesManager: mockCustomModesManager,
		})

		expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
			"[AutoImport] Startup auto-import is disabled; ignoring configured path",
		)
		expect(mockExtensionContext.globalState.update).not.toHaveBeenCalled()
	})
})
