import { ApiHandlerOptions, ModelInfo } from "../../../shared/api"
import Anthropic from "@anthropic-ai/sdk"
import { BaseProvider } from "../base-provider"
import { SingleCompletionHandler } from "../.."
import { LocalProvider } from "../local/LocalProvider"
import { PEARAI_URL, pearaiDefaultModelId, pearaiDefaultModelInfo, PearAIAgentModelsConfig } from "../../../shared/pearaiApi"
import { LOCAL_API_KEY_FALLBACK } from "../../../shared/backendConfig"

export class PearAIHandler extends BaseProvider implements SingleCompletionHandler {
	private handler: LocalProvider
	private options: ApiHandlerOptions

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options

		const modelId =
			options.apiModelId ||
			options.pearaiModelId ||
			options.pearaiAgentModels?.defaultModelId ||
			pearaiDefaultModelId

		const modelInfo =
			options.pearaiAgentModels?.models[modelId] || options.pearaiModelInfo || pearaiDefaultModelInfo

		this.handler = new LocalProvider({
			...options,
			openAiBaseUrl: options.pearaiBaseUrl || PEARAI_URL,
			openAiApiKey: options.openAiApiKey || options.pearaiApiKey || LOCAL_API_KEY_FALLBACK,
			openAiModelId: modelId,
			openAiCustomModelInfo: modelInfo,
		})
	}

	public getModel(): { id: string; info: ModelInfo } {
		// Fallback to using what's available on client side
		const baseModel = this.handler.getModel()
		return baseModel
	}

	async *createMessage(systemPrompt: string, messages: any[]): AsyncGenerator<any> {
		yield* this.handler.createMessage(systemPrompt, messages)
	}

	async completePrompt(prompt: string): Promise<string> {
		return this.handler.completePrompt(prompt)
	}
}
