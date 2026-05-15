export interface ChatMessage {
	role: string;
	content: string;
}

export interface ChatOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	enableSearch?: boolean;
}

export interface BuildChatBodyInput {
	model: string;
	simplePrompt: string | undefined;
	messagesJson: ChatMessage[] | undefined;
	options: ChatOptions;
}

export interface ChatRequestBody {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	enable_search?: boolean;
}

/** Pure function: assemble the OpenAI-compatible /chat/completions request body. */
export function buildChatBody(input: BuildChatBodyInput): ChatRequestBody {
	let messages: ChatMessage[];
	if (input.messagesJson && input.messagesJson.length > 0) {
		messages = input.messagesJson;
	} else if (input.simplePrompt) {
		messages = [{ role: 'user', content: input.simplePrompt }];
	} else {
		throw new Error('Provide either a prompt or a messages array for the Chat operation.');
	}

	const body: ChatRequestBody = { model: input.model, messages };
	const { temperature, maxTokens, topP, enableSearch } = input.options;
	if (temperature !== undefined) body.temperature = temperature;
	if (maxTokens !== undefined) body.max_tokens = maxTokens;
	if (topP !== undefined) body.top_p = topP;
	if (enableSearch) body.enable_search = true;
	return body;
}
