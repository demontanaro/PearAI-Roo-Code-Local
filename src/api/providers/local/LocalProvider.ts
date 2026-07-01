import { ApiHandlerOptions, ModelInfo, openAiModelInfoSaneDefaults } from "../../../shared/api"
import { LOCAL_API_KEY_FALLBACK } from "../../../shared/backendConfig"
import { OpenAiHandler } from "../openai"

export class LocalProvider extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		super({
			...options,
			openAiApiKey: options.openAiApiKey || options.pearaiApiKey || LOCAL_API_KEY_FALLBACK,
		})
	}

	override getModel(): { id: string; info: ModelInfo } {
		const model = super.getModel()
		return {
			id: model.id,
			info: model.info || openAiModelInfoSaneDefaults,
		}
	}
}
