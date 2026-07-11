import type { ModelInfo } from "@roo-code/types"

import type { ApiHandlerOptions } from "../../../shared/api"
import { PEARAI_URL, allModels, pearaiDefaultModelId, pearaiDefaultModelInfo } from "../../../shared/pearaiApi"
import { LOCAL_API_KEY_FALLBACK } from "../../../shared/backendConfig"

import { OpenAiHandler, getOpenAiModels as getOpenAiModelsFromOpenAi } from "../openai"

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

export class PearAIGenericHandler extends OpenAiHandler {
	private readonly pearOptions: PearAIOptions

	constructor(options: ApiHandlerOptions) {
		const pearOptions = options as PearAIOptions
		const modelId =
			pearOptions.openAiModelId ||
			pearOptions.pearaiModelId ||
			pearOptions.pearaiAgentModels?.defaultModelId ||
			pearaiDefaultModelId
		const modelInfo =
			pearOptions.pearaiAgentModels?.models[modelId] || pearOptions.pearaiModelInfo || pearaiDefaultModelInfo

		super({
			...pearOptions,
			openAiBaseUrl: pearOptions.openAiBaseUrl || pearOptions.pearaiBaseUrl || PEARAI_URL,
			openAiApiKey: pearOptions.openAiApiKey || pearOptions.pearaiApiKey || LOCAL_API_KEY_FALLBACK,
			openAiModelId: modelId,
			openAiCustomModelInfo: modelInfo,
		})

		this.pearOptions = pearOptions
	}

	override getModel() {
		const base = super.getModel()
		const modelId =
			base.id || this.pearOptions.openAiModelId || this.pearOptions.pearaiModelId || pearaiDefaultModelId
		const modelInfo =
			this.pearOptions.pearaiAgentModels?.models[modelId] ||
			this.pearOptions.pearaiModelInfo ||
			allModels[modelId] ||
			base.info ||
			pearaiDefaultModelInfo

		return {
			...base,
			id: modelId,
			info: modelInfo,
		}
	}
}

export async function getOpenAiModels(baseUrl?: string, apiKey?: string) {
	return getOpenAiModelsFromOpenAi(baseUrl, apiKey)
}
