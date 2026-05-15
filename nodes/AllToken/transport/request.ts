import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IDataObject,
} from 'n8n-workflow';
import { throwAllTokenError } from './errors';
import { ALLTOKEN_BASE_URL } from './constants';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Authenticated AllToken API request. Bearer auth is injected by n8n via the
 * allTokenApi credential's authenticate block. Errors are normalized via throwAllTokenError.
 */
export async function allTokenApiRequest(
	ctx: Ctx,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	extraHeaders?: Record<string, string>,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${ALLTOKEN_BASE_URL}${endpoint}`,
		json: true,
		...(body ? { body } : {}),
		...(qs ? { qs } : {}),
		...(extraHeaders ? { headers: extraHeaders } : {}),
	};

	try {
		return (await ctx.helpers.httpRequestWithAuthentication.call(
			ctx,
			'allTokenApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throwAllTokenError(ctx, error);
	}
}
