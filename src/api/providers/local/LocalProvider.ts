import type { ApiHandlerOptions } from "../../../shared/api"
import { LOCAL_API_KEY_FALLBACK } from "../../../shared/backendConfig"
import { OpenAiHandler } from "../openai"

export class LocalProvider extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		const pearOptions = options as any
		super({
			...options,
			openAiApiKey: options.openAiApiKey || pearOptions.pearaiApiKey || LOCAL_API_KEY_FALLBACK,
		})
	}
}
