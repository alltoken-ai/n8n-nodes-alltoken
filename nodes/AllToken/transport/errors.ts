import type { IExecuteFunctions, ILoadOptionsFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

interface AllTokenErrorEnvelope {
	error?: { code?: string; message?: string; type?: string; request_id?: string };
	// The live API returns request_id at the top level for some errors (e.g. 404),
	// and nested under `error` for others — accept both.
	request_id?: string;
}

interface DescribedError {
	message: string;
	description: string;
}

const HINTS: Record<number, string> = {
	401: 'API Key 无效，请检查 AllToken 凭证。',
	402: 'AllToken 账户余额不足，请前往 alltoken.ai 充值。',
	410: '图片结果已被读取（一次性交付），请重新生成。',
	429: '触发限流，请稍后重试或降低并发。',
};

/** Pure function: turn an HTTP status + response body into a human-readable message/description. */
export function describeAllTokenError(
	status: number | undefined,
	body: AllTokenErrorEnvelope | undefined,
): DescribedError {
	const envelope = body?.error;
	const message = envelope?.message ?? 'AllToken API request failed';
	const requestId = envelope?.request_id ?? body?.request_id;
	const parts = [
		envelope?.code && `code: ${envelope.code}`,
		requestId && `request_id: ${requestId}`,
		status !== undefined && HINTS[status],
	].filter(Boolean) as string[];
	return { message, description: parts.join(' | ') };
}

/** Wrap any caught HTTP error into an n8n NodeApiError with AllToken-aware context. */
export function throwAllTokenError(
	ctx: IExecuteFunctions | ILoadOptionsFunctions,
	error: unknown,
): never {
	const err = error as {
		httpCode?: string | number;
		statusCode?: number;
		response?: { status?: number; body?: AllTokenErrorEnvelope };
		cause?: { response?: { status?: number; data?: AllTokenErrorEnvelope } };
		// n8n's NodeApiError stashes the parsed response body here.
		context?: { data?: AllTokenErrorEnvelope };
	};
	const status = Number(
		err?.httpCode ?? err?.statusCode ?? err?.response?.status ?? err?.cause?.response?.status,
	);
	const body = err?.response?.body ?? err?.cause?.response?.data ?? err?.context?.data;
	const described = describeAllTokenError(Number.isNaN(status) ? undefined : status, body);

	// n8n's httpRequestWithAuthentication already wraps auth failures (401/403) as a
	// NodeApiError, and NodeApiError's constructor returns the original untouched when
	// handed another NodeApiError — so re-wrapping is a silent no-op. Enrich in place instead.
	if (error instanceof NodeApiError || (error as { name?: string })?.name === 'NodeApiError') {
		const apiError = error as NodeApiError;
		apiError.message = described.message;
		if (described.description) apiError.description = described.description;
		throw apiError;
	}

	throw new NodeApiError(ctx.getNode(), error as JsonObject, {
		message: described.message,
		description: described.description,
		httpCode: Number.isNaN(status) ? undefined : String(status),
	});
}
