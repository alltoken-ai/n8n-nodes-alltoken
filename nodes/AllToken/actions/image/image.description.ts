import type { INodeProperties } from 'n8n-workflow';

const showOnlyForImage = { resource: ['image'] };

export const imageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForImage },
		options: [
			{
				name: 'Generate',
				value: 'generate',
				action: 'Generate an image',
				description: 'Generate an image from a text prompt (synchronous wait for completion)',
			},
		],
		default: 'generate',
	},
];

export const imageFields: INodeProperties[] = [
	{
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getImageModels' },
		required: true,
		default: '',
		description:
			'The image model. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { ...showOnlyForImage, operation: ['generate'] } },
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: { show: { ...showOnlyForImage, operation: ['generate'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForImage, operation: ['generate'] } },
		options: [
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '1024x1024',
				options: [
					{ name: '1024x1024 (Square)', value: '1024x1024' },
					{ name: '1792x1024 (Landscape)', value: '1792x1024' },
					{ name: '1024x1792 (Portrait)', value: '1024x1792' },
				],
			},
			{
				displayName: 'Number of Images',
				name: 'n',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1 },
				description: 'Currently capped at 1. Multi-image output is on the roadmap.',
			},
			{
				displayName: 'Max Wait (Seconds)',
				name: 'maxWaitSeconds',
				type: 'number',
				default: 60,
				typeOptions: { minValue: 10, maxValue: 300 },
			},
		],
	},
];
