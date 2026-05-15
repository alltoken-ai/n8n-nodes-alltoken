import { describeAllTokenError } from '../errors';

describe('describeAllTokenError', () => {
	it('extracts message, code and request_id from the AllToken error envelope', () => {
		const result = describeAllTokenError(402, {
			error: { code: 'insufficient_balance', message: 'Balance too low', request_id: 'req_123' },
		});
		expect(result.message).toBe('Balance too low');
		expect(result.description).toContain('insufficient_balance');
		expect(result.description).toContain('req_123');
		expect(result.description).toContain('余额不足');
	});

	it('extracts a top-level request_id (the shape the live API returns for 404)', () => {
		const result = describeAllTokenError(404, {
			error: {
				type: 'invalid_request_error',
				code: 'model_not_found',
				message: 'The model `x` does not exist.',
			},
			request_id: 'd837nfogdg16olcdtop0',
		});
		expect(result.message).toBe('The model `x` does not exist.');
		expect(result.description).toContain('model_not_found');
		expect(result.description).toContain('d837nfogdg16olcdtop0');
	});

	it('adds an actionable hint for 401', () => {
		const result = describeAllTokenError(401, { error: { message: 'bad key' } });
		expect(result.description).toContain('API Key');
	});

	it('adds a hint for 410 image_already_retrieved', () => {
		const result = describeAllTokenError(410, { error: { message: 'gone' } });
		expect(result.description).toContain('一次性');
	});

	it('falls back gracefully when there is no envelope', () => {
		const result = describeAllTokenError(500, undefined);
		expect(result.message).toBe('AllToken API request failed');
		expect(result.description).toBe('');
	});
});
