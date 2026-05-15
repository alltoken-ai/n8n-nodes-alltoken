import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createHash } from 'crypto';
import { allTokenApiRequest } from '../../transport/request';
import { buildVideoBody, type VideoOptions } from '../../transport/videoBody';

interface VideoJobResponse {
	id?: string;
	task_id?: string;
	status?: string;
	video_url?: string;
	video_url_expires_at?: string;
	video_url_ttl?: number;
	is_expired?: boolean;
	model?: string;
	duration?: number;
	ratio?: string;
	usage?: IDataObject;
	error?: { message?: string; code?: string };
}

/** Submit a video generation task; return id immediately (no polling). */
export async function executeVideoGenerate(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const model = ctx.getNodeParameter('model', itemIndex) as string;
	const prompt = ctx.getNodeParameter('prompt', itemIndex) as string;
	const options = ctx.getNodeParameter('options', itemIndex, {}) as VideoOptions;

	let body;
	try {
		body = buildVideoBody({ model, prompt, options });
	} catch (error) {
		throw new NodeOperationError(ctx.getNode(), (error as Error).message, { itemIndex });
	}

	// Deterministic Idempotency-Key from execution context + body so retries with the
	// same inputs reach AllToken's dedup logic. Same pattern as image.execute.ts.
	const idemSource = JSON.stringify({
		workflowId: ctx.getWorkflow().id,
		executionId: ctx.getExecutionId(),
		nodeId: ctx.getNode().id,
		itemIndex,
		body,
	});
	const idempotencyKey = createHash('sha256').update(idemSource).digest('hex').slice(0, 32);

	const submit = (await allTokenApiRequest(
		ctx,
		'POST',
		'/videos/generations',
		body as unknown as IDataObject,
		undefined,
		{ 'Idempotency-Key': idempotencyKey },
	)) as unknown as VideoJobResponse;

	const id = submit.id ?? submit.task_id;
	if (!id) {
		throw new NodeOperationError(
			ctx.getNode(),
			'AllToken did not return a video generation id',
			{ itemIndex },
		);
	}

	return {
		json: { id, status: submit.status ?? 'queued', model },
		pairedItem: { item: itemIndex },
	};
}

/** Query a video generation task by id. Returns URL on completed; status only on in-progress; throws on failed. */
export async function executeVideoGetResult(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const id = ctx.getNodeParameter('generationId', itemIndex) as string;
	if (!id?.trim()) {
		throw new NodeOperationError(ctx.getNode(), 'Generation ID is required', { itemIndex });
	}

	const resp = (await allTokenApiRequest(
		ctx,
		'GET',
		`/videos/generations/${id}`,
	)) as unknown as VideoJobResponse;

	if (resp.status === 'failed' || resp.status === 'cancelled') {
		throw new NodeOperationError(
			ctx.getNode(),
			`Video generation ${resp.status}${resp.error?.message ? `: ${resp.error.message}` : ''} (job ${id})`,
			{ itemIndex },
		);
	}

	return {
		json: {
			id,
			status: resp.status,
			...(resp.video_url ? { url: resp.video_url } : {}),
			...(resp.video_url_expires_at ? { url_expires_at: resp.video_url_expires_at } : {}),
			...(resp.model ? { model: resp.model } : {}),
			...(resp.duration !== undefined ? { duration: resp.duration } : {}),
			...(resp.ratio ? { ratio: resp.ratio } : {}),
			...(resp.usage ? { usage: resp.usage } : {}),
		},
		pairedItem: { item: itemIndex },
	};
}
