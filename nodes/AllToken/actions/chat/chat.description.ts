import type { INodeProperties } from 'n8n-workflow';

const showOnlyForChat = { resource: ['chat'] };

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForChat },
		options: [
			{
				name: 'Message',
				value: 'message',
				action: 'Send a chat message',
				description: 'Send messages to a chat model and get a completion',
			},
		],
		default: 'message',
	},
];

export const chatFields: INodeProperties[] = [
	{
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getChatModels' },
		required: true,
		default: '',
		description:
			'The AllToken model to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { ...showOnlyForChat, operation: ['message'] } },
	},
	{
		displayName: 'Input Mode',
		name: 'inputMode',
		type: 'options',
		options: [
			{ name: 'Simple Prompt', value: 'simple' },
			{ name: 'Messages Array', value: 'messages' },
		],
		default: 'simple',
		displayOptions: { show: { ...showOnlyForChat, operation: ['message'] } },
	},
	{
		displayName: 'Prompt',
		name: 'simplePrompt',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: {
			show: { ...showOnlyForChat, operation: ['message'], inputMode: ['simple'] },
		},
	},
	{
		displayName: 'Messages',
		name: 'messagesJson',
		type: 'json',
		default: '[\n  { "role": "user", "content": "Hello" }\n]',
		description: 'Array of {role, content} message objects',
		displayOptions: {
			show: { ...showOnlyForChat, operation: ['message'], inputMode: ['messages'] },
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForChat, operation: ['message'] } },
		options: [
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				default: 1,
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1024,
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				default: 1,
			},
			{
				displayName: 'Enable Web Search',
				name: 'enableSearch',
				type: 'boolean',
				default: false,
				description:
					'Whether to let the model search the web (supported by DeepSeek + Qwen; ignored by others)',
			},
		],
	},
];
