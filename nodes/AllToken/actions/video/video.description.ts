import type { INodeProperties } from 'n8n-workflow';

const showOnlyForVideo = { resource: ['video'] };

export const videoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForVideo },
		options: [
			{
				name: 'Generate',
				value: 'generate',
				action: 'Submit a video generation task',
				description: 'Submit a video generation task and return the generation ID immediately (does not wait for the result)',
			},
			{
				name: 'Get Result',
				value: 'getResult',
				action: 'Get video generation result',
				description: 'Query a video generation task by ID; returns the video URL when the task is complete',
			},
		],
		default: 'generate',
	},
];

export const videoFields: INodeProperties[] = [
	{
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getVideoModels' },
		required: true,
		default: '',
		description:
			'The video model. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { ...showOnlyForVideo, operation: ['generate'] } },
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: { show: { ...showOnlyForVideo, operation: ['generate'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForVideo, operation: ['generate'] } },
		options: [
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'number',
				typeOptions: { minValue: 4, maxValue: 12 },
				default: 5,
				description: 'Length of the generated video. AllToken requires 4–12 seconds.',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'string',
				default: '720p',
				description: 'E.g. 480p / 720p / 1080p. Model-dependent — may be ignored by some models.',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'ratio',
				type: 'string',
				default: '16:9',
				description: 'E.g. 16:9 / 9:16 / 1:1. Model-dependent.',
			},
		],
	},
	{
		displayName: 'Generation ID',
		name: 'generationId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID returned by the Generate operation. Used to query the video result.',
		displayOptions: { show: { ...showOnlyForVideo, operation: ['getResult'] } },
	},
];
