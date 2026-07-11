import { useState, useEffect } from "react"
import { ModelInfo } from "../../../src/shared/api"
import {
	buildPearAIAgentModelsConfig,
	fetchOpenAICompatibleModelIds,
	pearaiDefaultModelId,
	pearaiDefaultModelInfo,
	PEARAI_URL,
} from "../../../src/shared/pearaiApi"
import type { ApiConfiguration } from "../../../src/shared/api"

export const usePearAIModels = (apiConfiguration?: ApiConfiguration) => {
	const [pearaiModels, setPearAIModels] = useState<Record<string, ModelInfo>>({
		[pearaiDefaultModelId]: pearaiDefaultModelInfo,
	})

	useEffect(() => {
		const fetchPearAIModels = async () => {
			try {
				const modelIds = await fetchOpenAICompatibleModelIds(apiConfiguration?.pearaiBaseUrl || PEARAI_URL)
				const config = buildPearAIAgentModelsConfig(modelIds)

				if (config.models && Object.keys(config.models).length > 0) {
					setPearAIModels(config.models)
				}
			} catch (error) {
				console.error("Error fetching local OpenAI-compatible models:", error)
			}
		}

		if (apiConfiguration?.apiProvider === "pearai") {
			fetchPearAIModels()
		}
	}, [apiConfiguration?.apiProvider, apiConfiguration?.pearaiBaseUrl])

	return {
		models: pearaiModels,
	}
}
