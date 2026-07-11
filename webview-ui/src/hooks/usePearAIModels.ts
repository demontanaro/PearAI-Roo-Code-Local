import { useState, useEffect } from "react"
import type { ModelInfo, ProviderSettings } from "@roo-code/types"
import {
	buildPearAIAgentModelsConfig,
	fetchOpenAICompatibleModelIds,
	pearaiDefaultModelId,
	pearaiDefaultModelInfo,
	PEARAI_URL,
} from "../../../src/shared/pearaiApi"

export const usePearAIModels = (apiConfiguration?: ProviderSettings) => {
	const [pearaiModels, setPearAIModels] = useState<Record<string, ModelInfo>>({
		[pearaiDefaultModelId]: pearaiDefaultModelInfo,
	})

	useEffect(() => {
		const fetchPearAIModels = async () => {
			try {
				const modelIds = await fetchOpenAICompatibleModelIds(
					(apiConfiguration as any)?.pearaiBaseUrl || PEARAI_URL,
				)
				const config = buildPearAIAgentModelsConfig(modelIds)

				if (config.models && Object.keys(config.models).length > 0) {
					setPearAIModels(config.models)
				}
			} catch (error) {
				console.error("Error fetching local OpenAI-compatible models:", error)
			}
		}

		if ((apiConfiguration as any)?.apiProvider === "pearai") {
			fetchPearAIModels()
		}
	}, [(apiConfiguration as any)?.apiProvider, (apiConfiguration as any)?.pearaiBaseUrl])

	return {
		models: pearaiModels,
	}
}
