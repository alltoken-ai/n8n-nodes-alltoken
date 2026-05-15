export interface PollOptions<T> {
	intervalMs: number;
	maxWaitMs: number;
	isTerminal: (resp: T) => boolean;
	isSuccess: (resp: T) => boolean;
}

/**
 * Thrown when polling reaches a terminal non-success state. Carries the final
 * response payload so callers can extract error.message, taskId, etc.
 */
export class PollTerminalFailureError<T> extends Error {
	constructor(public readonly response: T) {
		super('Polling reached a non-success terminal state');
		this.name = 'PollTerminalFailureError';
	}
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Generic synchronous polling. Calls fetch() every intervalMs until isTerminal returns
 * true, or until at least maxWaitMs has elapsed.
 *
 * Bounding: maxWaitMs is a lower bound on time before throwing on timeout — a fetch in
 * flight when the deadline passes will complete before timeout is thrown, so total wall
 * time can exceed maxWaitMs by up to one fetch latency.
 *
 * @throws PollTerminalFailureError<T> when a terminal non-success state is reached
 *   (carries the response).
 * @throws Error when maxWaitMs elapses with no terminal response.
 */
export async function pollUntilDone<T>(
	fetch: () => Promise<T>,
	opts: PollOptions<T>,
): Promise<T> {
	const start = Date.now();
	while (Date.now() - start < opts.maxWaitMs) {
		const resp = await fetch();
		if (opts.isTerminal(resp)) {
			if (!opts.isSuccess(resp)) {
				throw new PollTerminalFailureError(resp);
			}
			return resp;
		}
		await sleep(opts.intervalMs);
	}
	throw new Error(`Polling timed out after ${opts.maxWaitMs}ms`);
}
