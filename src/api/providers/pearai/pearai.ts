import type { ModelInfo } from "@roo-code/types"
import type { ApiHandlerOptions } from "../../../shared/api"
import type Anthropic from "@anthropic-ai/sdk"
import { BaseProvider } from "../base-provider"
import type { SingleCompletionHandler } from "../.."
import { LocalProvider } from "../local/LocalProvider"
import { PEARAI_URL, pearaiDefaultModelId, pearaiDefaultModelInfo } from "../../../shared/pearaiApi"
import { LOCAL_API_KEY_FALLBACK } from "../../../shared/backendConfig"

type PearAIOptions = ApiHandlerOptions & {
	pearaiModelId?: string
	pearaiAgentModels?: {
		models: Record<string, ModelInfo>
		defaultModelId?: string
	}
	pearaiModelInfo?: ModelInfo
	pearaiBaseUrl?: string
	pearaiApiKey?: string
}

export class PearAIHandler extends BaseProvider implements SingleCompletionHandler {
	private handler: LocalProvider
	private options: PearAIOptions

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options as PearAIOptions

		const modelId =
			this.options.apiModelId ||
			this.options.pearaiModelId ||
			this.options.pearaiAgentModels?.defaultModelId ||
			pearaiDefaultModelId

		const modelInfo =
			this.options.pearaiAgentModels?.models[modelId] || this.options.pearaiModelInfo || pearaiDefaultModelInfo

		this.handler = new LocalProvider({
			...this.options,
			openAiBaseUrl: this.options.pearaiBaseUrl || PEARAI_URL,
			openAiApiKey: this.options.openAiApiKey || this.options.pearaiApiKey || LOCAL_API_KEY_FALLBACK,
			openAiModelId: modelId,
			openAiCustomModelInfo: modelInfo,
		})
	}

	public getModel(): { id: string; info: ModelInfo } {
		// Fallback to using what's available on client side
		const baseModel = this.handler.getModel()
		return baseModel
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): AsyncGenerator<any> {
		yield* this.handler.createMessage(systemPrompt, messages)
	}

	async completePrompt(prompt: string): Promise<string> {
		return this.handler.completePrompt(prompt)
	}
}
