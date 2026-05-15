import { classifyModel } from '../modelClassifier';

describe('classifyModel', () => {
	it('优先 output_modalities (api-account/models 的权威字段)', () => {
		expect(classifyModel({ id: 'mystery-x', output_modalities: ['text'] })).toBe('chat');
		expect(classifyModel({ id: 'mystery-y', output_modalities: ['image'] })).toBe('image');
		expect(classifyModel({ id: 'mystery-z', output_modalities: ['video'] })).toBe('video');
	});

	it('其次 owned_by (v1/models 信号)', () => {
		expect(classifyModel({ id: 'gpt-something-new', owned_by: 'chat' })).toBe('chat');
	});

	it('id 前缀降级 — chat models', () => {
		expect(classifyModel({ id: 'claude-opus-4' })).toBe('chat');
		expect(classifyModel({ id: 'deepseek-v3.2' })).toBe('chat');
		expect(classifyModel({ id: 'gemini-3.1-pro-preview' })).toBe('chat');
		expect(classifyModel({ id: 'glm-4.7' })).toBe('chat');
		expect(classifyModel({ id: 'qwen3.6-plus' })).toBe('chat');
		expect(classifyModel({ id: 'kimi-k2.5' })).toBe('chat');
		expect(classifyModel({ id: 'gpt-5.4-pro' })).toBe('chat');
		expect(classifyModel({ id: 'o3-mini' })).toBe('chat');
		expect(classifyModel({ id: 'minimax-m2.5' })).toBe('chat');
		expect(classifyModel({ id: 'mimo-v2-flash' })).toBe('chat');
	});

	it('id 前缀降级 — image models', () => {
		expect(classifyModel({ id: 'gpt-image-2' })).toBe('image');
		expect(classifyModel({ id: 'dalle-3' })).toBe('image');
	});

	it('id 前缀降级 — video models', () => {
		expect(classifyModel({ id: 'seedance-2.0' })).toBe('video');
		expect(classifyModel({ id: 'seedance-1.5-pro' })).toBe('video');
		expect(classifyModel({ id: 'happyhorse-1.0-pro' })).toBe('video');
	});

	it('未知 id 返回 unknown', () => {
		expect(classifyModel({ id: 'something-totally-strange' })).toBe('unknown');
	});

	it('output_modalities 优先级高于 id 前缀', () => {
		// 如果 catalog 明确说 image，即使 id 看起来像 chat 也以 catalog 为准
		expect(classifyModel({ id: 'claude-image-experimental', output_modalities: ['image'] })).toBe('image');
	});
});
