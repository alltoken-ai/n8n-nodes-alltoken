import { pollUntilDone, PollTerminalFailureError } from '../polling';

describe('pollUntilDone', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('达到终态时返回响应', async () => {
		let calls = 0;
		const fetch = jest.fn(async () => ({ status: ++calls >= 3 ? 'completed' : 'running' }));
		const promise = pollUntilDone(fetch, {
			intervalMs: 100,
			maxWaitMs: 10_000,
			isTerminal: (r) => r.status === 'completed' || r.status === 'failed',
			isSuccess: (r) => r.status === 'completed',
		});
		await jest.runAllTimersAsync();
		await expect(promise).resolves.toEqual({ status: 'completed' });
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it('终态失败时抛错并附带响应', async () => {
		const fetch = jest.fn(async () => ({ status: 'failed', error: { message: 'oops' } }));
		const promise = pollUntilDone(fetch, {
			intervalMs: 100,
			maxWaitMs: 1_000,
			isTerminal: (r) => r.status === 'completed' || r.status === 'failed',
			isSuccess: (r) => r.status === 'completed',
		});
		await Promise.all([
			jest.runAllTimersAsync(),
			promise.catch((e) => {
				expect(e).toBeInstanceOf(PollTerminalFailureError);
				expect(e.response).toEqual({ status: 'failed', error: { message: 'oops' } });
			}),
		]);
	});

	it('超时时抛错', async () => {
		const fetch = jest.fn(async () => ({ status: 'running' }));
		const promise = pollUntilDone(fetch, {
			intervalMs: 100,
			maxWaitMs: 250,
			isTerminal: (r) => r.status === 'completed',
			isSuccess: () => true,
		});
		await Promise.all([jest.runAllTimersAsync(), expect(promise).rejects.toThrow(/timed out/i)]);
	});
});
