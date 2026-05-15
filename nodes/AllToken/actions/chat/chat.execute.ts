import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { allTokenApiRequest } from '../../transport/request';
import { buildChatBody, type ChatMessage, type ChatOptions } from '../../transport/chatBody';

/** Execute the Chat → Message operation for a single input item. */
export async function executeChatMessage(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const model = ctx.getNodeParameter('model', itemIndex) as string;
	const inputMode = ctx.getNodeParameter('inputMode', itemIndex) as 'simple' | 'messages';
	const options = ctx.getNodeParameter('options', itemIndex, {}) as ChatOptions;

	let simplePrompt: string | undefined;
	let messagesJson: ChatMessage[] | undefined;

	if (inputMode === 'simple') {
		simplePrompt = ctx.getNodeParameter('simplePrompt', itemIndex) as string;
	} else {
		const raw = ctx.getNodeParameter('messagesJson', itemIndex);
		messagesJson = (typeof raw === 'string' ? JSON.parse(raw) : raw) as ChatMessage[];
		if (!Array.isArray(messagesJson)) {
			throw new NodeOperationError(ctx.getNode(), 'Messages must be a JSON array', { itemIndex });
		}
	}

	let body;
	try {
		body = buildChatBody({ model, simplePrompt, messagesJson, options });
	} catch (error) {
		throw new NodeOperationError(ctx.getNode(), (error as Error).message, { itemIndex });
	}

	const response = await allTokenApiRequest(
		ctx,
		'POST',
		'/chat/completions',
		body as unknown as IDataObject,
	);

	const choice = (response.choices as IDataObject[])?.[0];
	const messageContent = ((choice?.message as IDataObject)?.content as string) ?? '';

	return {
		json: {
			content: messageContent,
			model: response.model,
			finishReason: (choice?.finish_reason as string) ?? null,
			usage: response.usage ?? null,
			raw: response,
		},
		pairedItem: { item: itemIndex },
	};
}
