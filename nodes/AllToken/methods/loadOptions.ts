import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { allTokenApiRequest } from '../transport/request';
import { throwAllTokenError } from '../transport/errors';
import { classifyModel, type ModelCapability, type ModelEntry } from './modelClassifier';
import { ALLTOKEN_HOST } from '../transport/constants';

/**
 * Hardcoded video models. AllToken's video API works (POST /v1/videos/generations with
 * these ids returns HTTP 202 queued), but neither /v1/models nor /api-account/models
 * lists video models in their catalog response. If/when AllToken adds video models to
 * /api-account/models, switch this to use that source.
 */
const HARDCODED_VIDEO_MODELS = ['seedance-2.0', 'seedance-1.5-pro'] as const;

async function fetchV1Models(ctx: ILoadOptionsFunctions): Promise<ModelEntry[]> {
	const resp = await allTokenApiRequest(ctx, 'GET', '/models');
	return (resp.data as ModelEntry[]) ?? [];
}

async function fetchAccountModels(ctx: ILoadOptionsFunctions): Promise<ModelEntry[]> {
	// /api-account/models is NOT under /v1, so we bypass allTokenApiRequest (which
	// prepends ALLTOKEN_BASE_URL). We still route errors through throwAllTokenError
	// so users see the AllToken-aware hints instead of raw axios errors.
	try {
		const resp = (await ctx.helpers.httpRequest({
			method: 'GET',
			url: `${ALLTOKEN_HOST}/api-account/models`,
			json: true,
		})) as { data?: ModelEntry[] };
		return resp.data ?? [];
	} catch (error) {
		throwAllTokenError(ctx, error);
	}
}

function toOptions(models: ModelEntry[], cap: ModelCapability): INodePropertyOptions[] {
	return models
		.filter((m) => classifyModel(m) === cap)
		.map((m) => ({ name: m.id, value: m.id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getChatModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	// /v1/models has ~46 chat entries (far more complete than /api-account/models' ~19)
	const models = await fetchV1Models(this);
	return toOptions(models, 'chat');
}

export async function getImageModels(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	// /api-account/models is the only place gpt-image-2 (output_modalities=['image']) is listed.
	// Errors surface to n8n loadOptions UI via throwAllTokenError (called inside
	// fetchAccountModels) — no silent catch.
	const models = await fetchAccountModels(this);
	return toOptions(models, 'image');
}

export async function getVideoModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	// Catalog endpoints don't list video models yet — hardcoded.
	return HARDCODED_VIDEO_MODELS.map((id) => ({ name: id, value: id }));
}
