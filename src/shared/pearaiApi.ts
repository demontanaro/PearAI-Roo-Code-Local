import { LOCAL_API_BASE } from "./backendConfig"
import type { ModelInfo } from "@roo-code/types"

export const PEARAI_URL = LOCAL_API_BASE

const openAiModelInfoSaneDefaults: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 128_000,
	supportsImages: true,
	supportsPromptCache: false,
}

export interface PearAIAgentModelsConfig {
	models: Record<string, ModelInfo>
	defaultModelId?: string
}

// PearAI
export type PearAIModelId = keyof typeof pearaiModels
export const pearaiDefaultModelId: PearAIModelId = "local-model"
export const pearaiDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 128_000,
	supportsImages: true,
	supportsPromptCache: false,
	description: "Local OpenAI-compatible model served by your configured local backend.",
}

export const pearaiModels = {
	"local-model": {
		maxTokens: 8192,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		description: "Local OpenAI-compatible model served by your configured local backend.",
	},
} as const satisfies Record<string, ModelInfo>

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "")

export const buildPearAIAgentModelsConfig = (modelIds: string[]): PearAIAgentModelsConfig => {
	const uniqueIds = [...new Set(modelIds.filter(Boolean))]
	if (uniqueIds.length === 0) {
		return {
			models: pearaiModels,
			defaultModelId: pearaiDefaultModelId,
		}
	}

	const models = Object.fromEntries(
		uniqueIds.map((id) => [
			id,
			{
				...openAiModelInfoSaneDefaults,
				description: `OpenAI-compatible model: ${id}`,
			} satisfies ModelInfo,
		]),
	)

	return {
		models,
		defaultModelId: uniqueIds[0],
	}
}

export async function fetchOpenAICompatibleModelIds(baseUrl: string = PEARAI_URL, apiKey?: string): Promise<string[]> {
	try {
		if (!URL.canParse(baseUrl)) {
			return []
		}

		const headers: Record<string, string> = {}
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`
		}

		const response = await fetch(`${trimTrailingSlash(baseUrl)}/models`, {
			method: "GET",
			headers,
		})

		if (!response.ok) {
			return []
		}

		const payload = await response.json()
		const modelsArray = payload?.data?.map((model: any) => model?.id).filter(Boolean) ?? []

		return [...new Set<string>(modelsArray)]
	} catch {
		return []
	}
}

export const allModels: { [key: string]: ModelInfo } = {
	...pearaiModels,
} as const satisfies Record<string, ModelInfo>
