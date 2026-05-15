import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getChatModels, getImageModels, getVideoModels } from './methods/loadOptions';
import { chatOperations, chatFields } from './actions/chat/chat.description';
import { executeChatMessage } from './actions/chat/chat.execute';
import { imageOperations, imageFields } from './actions/image/image.description';
import { executeImageGenerate } from './actions/image/image.execute';
import { videoOperations, videoFields } from './actions/video/video.description';
import { executeVideoGenerate, executeVideoGetResult } from './actions/video/video.execute';

export class AllToken implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AllToken',
		name: 'allToken',
		icon: 'file:alltoken.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Unified OpenAI-compatible AI API — chat, image, video',
		defaults: { name: 'AllToken' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'allTokenApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Chat', value: 'chat' },
					{ name: 'Image', value: 'image' },
					{ name: 'Video', value: 'video' },
				],
				default: 'chat',
			},
			...chatOperations,
			...imageOperations,
			...videoOperations,
			...chatFields,
			...imageFields,
			...videoFields,
		],
	};

	methods = {
		loadOptions: { getChatModels, getImageModels, getVideoModels },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'chat' && operation === 'message') {
					returnData.push(await executeChatMessage(this, i));
				} else if (resource === 'image' && operation === 'generate') {
					returnData.push(await executeImageGenerate(this, i));
				} else if (resource === 'video' && operation === 'generate') {
					returnData.push(await executeVideoGenerate(this, i));
				} else if (resource === 'video' && operation === 'getResult') {
					returnData.push(await executeVideoGetResult(this, i));
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported resource/operation: ${resource}/${operation}`,
						{ itemIndex: i },
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
