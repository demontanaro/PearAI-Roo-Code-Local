import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { SingleCompletionHandler } from "../"
import {
	ApiHandlerOptions,
	ModelInfo,
	openAiNativeDefaultModelId,
	OpenAiNativeModelId,
	openAiNativeModels,
} from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import { BaseProvider } from "./base-provider"

const OPENAI_NATIVE_DEFAULT_TEMPERATURE = 0

export class OpenAiNativeHandler extends BaseProvider implements SingleCompletionHandler {
	protected options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options
		const apiKey = this.options.openAiNativeApiKey ?? "not-provided"
		this.client = new OpenAI({ apiKey })
	}

	override async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const modelId = this.getModel().id

		if (modelId.startsWith("o1")) {
			yield* this.handleO1FamilyMessage(modelId, systemPrompt, messages)
			return
		}

		if (modelId.startsWith("o3-mini")) {
			yield* this.handleO3FamilyMessage(modelId, systemPrompt, messages)
			return
		}

		if (this.shouldUseResponsesApi(modelId)) {
			yield* this.handleResponsesMessage(modelId, systemPrompt, messages)
			return
		}

		if (modelId.startsWith("gpt-5")) {
			yield* this.handleGpt5FamilyMessage(modelId, systemPrompt, messages)
			return
		}

		yield* this.handleDefaultModelMessage(modelId, systemPrompt, messages)
	}

	private async *handleO1FamilyMessage(
		modelId: string,
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ApiStream {
		// o1 supports developer prompt with formatting
		// o1-preview and o1-mini only support user messages
		const isOriginalO1 = modelId === "o1"
		const response = await this.client.chat.completions.create({
			model: modelId,
			messages: [
				{
					role: isOriginalO1 ? "developer" : "user",
					content: isOriginalO1 ? `Formatting re-enabled\n${systemPrompt}` : systemPrompt,
				},
				...convertToOpenAiMessages(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
		})

		yield* this.handleStreamResponse(response)
	}

	private async *handleO3FamilyMessage(
		modelId: string,
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ApiStream {
		const stream = await this.client.chat.completions.create({
			model: "o3-mini",
			messages: [
				{
					role: "developer",
					content: `Formatting re-enabled\n${systemPrompt}`,
				},
				...convertToOpenAiMessages(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
			reasoning_effort: this.getChatReasoningEffort(),
		})

		yield* this.handleStreamResponse(stream)
	}

	private async *handleResponsesMessage(
		modelId: string,
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ApiStream {
		const response = await this.client.responses.create({
			model: modelId as OpenAI.Responses.ResponseCreateParamsNonStreaming["model"],
			instructions: systemPrompt,
			input: this.convertMessagesToResponsesInput(messages),
			max_output_tokens: this.getModel().info.maxTokens,
			reasoning: this.getResponsesReasoning(),
			stream: false,
		})

		yield {
			type: "text",
			text: response.output_text || "",
		}

		if (response.usage) {
			yield {
				type: "usage",
				inputTokens: response.usage.input_tokens || 0,
				outputTokens: response.usage.output_tokens || 0,
			}
		}
	}

	private async *handleGpt5FamilyMessage(
		modelId: string,
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ApiStream {
		const stream = await this.client.chat.completions.create({
			model: modelId,
			messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
			stream: true,
			stream_options: { include_usage: true },
			reasoning_effort: this.getChatReasoningEffort(),
		})

		yield* this.handleStreamResponse(stream)
	}

	private async *handleDefaultModelMessage(
		modelId: string,
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ApiStream {
		const stream = await this.client.chat.completions.create({
			model: modelId,
			temperature: this.options.modelTemperature ?? OPENAI_NATIVE_DEFAULT_TEMPERATURE,
			messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
			stream: true,
			stream_options: { include_usage: true },
		})

		yield* this.handleStreamResponse(stream)
	}

	private async *yieldResponseData(response: OpenAI.Chat.Completions.ChatCompletion): ApiStream {
		yield {
			type: "text",
			text: response.choices[0]?.message.content || "",
		}
		yield {
			type: "usage",
			inputTokens: response.usage?.prompt_tokens || 0,
			outputTokens: response.usage?.completion_tokens || 0,
		}
	}

	private async *handleStreamResponse(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): ApiStream {
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}

			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
				}
			}
		}
	}

	override getModel(): { id: OpenAiNativeModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in openAiNativeModels) {
			const id = modelId as OpenAiNativeModelId
			return { id, info: openAiNativeModels[id] }
		}
		return { id: openAiNativeDefaultModelId, info: openAiNativeModels[openAiNativeDefaultModelId] }
	}

	private shouldUseResponsesApi(modelId: string): boolean {
		return modelId === "gpt-5.5-pro" || modelId === "gpt-5.4-pro"
	}

	private getChatReasoningEffort(): OpenAI.Chat.ChatCompletionReasoningEffort | undefined {
		return this.getModel().info.reasoningEffort as OpenAI.Chat.ChatCompletionReasoningEffort | undefined
	}

	private getResponsesReasoning(): OpenAI.Responses.ResponseCreateParamsNonStreaming["reasoning"] | undefined {
		const reasoningEffort = this.getModel().info.reasoningEffort
		return reasoningEffort ? { effort: reasoningEffort as any } : undefined
	}

	private convertMessagesToResponsesInput(
		messages: Anthropic.Messages.MessageParam[],
	): OpenAI.Responses.ResponseInput {
		return convertToOpenAiMessages(messages).map((message) => {
			if (message.role === "tool") {
				return {
					role: "user",
					content: `Tool result (${message.tool_call_id}): ${message.content}`,
				}
			}

			const role =
				message.role === "system" || message.role === "developer" || message.role === "assistant"
					? message.role
					: "user"
			const toolCallText =
				"tool_calls" in message && message.tool_calls?.length
					? message.tool_calls
							.map((toolCall) => `Tool call ${toolCall.function.name}: ${toolCall.function.arguments}`)
							.join("\n")
					: undefined

			if (typeof message.content === "string" || message.content == null) {
				return {
					role,
					content: [message.content, toolCallText].filter(Boolean).join("\n"),
				}
			}

			return {
				role,
				content: message.content.map((part): OpenAI.Responses.ResponseInputContent => {
					if (part.type === "image_url") {
						return {
							type: "input_image",
							image_url: part.image_url.url,
							detail: "auto",
						}
					}

					if (part.type === "text") {
						return {
							type: "input_text",
							text: part.text,
						}
					}

					return {
						type: "input_text",
						text: "",
					}
				}),
			}
		})
	}

	async completePrompt(prompt: string): Promise<string> {
		try {
			const modelId = this.getModel().id
			let requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming

			if (modelId.startsWith("o1")) {
				requestOptions = this.getO1CompletionOptions(modelId, prompt)
			} else if (modelId.startsWith("o3-mini")) {
				requestOptions = this.getO3CompletionOptions(modelId, prompt)
			} else if (this.shouldUseResponsesApi(modelId)) {
				return this.completePromptWithResponsesApi(modelId, prompt)
			} else if (modelId.startsWith("gpt-5")) {
				requestOptions = this.getGpt5CompletionOptions(modelId, prompt)
			} else {
				requestOptions = this.getDefaultCompletionOptions(modelId, prompt)
			}

			const response = await this.client.chat.completions.create(requestOptions)
			return response.choices[0]?.message.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`OpenAI Native completion error: ${error.message}`)
			}
			throw error
		}
	}

	private getO1CompletionOptions(
		modelId: string,
		prompt: string,
	): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
		return {
			model: modelId,
			messages: [{ role: "user", content: prompt }],
		}
	}

	private getO3CompletionOptions(
		modelId: string,
		prompt: string,
	): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
		return {
			model: "o3-mini",
			messages: [{ role: "user", content: prompt }],
			reasoning_effort: this.getChatReasoningEffort(),
		}
	}

	private getGpt5CompletionOptions(
		modelId: string,
		prompt: string,
	): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
		return {
			model: modelId,
			messages: [{ role: "user", content: prompt }],
			reasoning_effort: this.getChatReasoningEffort(),
		}
	}

	private async completePromptWithResponsesApi(modelId: string, prompt: string): Promise<string> {
		const response = await this.client.responses.create({
			model: modelId as OpenAI.Responses.ResponseCreateParamsNonStreaming["model"],
			input: prompt,
			max_output_tokens: this.getModel().info.maxTokens,
			reasoning: this.getResponsesReasoning(),
			stream: false,
		})

		return response.output_text || ""
	}

	private getDefaultCompletionOptions(
		modelId: string,
		prompt: string,
	): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
		return {
			model: modelId,
			messages: [{ role: "user", content: prompt }],
			temperature: this.options.modelTemperature ?? OPENAI_NATIVE_DEFAULT_TEMPERATURE,
		}
	}
}
