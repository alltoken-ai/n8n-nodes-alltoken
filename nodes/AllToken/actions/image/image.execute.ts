import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createHash } from 'crypto';
import { allTokenApiRequest } from '../../transport/request';
import { buildImageBody, type ImageOptions } from '../../transport/imageBody';
import { pollUntilDone, PollTerminalFailureError } from '../../transport/polling';

interface ImageJobResponse {
	id?: string;
	task_id?: string;
	status: string;
	data?: Array<{ b64_json?: string; r2_url?: string; mime_type?: string }>;
	error?: { message?: string; code?: string };
	usage?: IDataObject;
	model?: string;
	size?: string;
}

const TERMINAL_STATUSES = new Set(['completed', 'succeeded', 'failed', 'cancelled']);
const SUCCESS_STATUSES = new Set(['completed', 'succeeded']);

/** Execute the Image → Generate operation for a single input item. */
export async function executeImageGenerate(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const model = ctx.getNodeParameter('model', itemIndex) as string;
	const prompt = ctx.getNodeParameter('prompt', itemIndex) as string;
	const rawOptions = ctx.getNodeParameter('options', itemIndex, {}) as ImageOptions & {
		maxWaitSeconds?: number;
	};
	const { maxWaitSeconds = 60, ...imageOptions } = rawOptions;

	let body;
	try {
		body = buildImageBody({ model, prompt, options: imageOptions });
	} catch (error) {
		throw new NodeOperationError(ctx.getNode(), (error as Error).message, { itemIndex });
	}

	// Deterministic Idempotency-Key from execution context + body so retries with the
	// same inputs reach AllToken's dedup logic. Changing any input → fresh generation.
	const idemSource = JSON.stringify({
		workflowId: ctx.getWorkflow().id,
		executionId: ctx.getExecutionId(),
		nodeId: ctx.getNode().id,
		itemIndex,
		body,
	});
	const idempotencyKey = createHash('sha256').update(idemSource).digest('hex').slice(0, 32);

	// Submit
	const submit = (await allTokenApiRequest(
		ctx,
		'POST',
		'/images/generations/async',
		body as unknown as IDataObject,
		undefined,
		{ 'Idempotency-Key': idempotencyKey },
	)) as unknown as ImageJobResponse;

	const jobId = submit.id ?? submit.task_id;
	if (!jobId) {
		throw new NodeOperationError(
			ctx.getNode(),
			'AllToken did not return a generation id',
			{ itemIndex },
		);
	}

	// Poll
	const maxWaitMs = maxWaitSeconds * 1000;
	let finalJob: ImageJobResponse;
	try {
		finalJob = await pollUntilDone(
			async () =>
				(await allTokenApiRequest(
					ctx,
					'GET',
					`/images/generations/${jobId}`,
				)) as unknown as ImageJobResponse,
			{
				intervalMs: 2000,
				maxWaitMs,
				isTerminal: (r) => TERMINAL_STATUSES.has(r.status),
				isSuccess: (r) => SUCCESS_STATUSES.has(r.status),
			},
		);
	} catch (error) {
		if (error instanceof PollTerminalFailureError) {
			const r = error.response as ImageJobResponse;
			throw new NodeOperationError(
				ctx.getNode(),
				`Image generation did not complete (status: ${r.status})${r.error?.message ? `. Reason: ${r.error.message}` : ''}. Job id: ${jobId}`,
				{ itemIndex },
			);
		}
		throw error;
	}

	// TODO(multi-image): when UI exposes n>1, return INodeExecutionData[] instead of [0]
	const first = finalJob.data?.[0];
	if (!first) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Image generation produced no data (status: ${finalJob.status})`,
			{ itemIndex },
		);
	}

	let binary;
	if (first.b64_json) {
		const buf = Buffer.from(first.b64_json, 'base64');
		const mime = first.mime_type ?? 'image/png';
		const ext = mime.split('/')[1] ?? 'png';
		binary = {
			data: await ctx.helpers.prepareBinaryData(buf, `${jobId}.${ext}`, mime),
		};
	}

	return {
		json: {
			id: jobId,
			model: finalJob.model ?? model,
			prompt,
			status: finalJob.status,
			size: finalJob.size,
			usage: finalJob.usage,
			...(first.r2_url ? { url: first.r2_url } : {}),
		},
		binary,
		pairedItem: { item: itemIndex },
	};
}
