import { buildChatBody } from '../chatBody';

describe('buildChatBody', () => {
	it('builds a minimal body from a simple prompt', () => {
		const body = buildChatBody({
			model: 'deepseek-chat',
			simplePrompt: 'Hello',
			messagesJson: undefined,
			options: {},
		});
		expect(body).toEqual({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: 'Hello' }],
		});
	});

	it('uses an explicit messages array when provided', () => {
		const body = buildChatBody({
			model: 'qwen-max',
			simplePrompt: undefined,
			messagesJson: [
				{ role: 'system', content: 'Be brief' },
				{ role: 'user', content: 'Hi' },
			],
			options: {},
		});
		expect(body.messages).toHaveLength(2);
		expect(body.messages[0]).toEqual({ role: 'system', content: 'Be brief' });
	});

	it('passes through tunable options and enable_search only when set', () => {
		const body = buildChatBody({
			model: 'deepseek-chat',
			simplePrompt: 'Hello',
			messagesJson: undefined,
			options: { temperature: 0.2, maxTokens: 512, topP: 0.9, enableSearch: true },
		});
		expect(body.temperature).toBe(0.2);
		expect(body.max_tokens).toBe(512);
		expect(body.top_p).toBe(0.9);
		expect(body.enable_search).toBe(true);
	});

	it('omits enable_search when false/unset', () => {
		const body = buildChatBody({
			model: 'deepseek-chat',
			simplePrompt: 'Hello',
			messagesJson: undefined,
			options: { enableSearch: false },
		});
		expect(body).not.toHaveProperty('enable_search');
	});

	it('throws when neither prompt nor messages are provided', () => {
		expect(() =>
			buildChatBody({ model: 'm', simplePrompt: undefined, messagesJson: undefined, options: {} }),
		).toThrow();
	});
});
