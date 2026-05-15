import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { ChatOpenAI } from '@langchain/openai';
import { ALLTOKEN_BASE_URL } from '../AllToken/transport/constants';
import { getChatModels } from '../AllToken/methods/loadOptions';

export class AllTokenChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AllToken Chat Model',
		name: 'allTokenChatModel',
		icon: 'file:alltoken.svg',
		group: ['transform'],
		version: 1,
		description: 'Use AllToken as a chat model provider for n8n AI Agent / Chain',
		defaults: { name: 'AllToken Chat Model' },
		codex: { categories: ['AI'], subcategories: { AI: ['Language Models'] } },
		// Sub-node: no main I/O, only an AiLanguageModel output for AI Agent / Chain consumers.
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [{ name: 'allTokenApi', required: true }],
		properties: [
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getChatModels' },
				required: true,
				default: '',
				description:
					'The AllToken chat model to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 10 },
						default: 2,
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1024,
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
						default: 0.7,
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 1000 },
						default: 60000,
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 1,
					},
				],
			},
		],
	};

	methods = {
		loadOptions: { getChatModels },
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('allTokenApi');
		const apiKey = (credentials.apiKey as string)?.trim();
		if (!apiKey) {
			throw new NodeOperationError(
				this.getNode(),
				'AllToken API key is empty. Set it in the credential.',
			);
		}
		const model = this.getNodeParameter('model', itemIndex) as string;
		const opts = this.getNodeParameter('options', itemIndex, {}) as Record<
			string,
			number | undefined
		>;

		const chat = new ChatOpenAI({
			apiKey,
			configuration: { baseURL: ALLTOKEN_BASE_URL },
			model,
			temperature: opts.temperature,
			maxTokens: opts.maxTokens,
			topP: opts.topP,
			frequencyPenalty: opts.frequencyPenalty,
			presencePenalty: opts.presencePenalty,
			timeout: opts.timeout,
			maxRetries: opts.maxRetries,
		});

		return { response: chat };
	}
}
